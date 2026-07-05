-- Seed data for local development. Runs on every `supabase db reset`.
-- Slugs and SKUs are intentionally left blank so the auto-generation
-- triggers are exercised on every reset.

-- ---------------------------------------------------------------------------
-- Categories
-- ---------------------------------------------------------------------------
insert into public.categories (name, description) values
  ('Pickles', 'Traditional Andhra-style pickles made in small batches.'),
  ('Spice Powders', 'Podis and spice blends, stone-ground the old way.'),
  ('Snacks', 'Crunchy South Indian savouries.'),
  ('Sweets', 'Festive sweets made with ghee and jaggery.');

-- ---------------------------------------------------------------------------
-- Products (Telugu/Indian names exercise the 'simple' search config —
-- 'english' stemming would mangle words like "Avakaya" or "Gongura")
-- ---------------------------------------------------------------------------
insert into public.products (name, category_id, description, keywords) values
  ('Avakaya Mango Pickle',
   (select id from public.categories where slug = 'pickles'),
   'Classic Andhra avakaya made with raw mango, mustard, and cold-pressed gingelly oil.',
   '{avakaya,aavakaya,mango pickle,andhra pickle,mamidikaya}'),
  ('Gongura Pickle',
   (select id from public.categories where slug = 'pickles'),
   'Tangy gongura (sorrel leaf) pickle, a Telugu household staple.',
   '{gongura,sorrel leaves,pulihora,andhra pickle}'),
  ('Nimmakaya Lemon Pickle',
   (select id from public.categories where slug = 'pickles'),
   'Sun-cured lemon pickle with a sharp, salty tang.',
   '{nimmakaya,lemon pickle,nimbu achar}'),
  ('Kandi Podi',
   (select id from public.categories where slug = 'spice-powders'),
   'Roasted toor dal spice powder, best mixed with hot rice and ghee.',
   '{kandi podi,paruppu podi,dal powder,podi}'),
  ('Karam Podi',
   (select id from public.categories where slug = 'spice-powders'),
   'Fiery red chilli podi, also known as gunpowder, for idli and dosa.',
   '{karam podi,gunpowder,idli podi,chilli powder}'),
  ('Murukulu',
   (select id from public.categories where slug = 'snacks'),
   'Hand-twisted rice flour spirals, deep-fried until golden.',
   '{murukulu,murukku,chakli,jantikalu}'),
  ('Pappu Chekkalu',
   (select id from public.categories where slug = 'snacks'),
   'Crisp rice crackers studded with chana dal and curry leaves.',
   '{chekkalu,pappu chekkalu,rice crackers,nippattu}'),
  ('Kaju Katli',
   (select id from public.categories where slug = 'sweets'),
   'Silky cashew fudge finished with edible silver leaf.',
   '{kaju katli,kaju barfi,cashew sweet}'),
  ('Bandar Laddu',
   (select id from public.categories where slug = 'sweets'),
   'Gram-flour laddus from the Machilipatnam tradition, rich with ghee.',
   '{bandar laddu,boondi laddu,laddu,senaga pindi}');

-- Inactive product: must be invisible to anon, visible to staff.
insert into public.products (name, category_id, description, keywords, is_active) values
  ('Ariselu (Seasonal)',
   (select id from public.categories where slug = 'sweets'),
   'Rice-and-jaggery festival sweet, made only around Sankranti.',
   '{ariselu,adhirasam,jaggery sweet,sankranti}',
   false);

-- ---------------------------------------------------------------------------
-- Variants: weight-based today, but only via the attributes jsonb —
-- nothing in the schema knows what "weight" means. Prices in INR.
-- ---------------------------------------------------------------------------
insert into public.product_variants (product_id, title, attributes, price, compare_at_price, stock, is_default)
select p.id, v.title, v.attributes, v.price, v.compare_at_price, v.stock, v.is_default
from public.products p
join lateral (
  values
    ('Avakaya Mango Pickle',  '250 g', '{"weight": "250 g"}'::jsonb, 149.00, null::numeric, 40, false),
    ('Avakaya Mango Pickle',  '500 g', '{"weight": "500 g"}'::jsonb, 279.00, 299.00,        25, true),
    ('Avakaya Mango Pickle',  '1 kg',  '{"weight": "1 kg"}'::jsonb,  529.00, null,          10, false),
    ('Gongura Pickle',        '250 g', '{"weight": "250 g"}'::jsonb, 159.00, null,          30, false),
    ('Gongura Pickle',        '500 g', '{"weight": "500 g"}'::jsonb, 299.00, null,          18, true),
    ('Nimmakaya Lemon Pickle','250 g', '{"weight": "250 g"}'::jsonb, 129.00, null,          35, true),
    ('Nimmakaya Lemon Pickle','500 g', '{"weight": "500 g"}'::jsonb, 239.00, 259.00,        20, false),
    ('Kandi Podi',            '200 g', '{"weight": "200 g"}'::jsonb, 119.00, null,          50, true),
    ('Kandi Podi',            '500 g', '{"weight": "500 g"}'::jsonb, 269.00, null,          22, false),
    ('Karam Podi',            '200 g', '{"weight": "200 g"}'::jsonb, 109.00, null,          45, true),
    ('Karam Podi',            '500 g', '{"weight": "500 g"}'::jsonb, 249.00, null,          15, false),
    ('Murukulu',              '250 g', '{"weight": "250 g"}'::jsonb,  99.00, null,          60, true),
    ('Murukulu',              '500 g', '{"weight": "500 g"}'::jsonb, 189.00, null,          30, false),
    ('Pappu Chekkalu',        '250 g', '{"weight": "250 g"}'::jsonb, 109.00, null,          40, true),
    ('Pappu Chekkalu',        '500 g', '{"weight": "500 g"}'::jsonb, 199.00, 219.00,        20, false),
    ('Kaju Katli',            '250 g', '{"weight": "250 g"}'::jsonb, 349.00, null,          15, true),
    ('Kaju Katli',            '500 g', '{"weight": "500 g"}'::jsonb, 669.00, 699.00,         8, false),
    ('Bandar Laddu',          '250 g', '{"weight": "250 g"}'::jsonb, 199.00, null,          25, true),
    ('Bandar Laddu',          '500 g', '{"weight": "500 g"}'::jsonb, 379.00, null,          12, false),
    ('Bandar Laddu',          '1 kg',  '{"weight": "1 kg"}'::jsonb,  729.00, null,           5, false),
    ('Ariselu (Seasonal)',    '500 g', '{"weight": "500 g"}'::jsonb, 259.00, null,           0, true)
) as v(product_name, title, attributes, price, compare_at_price, stock, is_default)
  on v.product_name = p.name;

