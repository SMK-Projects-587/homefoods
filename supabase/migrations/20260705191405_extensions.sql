-- Extensions and shared helpers used by every later migration.

-- pg_trgm powers the typo-tolerant trigram fallback in product search
-- (`name % term`) and the gin_trgm_ops index on products.name.
create extension if not exists pg_trgm with schema extensions;

-- Shared updated_at maintenance. Every table attaches this as a
-- BEFORE UPDATE trigger instead of repeating the logic per-table.
-- (Own helper instead of the moddatetime extension so the behaviour is
-- visible in the repo and not tied to an extension version.)
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

comment on function public.set_updated_at() is
  'Trigger helper: stamps updated_at on every UPDATE. Attach as BEFORE UPDATE FOR EACH ROW.';

-- Shared slugifier, mirroring Django''s slugify() closely enough for this
-- catalog: lowercase, runs of non-alphanumerics collapsed to a single
-- hyphen, leading/trailing hyphens trimmed.
create or replace function public.slugify(input text)
returns text
language sql
immutable
as $$
  select trim(both '-' from regexp_replace(lower(coalesce(input, '')), '[^a-z0-9]+', '-', 'g'));
$$;

comment on function public.slugify(text) is
  'Lowercase, replace runs of non-alphanumerics with "-", trim hyphens. Used by slug auto-generation triggers.';
