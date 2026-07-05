-- Products: the catalog entry customers browse. Unlike the Django Product,
-- this table carries NO price/sku/stock/weight — every sellable attribute
-- lives on product_variants. A product is just identity + copy + search.

create table public.products (
  id               bigint generated always as identity primary key,
  name             text not null,
  slug             text unique not null,
  category_id      bigint references public.categories (id) on delete set null,
  description      text not null default '',
  keywords         text[] not null default '{}',
  meta_title       text not null default '',
  meta_description text not null default '',
  is_active        boolean not null default true,
  search_vector    tsvector,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

alter table public.products enable row level security;

create index products_search_vector_idx on public.products using gin (search_vector);
-- Trigram index backing the typo-tolerant `name % term` fallback in search_products().
create index products_name_trgm_idx on public.products using gin (name extensions.gin_trgm_ops);
create index products_category_id_idx on public.products (category_id);

create trigger products_set_updated_at
  before update on public.products
  for each row execute function public.set_updated_at();

create or replace function public.products_set_slug()
returns trigger
language plpgsql
as $$
begin
  if new.slug is null or new.slug = '' then
    new.slug := public.generate_unique_slug('public.products', new.name);
  end if;
  return new;
end;
$$;

comment on function public.products_set_slug() is
  'BEFORE INSERT: auto-generate slug from name when the client leaves it blank.';

create trigger products_set_slug
  before insert on public.products
  for each row execute function public.products_set_slug();

-- ---------------------------------------------------------------------------
-- Search vector maintenance. Exact port of backend/products/search.py:
--   weight A: name
--   weight A: keywords joined with spaces
--   weight B: description
-- all with the 'simple' regconfig — NOT 'english' — so product names like
-- "Avakaya" or "Gongura" are indexed verbatim instead of being stemmed away.
--
-- This must be a trigger, not a generated column: array_to_string() is only
-- STABLE, so Postgres rejects it inside GENERATED ALWAYS AS expressions.
-- ---------------------------------------------------------------------------
create or replace function public.products_set_search_vector()
returns trigger
language plpgsql
as $$
begin
  new.search_vector :=
      setweight(to_tsvector('simple', coalesce(new.name, '')), 'A')
   || setweight(to_tsvector('simple', array_to_string(new.keywords, ' ')), 'A')
   || setweight(to_tsvector('simple', coalesce(new.description, '')), 'B');
  return new;
end;
$$;

comment on function public.products_set_search_vector() is
  'Maintains products.search_vector (simple config, A=name, A=keywords, B=description). Trigger because array_to_string is not immutable.';

create trigger products_set_search_vector
  before insert or update on public.products
  for each row execute function public.products_set_search_vector();
