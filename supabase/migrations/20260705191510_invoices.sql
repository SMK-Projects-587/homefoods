-- Invoices: legal/financial documents (India, GST). One per order, with
-- immutable snapshots of the billing details and line items, and sequential
-- numbering per Indian financial year. PDF generation and Cloudflare R2
-- hosting are future work — pdf_key is reserved for the R2 object key.

-- Counter table backing next_invoice_number(). One row per financial year;
-- the UPSERT below increments it atomically, so concurrent invoice inserts
-- can never draw the same number.
create table public.invoice_counters (
  fy         text primary key,          -- e.g. '2026-27'
  last_value integer not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.invoice_counters enable row level security;

create trigger invoice_counters_set_updated_at
  before update on public.invoice_counters
  for each row execute function public.set_updated_at();

create table public.invoices (
  id              bigint generated always as identity primary key,
  -- unique: one invoice per order. on delete restrict: an invoiced order is a
  -- legal record and must not be deletable out from under its invoice.
  order_id        bigint unique not null references public.orders (id) on delete restrict,
  invoice_number  text unique not null,
  status          text not null default 'draft'
                    check (status in ('draft','issued','void')),
  issued_at       timestamptz,
  -- Future Cloudflare R2 object key for the generated PDF.
  pdf_key         text not null default '',
  billing_name    text not null default '',
  billing_address jsonb not null default '{}',
  -- Frozen copy of the order items at issue time (invoices must not change
  -- when the order rows later do).
  line_items      jsonb not null default '[]',
  subtotal        numeric(10,2) not null default 0,
  discount        numeric(10,2) not null default 0,
  tax             numeric(10,2) not null default 0,
  total           numeric(10,2) not null default 0,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

alter table public.invoices enable row level security;

create trigger invoices_set_updated_at
  before update on public.invoices
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Sequential invoice numbering per Indian financial year (Apr 1 – Mar 31).
--
-- FY computation: April..December belong to the FY that starts that calendar
-- year; January..March belong to the FY that started the previous year. The
-- label is "<start year>-<last two digits of end year>", e.g. June 2026 ->
-- '2026-27', February 2027 -> '2026-27'. The date is taken in Asia/Kolkata,
-- since the FY boundary is an Indian legal boundary, not a UTC one.
--
-- The INSERT ... ON CONFLICT DO UPDATE ... RETURNING on invoice_counters is
-- a single atomic statement: under concurrency the second transaction blocks
-- on the row lock and then reads the incremented value, so numbers are gap-
-- free per FY and can never duplicate.
-- ---------------------------------------------------------------------------
create or replace function public.next_invoice_number()
returns text
language plpgsql
as $$
declare
  today    date := (now() at time zone 'Asia/Kolkata')::date;
  fy_start integer;
  fy_label text;
  seq      integer;
begin
  fy_start := case when extract(month from today) >= 4
                   then extract(year from today)
                   else extract(year from today) - 1
              end;
  fy_label := fy_start::text || '-' || to_char((fy_start + 1) % 100, 'FM00');

  insert into public.invoice_counters as c (fy, last_value)
  values (fy_label, 1)
  on conflict (fy) do update
    set last_value = c.last_value + 1
  returning c.last_value into seq;

  return 'HF/' || fy_label || '/' || lpad(seq::text, 4, '0');
end;
$$;

comment on function public.next_invoice_number() is
  'Next sequential invoice number per Indian financial year, e.g. HF/2026-27/0001. Atomic via UPSERT on invoice_counters.';

create or replace function public.invoices_set_invoice_number()
returns trigger
language plpgsql
as $$
begin
  if new.invoice_number is null or new.invoice_number = '' then
    new.invoice_number := public.next_invoice_number();
  end if;
  return new;
end;
$$;

comment on function public.invoices_set_invoice_number() is
  'BEFORE INSERT: assign the next FY-sequential invoice number when blank.';

create trigger invoices_set_invoice_number
  before insert on public.invoices
  for each row execute function public.invoices_set_invoice_number();

-- TODO (future work): PDF generation edge function + R2 upload, and a guard
-- trigger making 'issued' invoices immutable except for status -> 'void'.
