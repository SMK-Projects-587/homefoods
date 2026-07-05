-- Storage buckets and their RLS policies (storage.objects already has RLS
-- enabled by Supabase).
--
--   product-images : PUBLIC bucket. Objects are served without auth via the
--                    public URL (catalog images for the future storefront).
--                    Writes are staff-only.
--   invoices       : PRIVATE bucket for generated invoice PDFs. Staff-only
--                    read and write; will later move to / sync with
--                    Cloudflare R2.

insert into storage.buckets (id, name, public)
values
  ('product-images', 'product-images', true),
  ('invoices', 'invoices', false)
on conflict (id) do nothing;

-- ---------- product-images ----------
-- Public buckets serve objects through the render/public endpoint without
-- consulting RLS, but the anon SELECT policy is still needed for listing and
-- for the regular object endpoint.
create policy "public read of product images"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'product-images');

create policy "staff can upload product images"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'product-images');

create policy "staff can update product images"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'product-images')
  with check (bucket_id = 'product-images');

create policy "staff can delete product images"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'product-images');

-- ---------- invoices ----------
create policy "staff can read invoice pdfs"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'invoices');

create policy "staff can upload invoice pdfs"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'invoices');

create policy "staff can update invoice pdfs"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'invoices')
  with check (bucket_id = 'invoices');

create policy "staff can delete invoice pdfs"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'invoices');
