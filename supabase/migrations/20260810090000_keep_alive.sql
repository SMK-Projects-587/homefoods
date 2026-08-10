-- ---------------------------------------------------------------------------
-- Free-tier auto-pause keep-alive.
--
-- Supabase free-tier projects pause after ~7 days with zero database
-- activity, and a paused project can't run pg_cron to un-pause itself (see
-- TODO.md). This is the preventive half of that problem: pg_cron writing
-- here once a day is real database activity, so the inactivity clock never
-- reaches the pause threshold in the first place. It does nothing to help an
-- *already*-paused project wake back up — only Pro tier (never pauses) or a
-- human clicking "resume" fixes that. Treat this as a stopgap, not a
-- replacement for upgrading before real traffic.
-- ---------------------------------------------------------------------------

create extension if not exists pg_cron;

create table public.keep_alive (
  id int primary key default 1,
  pinged_at timestamptz not null default now(),
  constraint keep_alive_singleton check (id = 1)
);

comment on table public.keep_alive is
  'Single row, updated daily by pg_cron purely to keep the free-tier project from auto-pausing. No application meaning — not read by the storefront or dashboard.';

insert into public.keep_alive default values;

-- RLS on with no policies: inaccessible through the anon/authenticated API
-- roles entirely. Only the cron job (runs as postgres, bypasses RLS) touches
-- this table.
alter table public.keep_alive enable row level security;

select cron.schedule(
  'keep_alive_daily',
  '0 3 * * *', -- 03:00 UTC daily
  $$update public.keep_alive set pinged_at = now() where id = 1$$
);
