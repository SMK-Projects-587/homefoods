-- ---------------------------------------------------------------------------
-- Row Level Security policies.
--
-- TRUST MODEL (read this before "fixing" these policies):
-- Every authenticated user is a staff member/admin. There are no customer
-- accounts and never will be: signups are disabled (config.toml locally, the
-- same toggle in the hosted dashboard), and staff accounts are created
-- manually by the owner. That is why the policies are flat:
--
--   * anon           -> read-only access to the ACTIVE catalog (a public
--                       storefront may exist later), nothing else.
--   * authenticated  -> full read/write on everything. No per-user rows, no
--                       roles table, no ownership checks — any staff member
--                       may manage any record.
--
-- If customer accounts are ever introduced, this whole file must be
-- reconsidered, not patched.
-- ---------------------------------------------------------------------------

-- ---------------------------------------------------------------------------
-- Table privileges. Current Supabase projects no longer grant anon /
-- authenticated automatic access to tables in public, so RLS policies alone
-- do nothing — the role must first hold the SQL privilege, then RLS narrows
-- which rows it applies to. Grants are the ceiling, policies the filter.
-- ---------------------------------------------------------------------------
grant usage on schema public to anon, authenticated, service_role;

-- Catalog: anon may only ever SELECT; staff and the service key get everything.
grant select
  on public.categories, public.products, public.product_variants, public.product_images
  to anon;

grant select, insert, update, delete
  on public.categories, public.products, public.product_variants, public.product_images,
     public.orders, public.order_items, public.invoices, public.invoice_counters
  to authenticated, service_role;

-- Identity columns draw from implicit sequences; INSERTs need USAGE on them.
grant usage, select on all sequences in schema public to authenticated, service_role;

-- The search RPC is the public storefront's search endpoint.
grant execute on function public.search_products(text, text, boolean, int, int)
  to anon, authenticated, service_role;

-- ---------- categories ----------
-- Categories carry no is_active flag, so anon may read them all; inactive
-- products inside a category are hidden by the products policy instead.
create policy "anon can read categories"
  on public.categories for select
  to anon
  using (true);

create policy "staff full access to categories"
  on public.categories for all
  to authenticated
  using (true)
  with check (true);

-- ---------- products ----------
create policy "anon can read active products"
  on public.products for select
  to anon
  using (is_active);

create policy "staff full access to products"
  on public.products for all
  to authenticated
  using (true)
  with check (true);

-- ---------- product_variants ----------
-- Anon sees a variant only if it is active AND its parent product is active
-- (the subquery re-checks products under the anon products policy, so the
-- two can't disagree).
create policy "anon can read active variants of active products"
  on public.product_variants for select
  to anon
  using (
    is_active
    and exists (
      select 1 from public.products p
      where p.id = product_id and p.is_active
    )
  );

create policy "staff full access to product_variants"
  on public.product_variants for all
  to authenticated
  using (true)
  with check (true);

-- ---------- product_images ----------
-- Images have no is_active of their own; visibility follows the parent product.
create policy "anon can read images of active products"
  on public.product_images for select
  to anon
  using (
    exists (
      select 1 from public.products p
      where p.id = product_id and p.is_active
    )
  );

create policy "staff full access to product_images"
  on public.product_images for all
  to authenticated
  using (true)
  with check (true);

-- ---------- orders / order_items / invoices / invoice_counters ----------
-- Internal business records: no anon policies at all (RLS is enabled on the
-- tables, so no policy == no access), staff get everything.

create policy "staff full access to orders"
  on public.orders for all
  to authenticated
  using (true)
  with check (true);

create policy "staff full access to order_items"
  on public.order_items for all
  to authenticated
  using (true)
  with check (true);

create policy "staff full access to invoices"
  on public.invoices for all
  to authenticated
  using (true)
  with check (true);

-- Staff need write access here because the invoice-number trigger runs as
-- the inserting user (everything is SECURITY INVOKER by design).
create policy "staff full access to invoice_counters"
  on public.invoice_counters for all
  to authenticated
  using (true)
  with check (true);
