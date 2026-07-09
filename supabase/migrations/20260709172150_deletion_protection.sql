-- ---------------------------------------------------------------------------
-- Deletion protection.
--
-- Business rule (owner, 2026-07): categories, products, orders and invoices
-- are NEVER deleted — records are deactivated (catalog) or cancelled/voided
-- (orders/invoices) instead. Enforced at the database, not in the dashboard,
-- so no client bug or curl session can violate it:
--
--   * the DELETE privilege is revoked from `authenticated` on those tables
--     (PostgREST returns 42501 "permission denied"), and
--   * the staff RLS policies are re-created without DELETE, so the rule
--     survives even if someone later re-grants broad table privileges.
--
-- Still deletable by staff: product_variants, product_images, order_items —
-- routine catalog/data-entry management. Order history is safe regardless
-- because order_items snapshot everything and invoices freeze line_items.
--
-- Escape hatch (deliberate): the service_role key and direct SQL keep
-- DELETE. A tiny business needs a way to remove a genuinely mistaken record;
-- that is an owner-level operation, not a dashboard one.
-- ---------------------------------------------------------------------------

-- Categories previously had no way to be retired except deletion; deletion is
-- now forbidden, so they get the same deactivation flag products have.
alter table public.categories
  add column is_active boolean not null default true;

-- Anon (future storefront) only sees active categories. Products keep their
-- own is_active as the sole visibility switch: deactivating a category hides
-- the grouping but does NOT hide its products (deactivate those explicitly
-- if that is the intent).
drop policy "anon can read categories" on public.categories;

create policy "anon can read active categories"
  on public.categories for select
  to anon
  using (is_active);

-- ---------- revoke the privilege ----------
revoke delete on table
  public.categories,
  public.products,
  public.orders,
  public.invoices,
  public.invoice_counters
from authenticated;

-- ---------- re-create staff policies without DELETE ----------
-- (drop the FOR ALL policies, replace with explicit select/insert/update)

drop policy "staff full access to categories" on public.categories;
create policy "staff can read categories"
  on public.categories for select to authenticated using (true);
create policy "staff can insert categories"
  on public.categories for insert to authenticated with check (true);
create policy "staff can update categories"
  on public.categories for update to authenticated using (true) with check (true);

drop policy "staff full access to products" on public.products;
create policy "staff can read products"
  on public.products for select to authenticated using (true);
create policy "staff can insert products"
  on public.products for insert to authenticated with check (true);
create policy "staff can update products"
  on public.products for update to authenticated using (true) with check (true);

drop policy "staff full access to orders" on public.orders;
create policy "staff can read orders"
  on public.orders for select to authenticated using (true);
create policy "staff can insert orders"
  on public.orders for insert to authenticated with check (true);
create policy "staff can update orders"
  on public.orders for update to authenticated using (true) with check (true);

drop policy "staff full access to invoices" on public.invoices;
create policy "staff can read invoices"
  on public.invoices for select to authenticated using (true);
create policy "staff can insert invoices"
  on public.invoices for insert to authenticated with check (true);
create policy "staff can update invoices"
  on public.invoices for update to authenticated using (true) with check (true);

drop policy "staff full access to invoice_counters" on public.invoice_counters;
create policy "staff can read invoice_counters"
  on public.invoice_counters for select to authenticated using (true);
create policy "staff can insert invoice_counters"
  on public.invoice_counters for insert to authenticated with check (true);
create policy "staff can update invoice_counters"
  on public.invoice_counters for update to authenticated using (true) with check (true);

-- TODO (future hardening, deliberately not now):
--   * make 'issued' invoices immutable except status -> 'void'
--   * forbid deleting order_items of an invoiced order
