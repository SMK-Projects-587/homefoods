-- ---------------------------------------------------------------------------
-- Storefront cache revalidation webhook.
--
-- The storefront (Next.js, Cache Components) caches catalog data with `use
-- cache` + cacheTag("products"|"categories") and only refreshes when its
-- /api/revalidate route calls revalidateTag(...). This migration fires that
-- route from the DB, so ANY catalog change — dashboard, direct SQL, a re-seed —
-- invalidates the storefront cache without a redeploy.
--
-- ENVIRONMENTS: this migration is committed, so it installs on every stack
-- (local `db reset` and hosted `db push`). But the target URL and shared secret
-- are environment-specific and secret, so they are NOT hardcoded here — the
-- trigger reads them from Supabase Vault and SILENTLY NO-OPS when either is
-- absent. Local dev leaves them unset (dev has no persistent cache anyway), so
-- nothing fires. Configure prod ONCE with:
--
--   select vault.create_secret(
--     'https://<storefront-domain>/api/revalidate', 'storefront_revalidate_url');
--   select vault.create_secret(
--     '<same value as the storefront REVALIDATE_SECRET env>', 'storefront_revalidate_secret');
--
-- (Update later with vault.update_secret(id, new_value).)
-- ---------------------------------------------------------------------------

-- Async, non-blocking HTTP from Postgres. Already present on Supabase; the
-- if-not-exists keeps this idempotent and safe on the local stack.
create extension if not exists pg_net;

create or replace function public.storefront_revalidate()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_url    text;
  v_secret text;
begin
  -- Vault holds the config on prod only; unset elsewhere → no-op.
  select decrypted_secret into v_url
    from vault.decrypted_secrets where name = 'storefront_revalidate_url';
  select decrypted_secret into v_secret
    from vault.decrypted_secrets where name = 'storefront_revalidate_secret';

  if v_url is null or v_secret is null then
    return null;
  end if;

  -- Fire-and-forget: pg_net queues the request on a background worker, so the
  -- triggering transaction never waits on the storefront. The route maps the
  -- table name to a cache tag (product_variants/images → "products").
  perform net.http_post(
    url     := v_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-revalidate-secret', v_secret
    ),
    body := jsonb_build_object(
      'table', tg_table_name,
      'type', tg_op
    )
  );
  return null;
end;
$$;

comment on function public.storefront_revalidate() is
  'AFTER-STATEMENT trigger: POSTs the changed table name to the storefront /api/revalidate route (URL + secret from Vault; no-ops when unset, e.g. local).';

-- Statement-level (not row-level): one HTTP call per write statement regardless
-- of how many rows it touched — cheap, and bulk operations (seed, bulk price
-- update) don't fan out into hundreds of requests. revalidateTag is idempotent
-- + stale-while-revalidate, so an occasional extra call is harmless.
create trigger revalidate_storefront
  after insert or update or delete on public.products
  for each statement execute function public.storefront_revalidate();

create trigger revalidate_storefront
  after insert or update or delete on public.categories
  for each statement execute function public.storefront_revalidate();

create trigger revalidate_storefront
  after insert or update or delete on public.product_variants
  for each statement execute function public.storefront_revalidate();

create trigger revalidate_storefront
  after insert or update or delete on public.product_images
  for each statement execute function public.storefront_revalidate();