-- Ariselu is out of season: stock 0 and manually flagged unavailable.
update public.product_variants v
   set in_stock = false
  from public.products p
 where p.id = v.product_id and p.name = 'Ariselu (Seasonal)';

-- ---------------------------------------------------------------------------
-- Images (paths inside the product-images bucket; no actual objects locally)
-- ---------------------------------------------------------------------------
insert into public.product_images (product_id, image_path, alt_text, is_primary, sort_order)
select p.id,
       'products/' || p.slug || '/main.jpg',
       p.name || ' — main photo',
       true,
       0
from public.products p;

insert into public.product_images (product_id, image_path, alt_text, is_primary, sort_order)
select p.id, 'products/' || p.slug || '/detail-1.jpg', p.name || ' — detail', false, 1
from public.products p
where p.slug in ('avakaya-mango-pickle', 'kaju-katli');

-- ---------------------------------------------------------------------------
-- Sample orders (recorded manually by staff), items snapshot the variant
-- ---------------------------------------------------------------------------
insert into public.orders (status, customer_name, customer_phone, customer_email,
                           shipping_address, notes, subtotal, discount, shipping_fee, tax, total)
values
  ('delivered', 'Ravi Kumar', '+91 98490 12345', 'ravi.kumar@example.com',
   '{"line1": "12-3-45 Brodipet", "line2": "3rd Lane", "city": "Guntur", "state": "Andhra Pradesh", "postal_code": "522002", "country": "India"}',
   'Repeat customer — pack avakaya separately.',
   578.00, 0, 60.00, 0, 638.00),
  ('confirmed', 'Sunita Reddy', '+91 90000 67890', '',
   '{"line1": "Flat 402, Sai Residency", "line2": "Madhapur", "city": "Hyderabad", "state": "Telangana", "postal_code": "500081", "country": "India"}',
   '',
   458.00, 20.00, 60.00, 0, 498.00);

insert into public.order_items (order_id, variant_id, product_name, variant_title, sku,
                                attributes, unit_price, quantity, line_total)
select o.id, v.id, p.name, v.title, v.sku, v.attributes, v.price, li.quantity, v.price * li.quantity
from (values
  ('ORD-000001', 'Avakaya Mango Pickle', '500 g', 1),
  ('ORD-000001', 'Gongura Pickle',       '500 g', 1),
  ('ORD-000002', 'Kaju Katli',           '250 g', 1),
  ('ORD-000002', 'Karam Podi',           '200 g', 1)
) as li(order_number, product_name, variant_title, quantity)
join public.orders o on o.order_number = li.order_number
join public.products p on p.name = li.product_name
join public.product_variants v on v.product_id = p.id and v.title = li.variant_title;

-- ---------------------------------------------------------------------------
-- One issued invoice for the delivered order — proves the FY numbering
-- trigger works from a cold database (expect HF/<current FY>/0001).
-- ---------------------------------------------------------------------------
insert into public.invoices (order_id, status, issued_at, billing_name, billing_address,
                             line_items, subtotal, discount, tax, total)
select o.id,
       'issued',
       now(),
       o.customer_name,
       o.shipping_address,
       (select jsonb_agg(jsonb_build_object(
                 'product_name', oi.product_name,
                 'variant_title', oi.variant_title,
                 'sku', oi.sku,
                 'attributes', oi.attributes,
                 'unit_price', oi.unit_price,
                 'quantity', oi.quantity,
                 'line_total', oi.line_total))
          from public.order_items oi where oi.order_id = o.id),
       o.subtotal, o.discount, o.tax, o.total
from public.orders o
where o.order_number = 'ORD-000001';
