-- Order status lifecycle, payment tracking, and a status-transition audit
-- log.
--
-- STANDALONE MIGRATION — this dashboard repo has no supabase/migrations
-- history of its own; the schema lives in the sibling `homefoods` Supabase
-- project. This file is written to match that project's conventions
-- (verified directly against its migrations, notably
-- 20260705191500_orders.sql, 20260705191531_rls_policies.sql, and
-- 20260709172150_deletion_protection.sql) so it can be dropped into that
-- project's migrations folder and run as-is. Not applied automatically by
-- anything in this repo — review and run it yourself.
--
-- Context: staff previously changed orders.status via a completely open
-- dropdown (any value to any value, no rules). This replaces that with a
-- fixed 4-state lifecycle enforced by the dashboard app itself
-- (pending -> confirmed -> completed, and pending/confirmed -> cancelled).
-- The transition *rules* are deliberately NOT enforced here via trigger —
-- this project has exactly one client (the dashboard) — but the set of
-- valid status *values* still is, via CHECK, same as the constraint it
-- replaces.

-- ---------------------------------------------------------------------------
-- 1. Remap legacy status values onto the new set, then swap the CHECK
--    constraint. The remap must happen while the OLD constraint is still in
--    place (it already allows 'confirmed'; only dropping it unblocks
--    writing 'completed'), so: drop constraint -> remap -> add new
--    constraint. pending/cancelled rows are unchanged.
--
--    orders.status currently has an inline, unnamed CHECK
--    (`check (status in ('pending','confirmed','packed','delivered','cancelled'))`)
--    which Postgres names `orders_status_check` by default — verified
--    against 20260705191500_orders.sql. Drop that exact name; if the live
--    constraint was renamed, adjust before running.
-- ---------------------------------------------------------------------------
alter table public.orders drop constraint if exists orders_status_check;

update public.orders set status = 'confirmed' where status = 'packed';
update public.orders set status = 'completed' where status = 'delivered';

alter table public.orders
  add constraint orders_status_check
    check (status in ('pending', 'confirmed', 'completed', 'cancelled'));

-- ---------------------------------------------------------------------------
-- 2. Payment tracking — independent of orders.status, always optional (null
--    = not tracked/not set, a valid and expected state, not an error). No
--    workflow dependency: editable regardless of status, including on
--    completed/cancelled orders (e.g. marking a completed order refunded).
-- ---------------------------------------------------------------------------
alter table public.orders
  add column payment_status text
    check (payment_status is null or payment_status in ('unpaid', 'paid', 'refunded'));

comment on column public.orders.payment_status is
  'unpaid | paid | refunded | null. Independent of status — editable at any order status via the dashboard.';

-- ---------------------------------------------------------------------------
-- 3. Audit trail of every status transition (not payment changes). One row
--    per Confirm/Complete/Cancel action taken in the dashboard; reason is
--    populated only for -> cancelled transitions. Snapshot-style, same
--    shape as order_items: everything needed to read the row stands alone.
--
--    Append-only by design: no updated_at column, and (mirroring the
--    deletion-protection posture in 20260709172150_deletion_protection.sql)
--    staff get SELECT + INSERT only — no UPDATE, no DELETE. An audit log
--    that can be edited or erased by the same role it's auditing isn't one.
--
--    id/order_id use `bigint` to match orders.id
--    (`bigint generated always as identity`, per 20260705191500_orders.sql).
--    changed_by is a `uuid references auth.users(id)`, same pattern as
--    orders.created_by, populated from the dashboard's Supabase auth
--    session (session.user.id).
-- ---------------------------------------------------------------------------
create table public.order_status_history (
  id          bigint generated always as identity primary key,
  order_id    bigint not null references public.orders (id) on delete cascade,
  from_status text
                check (from_status is null or from_status in ('pending', 'confirmed', 'completed', 'cancelled')),
  to_status   text not null
                check (to_status in ('pending', 'confirmed', 'completed', 'cancelled')),
  reason      text,
  -- Which staff member performed the transition.
  changed_by  uuid references auth.users (id) on delete set null,
  created_at  timestamptz not null default now()
);

alter table public.order_status_history enable row level security;

create index order_status_history_order_id_idx on public.order_status_history (order_id);

-- rls_policies.sql's blanket sequence grant already ran before this table
-- existed, so its identity sequence needs its own grant here.
grant select, insert
  on public.order_status_history
  to authenticated, service_role;

grant usage, select on all sequences in schema public to authenticated, service_role;

create policy "staff can read order_status_history"
  on public.order_status_history for select
  to authenticated
  using (true);

create policy "staff can insert order_status_history"
  on public.order_status_history for insert
  to authenticated
  with check (true);
