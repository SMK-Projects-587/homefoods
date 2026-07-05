-- Product images. `image_path` is the object path inside the `product-images`
-- storage bucket (public), not a URL — the frontend builds the public URL.

create table public.product_images (
  id         bigint generated always as identity primary key,
  product_id bigint not null references public.products (id) on delete cascade,
  image_path text not null,
  alt_text   text not null default '',
  is_primary boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.product_images enable row level security;

create index product_images_product_id_idx on public.product_images (product_id);

-- Hard guarantee: at most one primary image per product. The Django code only
-- enforced this in save(), which raw SQL or bulk updates could bypass.
create unique index product_images_one_primary_per_product
  on public.product_images (product_id) where is_primary;

create trigger product_images_set_updated_at
  before update on public.product_images
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Auto-demotion, matching Django's ProductImage.save(): marking an image as
-- primary silently demotes the product's current primary image, so the
-- dashboard can just set is_primary = true without a two-step dance. The
-- partial unique index above remains as a backstop for anything the trigger
-- doesn't cover. Recursion is impossible: the demoting UPDATE sets
-- is_primary = false, so the WHEN (new.is_primary) clause skips those rows.
-- ---------------------------------------------------------------------------
create or replace function public.product_images_demote_old_primary()
returns trigger
language plpgsql
as $$
begin
  update public.product_images
     set is_primary = false
   where product_id = new.product_id
     and is_primary
     and id <> new.id;
  return new;
end;
$$;

comment on function public.product_images_demote_old_primary() is
  'BEFORE INSERT/UPDATE when new.is_primary: demote the product''s existing primary image (Django save() behaviour).';

create trigger product_images_demote_old_primary
  before insert or update on public.product_images
  for each row
  when (new.is_primary)
  execute function public.product_images_demote_old_primary();
