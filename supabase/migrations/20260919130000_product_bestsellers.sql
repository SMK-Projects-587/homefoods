-- Bestsellers: currently the homepage just shows products.slice(0, 8) --
-- whatever getProducts() happens to return first (alphabetical) -- with no
-- way to actually curate it from the dashboard or the DB. Two columns:
-- a flag, and an optional rank for controlling display order among flagged
-- products. Staff dashboard needs its own follow-up to expose this (out of
-- scope for the storefront repo); until then, toggle directly via SQL:
--   update public.products set is_bestseller = true, bestseller_rank = 1
--   where slug = '...';
alter table public.products
  add column is_bestseller boolean not null default false,
  add column bestseller_rank integer;

-- Only meaningful among bestsellers -- keep the invariant explicit rather
-- than allowing a stray rank on a non-bestseller row.
alter table public.products
  add constraint products_bestseller_rank_requires_flag
  check (bestseller_rank is null or is_bestseller);

create index products_bestseller_idx
  on public.products (bestseller_rank)
  where is_bestseller;
