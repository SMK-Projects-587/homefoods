-- Remove the `attributes` jsonb column: it was designed as a generic
-- future-proofing bucket ("color, size, anything later"), but in practice
-- every row just duplicated `title` (e.g. title '500 g',
-- attributes {"weight": "500 g"}), it's never read anywhere in the
-- storefront, and title alone already uniquely identifies a variant.
-- Owner call: drop it rather than carry dead, confusing duplication.
--
-- The uniqueness guard moves from (product_id, attributes) to
-- (product_id, title) -- same invariant ("no two identical variants on one
-- product"), just keyed on the field that actually carries the meaning now.
drop index public.product_variants_attributes_idx;
drop index public.product_variants_product_attributes_key;

create unique index product_variants_product_title_key
  on public.product_variants (product_id, title);

alter table public.product_variants drop column attributes;

-- order_items.attributes existed purely to snapshot the column above at
-- order time (see 20260705191500_orders.sql). With nothing left to
-- snapshot, it's equally dead -- product_name/variant_title/sku already
-- carry everything needed to display or invoice a historical line item.
alter table public.order_items drop column attributes;
