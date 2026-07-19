-- Analytics tracking, phase 1: capture only.
--
-- Two independent pieces, queried directly via SQL/Studio for now — no
-- reporting UI yet, that's deliberately future work.
--
--   1. search_log + log_search(): what people actually search for on the
--      storefront, including zero-result terms (catalog gaps / unmet
--      demand). Aggregated, not raw events — one row per (day, normalized
--      term), upserted, so the table grows with distinct terms/day, not
--      with search volume. At this business's scale that's a handful of
--      rows a day, so this stays tiny indefinitely; no retention/pruning
--      needed.
--
--   2. product_sales_totals / order_revenue_daily: units sold and revenue.
--      No new tables — orders/order_items already have everything needed,
--      so these are plain views (security_invoker = true, so RLS still
--      applies to the querying role exactly as if they queried
--      orders/order_items directly: anon gets nothing, staff get
--      everything). Daily granularity on the revenue view is the "planned
--      computation" primitive — month/year are a trivial date_trunc group-by
--      on top whenever actually wanted, no separate rollup tables to
--      maintain.

-- ---------------------------------------------------------------------------
-- 1. search_log + log_search()
-- ---------------------------------------------------------------------------
create table public.search_log (
  day               date not null,
  term              text not null,
  search_count      integer not null default 1,
  zero_result_count integer not null default 0,
  -- Result count from the most recent search of this term on this day —
  -- cheap "is this still zero?" signal without needing per-search rows.
  last_result_count integer not null,
  primary key (day, term)
);

alter table public.search_log enable row level security;

-- Staff can read for reporting; nobody gets direct write access — all
-- writes go through log_search() below (SECURITY DEFINER), which
-- validates/normalizes input. No anon policy at all: RLS enabled + no
-- policy == no access, same posture as orders/order_items.
grant select on public.search_log to authenticated;

create policy "staff can read search_log"
  on public.search_log for select
  to authenticated
  using (true);

-- SECURITY DEFINER so anon (the storefront) never gets direct table access,
-- only this narrow, validated write path. set search_path = '' with fully
-- schema-qualified references throughout — required hardening for
-- SECURITY DEFINER functions (an unqualified search_path is a privilege-
-- escalation vector: a caller could otherwise shadow public.search_log with
-- an object on a schema earlier in their own search_path).
-- Parameters are p_-prefixed (matching update_order_status() in
-- 20260719130000_atomic_order_status_history.sql) because bare `term` would
-- collide with search_log.term: PL/pgSQL raises "column reference is
-- ambiguous" (42702) on `on conflict (day, term)` when a same-named
-- parameter is in scope.
create or replace function public.log_search(p_term text, p_result_count int)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_term text := lower(trim(p_term));
begin
  if v_term = '' or length(v_term) > 200
     or p_result_count is null or p_result_count < 0 then
    return;
  end if;

  insert into public.search_log (day, term, search_count, zero_result_count, last_result_count)
  values (current_date, v_term, 1, case when p_result_count = 0 then 1 else 0 end, p_result_count)
  on conflict (day, term) do update
    set search_count      = public.search_log.search_count + 1,
        zero_result_count = public.search_log.zero_result_count + excluded.zero_result_count,
        last_result_count = excluded.last_result_count;
end;
$$;

comment on function public.log_search(text, int) is
  'Anonymous-callable search logger: upserts a (day, term) counter row in search_log. SECURITY DEFINER so anon never gets direct table access; validates/normalizes input. Called once per committed storefront search (landing on /products?q=...), not per keystroke.';

grant execute on function public.log_search(text, int) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- 2. Sales & revenue views
-- ---------------------------------------------------------------------------

-- Grouped off order_items' own snapshot columns (product_name, variant_title,
-- sku), not joined back to products/product_variants — order_items is
-- snapshot-style by design (see 20260719120000_order_status_lifecycle.sql's
-- comment on order_status_history for the same pattern), so a later product
-- rename/delete must not change historical sales totals. variant_id is kept
-- for convenience (joining to a still-existing variant) but is nullable
-- (on delete set null) and NOT relied on alone for grouping.
create view public.product_sales_totals
  with (security_invoker = true)
as
select
  oi.variant_id,
  oi.product_name,
  oi.variant_title,
  oi.sku,
  sum(oi.quantity)::integer as units_sold,
  sum(oi.line_total) as revenue,
  count(distinct oi.order_id) as order_count,
  max(o.created_at) as last_sold_at
from public.order_items oi
join public.orders o on o.id = oi.order_id
where o.status = 'completed'
group by oi.variant_id, oi.product_name, oi.variant_title, oi.sku;

comment on view public.product_sales_totals is
  'Units sold / revenue per product variant, completed orders only. Grouped off order_items snapshot columns so renames/deletes of the live product do not change historical totals. security_invoker: staff-only, same RLS as orders/order_items.';

-- security_invoker only controls which role's RLS policies apply inside the
-- view — the querying role still separately needs table-level SELECT on the
-- view relation itself, same as any other table/view.
grant select on public.product_sales_totals to authenticated;

create view public.order_revenue_daily
  with (security_invoker = true)
as
select
  date_trunc('day', created_at)::date as day,
  status,
  count(*) as order_count,
  sum(total) as revenue
from public.orders
group by date_trunc('day', created_at)::date, status;

comment on view public.order_revenue_daily is
  'Daily order counts/revenue by status. completed = realized revenue, confirmed = pipeline, cancelled excluded from revenue math but visible for cancellation-rate checks. Roll up to month/year with date_trunc(''month''|''year'', day) on top as needed — no separate rollup table. security_invoker: staff-only, same RLS as orders.';

grant select on public.order_revenue_daily to authenticated;
