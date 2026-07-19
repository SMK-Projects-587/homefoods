-- Invoice issuance: issue_invoice() RPC + immutability guard.
--
-- issue_invoice() does the atomic part (snapshot order + order_items into a
-- new invoices row, get the FY-sequential number). PDF rendering and object
-- storage upload can't happen in Postgres, so that's the generate-invoice
-- edge function's job — it calls this RPC first, then renders/uploads the
-- PDF and attaches pdf_key with a plain UPDATE afterward. The guard trigger
-- below is written to allow exactly that follow-up UPDATE while still
-- locking down everything else once issued.
--
-- security invoker (not definer): staff (authenticated) already has
-- INSERT/SELECT on orders/order_items/invoices via the policies in
-- 20260705191531_rls_policies.sql and 20260709172150_deletion_protection.sql
-- — same reasoning as update_order_status() in
-- 20260719130000_atomic_order_status_history.sql, no privilege escalation
-- needed or wanted here.
create or replace function public.issue_invoice(p_order_id bigint)
returns public.invoices
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_order   public.orders;
  v_items   jsonb;
  v_invoice public.invoices;
begin
  select * into v_order from public.orders where id = p_order_id;
  if not found then
    raise exception 'Order % not found', p_order_id;
  end if;

  -- Eligible only when both hold: order confirmed/completed AND paid.
  if v_order.status not in ('confirmed', 'completed') or v_order.payment_status is distinct from 'paid' then
    raise exception
      'Order % must be confirmed/completed and marked paid to invoice (currently status="%", payment_status="%")',
      p_order_id, v_order.status, coalesce(v_order.payment_status, 'null');
  end if;

  select coalesce(jsonb_agg(jsonb_build_object(
           'product_name',  oi.product_name,
           'variant_title', oi.variant_title,
           'sku',           oi.sku,
           'unit_price',    oi.unit_price,
           'quantity',      oi.quantity,
           'line_total',    oi.line_total
         ) order by oi.id), '[]'::jsonb)
    into v_items
  from public.order_items oi
  where oi.order_id = p_order_id;

  -- order_id is UNIQUE on invoices — a second call for an already-invoiced
  -- order raises a standard 23505 unique_violation here, which the calling
  -- edge function specifically checks for (see generate-invoice/index.ts) to
  -- resume a prior attempt that got an invoice number but never finished
  -- uploading its PDF, rather than treating it as a hard failure.
  insert into public.invoices (
    order_id, status, issued_at, billing_name, billing_address,
    line_items, subtotal, discount, tax, total
  ) values (
    p_order_id, 'issued', now(), v_order.customer_name, v_order.shipping_address,
    v_items, v_order.subtotal, v_order.discount, v_order.tax, v_order.total
  )
  returning * into v_invoice;

  return v_invoice;
end;
$$;

comment on function public.issue_invoice(bigint) is
  'Snapshots an order + its items into a new issued invoices row (FY-sequential number assigned by the existing invoices_set_invoice_number trigger). Does not render/store the PDF — see the generate-invoice edge function.';

grant execute on function public.issue_invoice(bigint) to authenticated;

-- ---------------------------------------------------------------------------
-- Immutability guard: once status = 'issued', the legal/financial snapshot
-- fields can never change again — only pdf_key (attached by
-- generate-invoice right after this function returns, so must stay
-- writable) and a status -> 'void' transition are allowed. 'draft' rows
-- (not currently created by anything, but the column supports it for
-- possible future use) remain fully editable.
-- ---------------------------------------------------------------------------
create or replace function public.invoices_guard_issued()
returns trigger
language plpgsql
as $$
begin
  if old.status = 'issued' then
    if new.status is distinct from 'issued' and new.status is distinct from 'void' then
      raise exception 'issued invoices can only transition to void';
    end if;
    if new.order_id         is distinct from old.order_id
       or new.invoice_number is distinct from old.invoice_number
       or new.issued_at      is distinct from old.issued_at
       or new.billing_name   is distinct from old.billing_name
       or new.billing_address is distinct from old.billing_address
       or new.line_items     is distinct from old.line_items
       or new.subtotal       is distinct from old.subtotal
       or new.discount       is distinct from old.discount
       or new.tax            is distinct from old.tax
       or new.total          is distinct from old.total then
      raise exception 'issued invoices are immutable except status -> void and attaching pdf_key';
    end if;
  end if;
  return new;
end;
$$;

comment on function public.invoices_guard_issued() is
  'BEFORE UPDATE guard: once an invoice is issued, only pdf_key and a status -> void transition may change.';

create trigger invoices_guard_issued
  before update on public.invoices
  for each row execute function public.invoices_guard_issued();
