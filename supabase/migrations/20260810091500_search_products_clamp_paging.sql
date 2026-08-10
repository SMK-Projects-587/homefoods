-- Clamp search_products() paging params server-side.
--
-- max_results/offset_by came straight from the caller with no bound — the
-- storefront only ever asks for small pages, but the RPC is reachable
-- directly with the anon key, so a max_results of e.g. 1000000 could be sent
-- to force an expensive scan/sort. Same signature as before, so CREATE OR
-- REPLACE (no DROP needed).
--
-- Also drops the function-level `set pg_trgm.word_similarity_threshold`:
-- the hosted project's migration role no longer has privilege to attach
-- that GUC to a function (discovered pushing this migration — SQLSTATE
-- 42501, "permission denied to set parameter"). That's a platform-side
-- tightening, not something this project changed, and it would have blocked
-- *any* future edit to this function, not just this one. Fixed by calling
-- word_similarity() explicitly at the same 0.3 threshold instead of relying
-- on the `<%` operator's session-GUC-controlled threshold — same matching
-- behaviour, no privileged SET required.

create or replace function public.search_products(
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
          or extensions.word_similarity(term, p.name) > 0.3
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
  -- Clamped: 1..100 results per page, offset never negative.
  limit least(greatest(max_results, 1), 100)
  offset greatest(offset_by, 0);
$$;

comment on function public.search_products(text, text, boolean, int, int, boolean) is
  'Weighted full-text product search with trigram typo fallback (word_similarity() at a fixed 0.3 threshold, called explicitly rather than via a function-level GUC — see migration comment); Django search endpoint port. SECURITY INVOKER so RLS governs visibility. require_variant=true (storefront) hides products with no caller-visible active variant. max_results/offset_by clamped server-side (1-100 / >=0).';
