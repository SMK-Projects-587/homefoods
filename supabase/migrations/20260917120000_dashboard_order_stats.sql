-- Dashboard summary stats: lifetime / this-month / last-month order counts
-- and revenue, in one row.
--
-- STANDALONE MIGRATION — same situation as
-- 20260719130000_atomic_order_status_history.sql: written from the
-- dashboard repo against this sibling project's real schema, not applied by
-- anything automatically. Review and run it yourself.
--
-- Context: the dashboard's Overview page wants a handful of order metrics
-- per period. Doing that with supabase-js alone means either fetching every
-- order row client-side (doesn't scale, forbidden by the dashboard's own
-- conventions) or firing off several separate count()/select() round trips
-- per period. This function computes all of it server-side with conditional
-- (FILTER) aggregates in a single pass over `orders` — one query, one round
-- trip, no new tables, no rollups to maintain.
--
-- "Orders" = non-cancelled orders (pending/confirmed/completed) — a measure
-- of order volume. "Revenue"/avg order value = completed orders only,
-- matching the realized-revenue convention already established by
-- product_sales_totals / order_revenue_daily in
-- 20260719140000_search_and_sales_analytics.sql. Average order value is
-- left for the client to compute (revenue / completed_count) rather than
-- repeating that division three times here.
--
-- security invoker (the default): only carries the same privileges the
-- calling `authenticated` role already has via "staff full access to
-- orders" in 20260705191531_rls_policies.sql — no privilege escalation.
create or replace function public.dashboard_order_stats()
returns table (
  lifetime_order_count integer,
  lifetime_completed_count integer,
  lifetime_revenue numeric,
  this_month_order_count integer,
  this_month_completed_count integer,
  this_month_revenue numeric,
  last_month_order_count integer,
  last_month_completed_count integer,
  last_month_revenue numeric
)
language sql
stable
security invoker
set search_path = ''
as $$
  select
    count(*) filter (where status <> 'cancelled')::integer,
    count(*) filter (where status = 'completed')::integer,
    coalesce(sum(total) filter (where status = 'completed'), 0),

    count(*) filter (
      where status <> 'cancelled' and created_at >= date_trunc('month', now())
    )::integer,
    count(*) filter (
      where status = 'completed' and created_at >= date_trunc('month', now())
    )::integer,
    coalesce(sum(total) filter (
      where status = 'completed' and created_at >= date_trunc('month', now())
    ), 0),

    count(*) filter (
      where status <> 'cancelled'
        and created_at >= date_trunc('month', now() - interval '1 month')
        and created_at < date_trunc('month', now())
    )::integer,
    count(*) filter (
      where status = 'completed'
        and created_at >= date_trunc('month', now() - interval '1 month')
        and created_at < date_trunc('month', now())
    )::integer,
    coalesce(sum(total) filter (
      where status = 'completed'
        and created_at >= date_trunc('month', now() - interval '1 month')
        and created_at < date_trunc('month', now())
    ), 0)
  from public.orders;
$$;

comment on function public.dashboard_order_stats() is
  'Order count + completed-order revenue for lifetime/this-month/last-month, one row, single pass over orders. security invoker: staff-only, same RLS as orders.';

grant execute on function public.dashboard_order_stats() to authenticated;
