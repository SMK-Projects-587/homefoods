-- Product variants: the sellable unit. Today variants differ by weight
-- ("250 g" / "500 g" / "1 kg"); the `attributes` jsonb keeps the mechanism
-- generic (color, size, anything later) with no hard-coded attribute keys.

create table public.product_variants (
  id               bigint generated always as identity primary key,
  product_id       bigint not null references public.products (id) on delete cascade,
  -- Human label shown in the dashboard and on invoices, e.g. "500 g", "Red / Large".
  title            text not null,
  -- Free-form key -> value, e.g. {"weight": "500 g"} or {"color": "red", "size": "L"}.
  attributes       jsonb not null default '{}',
  sku              text unique not null,
  price            numeric(10,2) not null check (price >= 0),
  -- "On sale" when compare_at_price > price (same semantics as Django is_on_sale).
  compare_at_price numeric(10,2) check (compare_at_price >= 0),
  stock            integer not null default 0 check (stock >= 0),
  -- Manual availability override, independent of the stock counter (mirrors Django).
  in_stock         boolean not null default true,
  is_active        boolean not null default true,
  is_default       boolean not null default false,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

alter table public.product_variants enable row level security;

create index product_variants_product_id_idx on public.product_variants (product_id);
create index product_variants_attributes_idx on public.product_variants using gin (attributes);

-- At most one default variant per product.
create unique index product_variants_one_default_per_product
  on public.product_variants (product_id) where is_default;

-- Two variants of the same product may not share identical attributes.
create unique index product_variants_product_attributes_key
  on public.product_variants (product_id, attributes);

create trigger product_variants_set_updated_at
  before update on public.product_variants
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- SKU auto-generation, porting Django's f"HF-{pk:06d}" convention.
-- Identity columns are assigned before BEFORE-row triggers run, so new.id is
-- already available here; deriving the SKU from it in the same statement is
-- inherently race-safe (no lookup loop needed, unlike the slug case).
-- ---------------------------------------------------------------------------
create or replace function public.product_variants_set_sku()
returns trigger
language plpgsql
as $$
begin
  if new.sku is null or new.sku = '' then
    new.sku := 'HF-' || lpad(new.id::text, 6, '0');
  end if;
  return new;
end;
$$;

comment on function public.product_variants_set_sku() is
  'BEFORE INSERT: when sku is blank, generate HF-<zero-padded id> (Django HF-{pk:06d} convention).';

create trigger product_variants_set_sku
  before insert on public.product_variants
  for each row execute function public.product_variants_set_sku();
