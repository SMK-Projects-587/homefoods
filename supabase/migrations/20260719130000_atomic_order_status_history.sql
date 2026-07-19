-- Make order-status transitions atomic with their audit-log row.
--
-- STANDALONE MIGRATION — same situation as
-- 20260719120000_order_status_lifecycle.sql: written from this dashboard
-- repo against this sibling project's real schema, not applied by anything
-- automatically. Review and run it yourself.
--
-- Context: updateOrderStatus() in the dashboard currently does this as two
-- separate supabase-js calls — update orders.status, then insert into
-- order_status_history. Those aren't atomic: if the insert fails after the
-- update succeeds, the order's status changes with no audit row for it,
-- silently defeating the point of the log.
--
-- A trigger doesn't cleanly fix this: AFTER UPDATE triggers only see
-- NEW/OLD column values, and `reason` (only meaningful for -> cancelled)
-- isn't a column on orders — passing it into a trigger would mean either a
-- new persisted column purely for plumbing, or session-local
-- set_config()/current_setting() calls that supabase-js can't compose with
-- a plain .update(). A single RPC function sidesteps both: reason is just a
-- normal argument, and the whole thing runs in one transaction, so it's
-- atomic by construction. `changed_by` is derived from auth.uid() inside
-- the function rather than passed by the client, which is also a
-- correctness improvement — the old client-supplied changedBy could claim
-- to be any user id.
--
-- security invoker (the default) is used deliberately: the function only
-- carries the same privileges the calling `authenticated` role already has
-- (per 20260719120000_order_status_lifecycle.sql's grants/RLS on both
-- orders and order_status_history) — no privilege escalation.
create or replace function public.update_order_status(
  p_order_id bigint,
  p_from_status text,
  p_to_status text,
  p_reason text default null
)
returns public.orders
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_order public.orders;
begin
  -- Same optimistic-lock check the app-level code did: if the row's status
  -- already moved on since the caller read it, this matches zero rows and
  -- the exception below fires instead of silently applying a transition
  -- (and history row) on top of a stale from_status.
  update public.orders
     set status = p_to_status
   where id = p_order_id
     and status = p_from_status
   returning * into v_order;

  if not found then
    raise exception
      'Order % is not currently "%" (concurrent change, or it already transitioned)',
      p_order_id, p_from_status
      using errcode = 'P0002';
  end if;

  insert into public.order_status_history (order_id, from_status, to_status, reason, changed_by)
  values (p_order_id, p_from_status, p_to_status, p_reason, auth.uid());

  return v_order;
end;
$$;

grant execute on function public.update_order_status(bigint, text, text, text) to authenticated;
