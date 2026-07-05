-- Product search RPC, callable from supabase-js as
--   supabase.rpc('search_products', { term: 'avakaya', ... })
--
-- Ports the Django search endpoint (backend/products/views.py::
-- _build_list_queryset) semantics:
--   * match:  search_vector @@ websearch_to_tsquery('simple', term)
--             OR term <% name  (pg_trgm word-similarity fallback for typos).
--             Django used `%` (whole-string similarity, threshold 0.3), but
--             that demonstrably misses typos against multi-word names:
--             similarity('Avakaya Mango Pickle', 'avakya') = 0.22 < 0.3.
--             word_similarity compares the term against the best-matching
--             word in the name (0.57 for the same pair), so `<%` with the
--             threshold pinned to 0.3 below (default is 0.6) is a strictly
--             better port of the intent "typos still find the product".
--   * order:  ts_rank(search_vector, query) DESC NULLS LAST, id DESC
--             (trigram-only matches have rank 0/near-0, so full-text name
--             matches always rank first — same as Django)
--   * filters: category slug, in_stock (tri-state: null = no filter)
--
-- Return shape: RETURNS TABLE with explicit columns — the product row plus
-- the default variant's price/compare_at_price/in_stock and the primary image
-- path, which is what a product list card needs. Chosen over `setof json` so
-- PostgREST/typegen expose real column types to the React dashboard.
--
-- SECURITY INVOKER on purpose: the function runs with the caller's role, so
-- the RLS policies apply inside it — anon only searches active products,
-- authenticated staff search everything (mirrors Django staff-vs-public
-- visibility with zero duplicated logic here).

create or replace function public.search_products(
  term            text,
  category_slug   text default null,
  in_stock_filter boolean default null,
  max_results     int default 24,
  offset_by       int default 0
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
  order by ts_rank(p.search_vector, websearch_to_tsquery('simple', term)) desc nulls last,
           p.id desc
  limit max_results
  offset offset_by;
$$;

comment on function public.search_products(text, text, boolean, int, int) is
  'Weighted full-text product search with trigram typo fallback; Django search endpoint port. SECURITY INVOKER so RLS governs visibility.';
