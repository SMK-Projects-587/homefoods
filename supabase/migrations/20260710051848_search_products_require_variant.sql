-- Add require_variant to search_products().
--
-- A product whose variants are all inactive (or missing) is visible to anon
-- through the products policy, but its variants are not — so the storefront
-- received cards with no price and no purchasable option ("Tamrind Pickle"
-- during review). The storefront must never fetch such products; the
-- dashboard still must (staff search for products they haven't finished
-- setting up). Hence a flag, defaulting to the old behaviour:
--   * require_variant => false  — unchanged, dashboard callers unaffected
--   * require_variant => true   — only products with at least one active
--     variant VISIBLE TO THE CALLER (SECURITY INVOKER, so RLS applies inside
--     the EXISTS: anon additionally needs the product to be active)
--
-- Adding a defaulted parameter changes the function signature, and CREATE OR
-- REPLACE would create an overload instead of replacing — drop the old
-- signature explicitly.

drop function if exists public.search_products(text, text, boolean, int, int);

create function public.search_products(
  term            text,
  category_slug   text default null,
  in_stock_filter boolean default null,
  max_results     int default 24,
  offset_by       int default 0,
  require_variant boolean default false
)
returns table (
  id                 bigint,
  name               text,
  slug               text,
  category_id        bigint,
  category_slug_out  text,
  description        text,
  keywords           text[],
  is_active          boolean,
  price              numeric(10,2),
  compare_at_price   numeric(10,2),
  in_stock           boolean,
  primary_image_path text,
  rank               real,
  created_at         timestamptz
)
language sql
stable
security invoker
set search_path = ''
set pg_trgm.word_similarity_threshold = 0.3
as $$
  select p.id,
         p.name,
         p.slug,
         p.category_id,
         c.slug as category_slug_out,
         p.description,
         p.keywords,
         p.is_active,
         dv.price,
         dv.compare_at_price,
         dv.in_stock,
         coalesce(pi.image_path, '') as primary_image_path,
         ts_rank(p.search_vector, websearch_to_tsquery('simple', term)) as rank,
         p.created_at
  from public.products p
  left join public.categories c on c.id = p.category_id
  -- Default variant (falls back to the lowest-id active variant when no
  -- variant is flagged is_default).
  left join lateral (
    select v.price, v.compare_at_price, v.in_stock
    from public.product_variants v
    where v.product_id = p.id
      and v.is_active
    order by v.is_default desc, v.id
    limit 1
  ) dv on true
  left join lateral (
    select i.image_path
    from public.product_images i
    where i.product_id = p.id
      and i.is_primary
    limit 1
  ) pi on true
  where (
          p.search_vector @@ websearch_to_tsquery('simple', term)
          or term operator(extensions.<%) p.name
        )
    and (search_products.category_slug is null or c.slug = search_products.category_slug)
    and (in_stock_filter is null or dv.in_stock = in_stock_filter)
    and (not require_variant or exists (
          select 1
          from public.product_variants v
          where v.product_id = p.id
            and v.is_active
        ))
  order by ts_rank(p.search_vector, websearch_to_tsquery('simple', term)) desc nulls last,
           p.id desc
  limit max_results
  offset offset_by;
$$;

comment on function public.search_products(text, text, boolean, int, int, boolean) is
  'Weighted full-text product search with trigram typo fallback; Django search endpoint port. SECURITY INVOKER so RLS governs visibility. require_variant=true (storefront) hides products with no caller-visible active variant.';
