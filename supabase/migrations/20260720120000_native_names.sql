-- Telugu (native-script) display names for products and categories. The
-- storefront shows this beneath the English name on cards, category tiles and
-- product pages. Optional/nullable: rows without a translation simply render
-- no second line.
alter table public.categories
  add column native_name text;

alter table public.products
  add column native_name text;

comment on column public.categories.native_name is
  'Optional Telugu display name shown beneath the English name in the storefront.';
comment on column public.products.native_name is
  'Optional Telugu display name shown beneath the English name in the storefront.';
