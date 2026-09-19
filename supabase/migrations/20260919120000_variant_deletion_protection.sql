-- Extend deletion protection (20260709172150_deletion_protection.sql) to
-- product_variants.
--
-- STANDALONE MIGRATION — same situation as the other dashboard-authored
-- migrations in this file set: written from the dashboard repo against this
-- sibling project's real schema, not applied by anything automatically.
-- Review and run it yourself.
--
-- 20260709172150_deletion_protection.sql deliberately left product_variants
-- deletable ("routine catalog/data-entry management"). Owner call now:
-- variants should never be deleted either, only deactivated (is_active =
-- false) — a variant can be referenced by historical order_items even after
-- staff stop selling it, and hard-deleting it would orphan that history's
-- variant_id (nullable, on delete set null, so the row survives, but the
-- link to "which variant was this" is lost for no reason). Same pattern as
-- categories/products: revoke DELETE, re-create the staff policy without it.
revoke delete on table public.product_variants from authenticated;

drop policy "staff full access to product_variants" on public.product_variants;

create policy "staff can read product_variants"
  on public.product_variants for select to authenticated using (true);
create policy "staff can insert product_variants"
  on public.product_variants for insert to authenticated with check (true);
create policy "staff can update product_variants"
  on public.product_variants for update to authenticated using (true) with check (true);
