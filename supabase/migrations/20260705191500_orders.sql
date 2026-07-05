-- Orders, recorded manually by staff in the dashboard. No payment
-- integration, no customer accounts — customer details are plain snapshot
-- columns, and the shipping address is a free-form jsonb snapshot using the
-- Django Address field names as keys:
--   {"line1": ..., "line2": ..., "city": ..., "state": ..., "postal_code": ..., "country": ...}

create table public.orders (
  id               bigint generated always as identity primary key,
  order_number     text unique not null,
  -- text + CHECK instead of a Postgres enum: adding/renaming states later is
  -- a one-line constraint swap instead of an enum surgery migration.
  status           text not null default 'pending'
                     check (status in ('pending','confirmed','packed','delivered','cancelled')),
  customer_name    text not null,
  customer_phone   text not null default '',
  customer_email   text not null default '',
  shipping_address jsonb not null default '{}',
  notes            text not null default '',
  subtotal         numeric(10,2) not null default 0,
  discount         numeric(10,2) not null default 0,
  shipping_fee     numeric(10,2) not null default 0,
  tax              numeric(10,2) not null default 0,
  total            numeric(10,2) not null default 0,
  -- Which staff member recorded the order.
  created_by       uuid references auth.users (id) on delete set null,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

alter table public.orders enable row level security;

create index orders_created_by_idx on public.orders (created_by);
create index orders_status_idx on public.orders (status);

create trigger orders_set_updated_at
  before update on public.orders
  for each row execute function public.set_updated_at();

-- Same pattern as variant SKUs: identity value is available in the BEFORE
-- trigger, so the order number derives from it race-free.
create or replace function public.orders_set_order_number()
returns trigger
language plpgsql
as $$
begin
  if new.order_number is null or new.order_number = '' then
    new.order_number := 'ORD-' || lpad(new.id::text, 6, '0');
  end if;
  return new;
end;
$$;

comment on function public.orders_set_order_number() is
  'BEFORE INSERT: when order_number is blank, generate ORD-<zero-padded id>.';

create trigger orders_set_order_number
  before insert on public.orders
  for each row execute function public.orders_set_order_number();

-- ---------------------------------------------------------------------------
-- Order items. Everything needed to display or invoice the line is snapshot
-- into the row (product_name/variant_title/sku/attributes/unit_price), so the
-- order history survives variant edits or deletions — hence the nullable
-- variant_id with ON DELETE SET NULL.
-- ---------------------------------------------------------------------------
create table public.order_items (
  id            bigint generated always as identity primary key,
  order_id      bigint not null references public.orders (id) on delete cascade,
  variant_id    bigint references public.product_variants (id) on delete set null,
  product_name  text not null,
  variant_title text not null,
  sku           text not null,
  attributes    jsonb not null default '{}',
  unit_price    numeric(10,2) not null,
  quantity      integer not null check (quantity > 0),
  line_total    numeric(10,2) not null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

alter table public.order_items enable row level security;

create index order_items_order_id_idx on public.order_items (order_id);
create index order_items_variant_id_idx on public.order_items (variant_id);

create trigger order_items_set_updated_at
  before update on public.order_items
  for each row execute function public.set_updated_at();

-- TODO (future work, deliberately out of scope for now per the owner):
--   * trigger to recalculate orders.subtotal/total from order_items and
--     validate line_total = unit_price * quantity
--   * stock decrement on confirmed orders / restock on cancellation
