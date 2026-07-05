-- Categories: top-level product grouping. Mirrors backend/products/models.py
-- Category, with the image stored as a Supabase Storage object path.

create table public.categories (
  id          bigint generated always as identity primary key,
  name        text not null,
  slug        text unique not null,
  description text not null default '',
  -- Path of the object inside the `product-images` bucket, not a URL.
  image_path  text not null default '',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table public.categories enable row level security;

create trigger categories_set_updated_at
  before update on public.categories
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Unique slug generation, shared by categories and products.
--
-- Ports Django's _unique_slug (slugify + "-1"/"-2" suffix on collision) but
-- fixes its race: in Django two concurrent saves can both see a slug as free
-- and one then dies on the unique index. Here a transaction-scoped advisory
-- lock keyed on (table, base slug) serializes only the inserts that would
-- collide; the second transaction waits until the first commits, so its
-- existence check sees the newly committed row.
-- ---------------------------------------------------------------------------
create or replace function public.generate_unique_slug(tbl regclass, source_name text)
returns text
language plpgsql
as $$
declare
  base      text := public.slugify(source_name);
  candidate text;
  n         integer := 0;
  taken     boolean;
begin
  if base = '' then
    base := 'item';
  end if;

  -- Held until transaction end; serializes concurrent inserts sharing a base slug.
  perform pg_advisory_xact_lock(hashtext(tbl::text || ':' || base));

  candidate := base;
  loop
    execute format('select exists(select 1 from %s where slug = $1)', tbl)
      into taken using candidate;
    exit when not taken;
    n := n + 1;
    candidate := base || '-' || n;
  end loop;
  return candidate;
end;
$$;

comment on function public.generate_unique_slug(regclass, text) is
  'Slugify source_name and de-duplicate with -1/-2 suffixes. Race-safe via transaction-scoped advisory lock.';

create or replace function public.categories_set_slug()
returns trigger
language plpgsql
as $$
begin
  if new.slug is null or new.slug = '' then
    new.slug := public.generate_unique_slug('public.categories', new.name);
  end if;
  return new;
end;
$$;

comment on function public.categories_set_slug() is
  'BEFORE INSERT: auto-generate slug from name when the client leaves it blank.';

create trigger categories_set_slug
  before insert on public.categories
  for each row execute function public.categories_set_slug();
