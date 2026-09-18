-- Full catalog reset + repopulation from the owner-supplied menu photos
-- (~/Downloads/menu-1.jpg, menu-2.jpg). One-off, reviewed-by-hand operation;
-- NOT a repeatable seed (see supabase/seed.sql for that) -- this replaces the
-- placeholder demo catalog with the real one and is meant to run exactly once.
--
-- Also merges the 'Vadiyalu' category into 'Appadalu' (now 'Appadalu & Vadiyalu',
-- slug hot-foods) per owner request -- vadiyalu products move there and the
-- vadiyalu category row is dropped entirely.
--
-- Wipes ALL business data (orders, invoices, order history, catalog) per
-- explicit owner confirmation -- this is pre-launch cleanup, not a live store.
-- A full pg_dump backup was taken immediately before this ran (kept outside
-- the repo, alongside the operator's local session -- contains customer PII).

begin;

-- ---------------------------------------------------------------------------
-- Wipe (children first, respecting FKs)
-- ---------------------------------------------------------------------------
delete from public.order_status_history;
delete from public.order_items;
delete from public.invoices;
delete from public.orders;
delete from public.invoice_counters;
delete from public.product_images;
delete from public.product_variants;
delete from public.products;
delete from public.categories;

-- Restart identity sequences so ids/SKUs start clean.
alter sequence public.categories_id_seq restart with 1;
alter sequence public.products_id_seq restart with 1;
alter sequence public.product_variants_id_seq restart with 1;
alter sequence public.product_images_id_seq restart with 1;
alter sequence public.orders_id_seq restart with 1;
alter sequence public.order_items_id_seq restart with 1;
alter sequence public.order_status_history_id_seq restart with 1;
alter sequence public.invoices_id_seq restart with 1;

-- ---------------------------------------------------------------------------
-- Categories
-- ---------------------------------------------------------------------------
insert into public.categories (name, slug, native_name, description) values
  ('Pickles', 'pickles', 'ఊరగాయలు', 'Traditional Andhra-style pickles made in small batches.'),
  ('Powders', 'spice-powders', 'పొడులు', 'Podis and spice blends, stone-ground the old way.'),
  ('Snacks', 'snacks', 'అల్పాహారం', 'Crunchy South Indian savouries.'),
  ('Sweets', 'sweets', 'తీపి వంటలు', 'Festive sweets made with ghee and jaggery.'),
  ('Appadalu & Vadiyalu', 'hot-foods', 'అప్పడాలు - వడియాలు', 'Sun-dried papads and vadiyalu, ready to fry.');

-- ---------------------------------------------------------------------------
-- Products + variants
-- ---------------------------------------------------------------------------
-- Chegodi (చెగోడీలు)
with prod as (
  insert into public.products (name, native_name, category_id, description)
  values (
    'Chegodi', 'చెగోడీలు',
    (select id from public.categories where slug = 'snacks'),
    'A traditional Andhra tea-time snack, hand-made in small batches.'
  )
  returning id
)
insert into public.product_variants
  (product_id, title, attributes, price, compare_at_price, stock, in_stock, is_active, is_default)
values
  (  (select id from prod), '1 kg', jsonb_build_object('weight', '1 kg'), 500.00, null, 50, true, true, false),
  (  (select id from prod), '500 g', jsonb_build_object('weight', '500 g'), 250.00, null, 50, true, true, true),
  (  (select id from prod), '200 g', jsonb_build_object('weight', '200 g'), 100.00, null, 50, true, true, false);

-- Jantika (జంతికలు)
with prod as (
  insert into public.products (name, native_name, category_id, description)
  values (
    'Jantika', 'జంతికలు',
    (select id from public.categories where slug = 'snacks'),
    'A traditional Andhra tea-time snack, hand-made in small batches.'
  )
  returning id
)
insert into public.product_variants
  (product_id, title, attributes, price, compare_at_price, stock, in_stock, is_active, is_default)
values
  (  (select id from prod), '1 kg', jsonb_build_object('weight', '1 kg'), 400.00, null, 50, true, true, false),
  (  (select id from prod), '500 g', jsonb_build_object('weight', '500 g'), 200.00, null, 50, true, true, true),
  (  (select id from prod), '200 g', jsonb_build_object('weight', '200 g'), 100.00, null, 50, true, true, false);

-- Chakkilam (చక్కిలం)
with prod as (
  insert into public.products (name, native_name, category_id, description)
  values (
    'Chakkilam', 'చక్కిలం',
    (select id from public.categories where slug = 'snacks'),
    'A traditional Andhra tea-time snack, hand-made in small batches.'
  )
  returning id
)
insert into public.product_variants
  (product_id, title, attributes, price, compare_at_price, stock, in_stock, is_active, is_default)
values
  (  (select id from prod), '1 kg', jsonb_build_object('weight', '1 kg'), 500.00, null, 50, true, true, false),
  (  (select id from prod), '500 g', jsonb_build_object('weight', '500 g'), 250.00, null, 50, true, true, true),
  (  (select id from prod), '200 g', jsonb_build_object('weight', '200 g'), 100.00, null, 50, true, true, false);

-- Ariselu (అరిసెలు)
with prod as (
  insert into public.products (name, native_name, category_id, description)
  values (
    'Ariselu', 'అరిసెలు',
    (select id from public.categories where slug = 'snacks'),
    'A traditional Andhra tea-time snack, hand-made in small batches.'
  )
  returning id
)
insert into public.product_variants
  (product_id, title, attributes, price, compare_at_price, stock, in_stock, is_active, is_default)
values
  (  (select id from prod), '1 kg', jsonb_build_object('weight', '1 kg'), 500.00, null, 50, true, true, false),
  (  (select id from prod), '500 g', jsonb_build_object('weight', '500 g'), 250.00, null, 50, true, true, true),
  (  (select id from prod), '200 g', jsonb_build_object('weight', '200 g'), 100.00, null, 50, true, true, false);

-- Gulabipuvvulu (గులాబిపువ్వులు)
with prod as (
  insert into public.products (name, native_name, category_id, description)
  values (
    'Gulabipuvvulu', 'గులాబిపువ్వులు',
    (select id from public.categories where slug = 'snacks'),
    'A traditional Andhra tea-time snack, hand-made in small batches.'
  )
  returning id
)
insert into public.product_variants
  (product_id, title, attributes, price, compare_at_price, stock, in_stock, is_active, is_default)
values
  (  (select id from prod), '1 kg', jsonb_build_object('weight', '1 kg'), 500.00, null, 50, true, true, false),
  (  (select id from prod), '500 g', jsonb_build_object('weight', '500 g'), 250.00, null, 50, true, true, true),
  (  (select id from prod), '200 g', jsonb_build_object('weight', '200 g'), 100.00, null, 50, true, true, false);

-- Minapasunni (మినపసున్ని)
with prod as (
  insert into public.products (name, native_name, category_id, description)
  values (
    'Minapasunni', 'మినపసున్ని',
    (select id from public.categories where slug = 'snacks'),
    'A traditional Andhra tea-time snack, hand-made in small batches.'
  )
  returning id
)
insert into public.product_variants
  (product_id, title, attributes, price, compare_at_price, stock, in_stock, is_active, is_default)
values
  (  (select id from prod), '1 kg', jsonb_build_object('weight', '1 kg'), 400.00, null, 50, true, true, false),
  (  (select id from prod), '500 g', jsonb_build_object('weight', '500 g'), 200.00, null, 50, true, true, true),
  (  (select id from prod), '200 g', jsonb_build_object('weight', '200 g'), 100.00, null, 50, true, true, false);

-- Appadam (Hot) (అప్పడం (హాట్))
with prod as (
  insert into public.products (name, native_name, category_id, description)
  values (
    'Appadam (Hot)', 'అప్పడం (హాట్)',
    (select id from public.categories where slug = 'hot-foods'),
    'Sun-dried lentil papad, ready to fry or roast.'
  )
  returning id
)
insert into public.product_variants
  (product_id, title, attributes, price, compare_at_price, stock, in_stock, is_active, is_default)
values
  (  (select id from prod), '1 kg', jsonb_build_object('weight', '1 kg'), 600.00, null, 50, true, true, false),
  (  (select id from prod), '500 g', jsonb_build_object('weight', '500 g'), 300.00, null, 50, true, true, true),
  (  (select id from prod), '250 g', jsonb_build_object('weight', '250 g'), 150.00, null, 50, true, true, false);

-- Nuvvula Appadam (Hot) (నువ్వుల అప్పడం (హాట్))
with prod as (
  insert into public.products (name, native_name, category_id, description)
  values (
    'Nuvvula Appadam (Hot)', 'నువ్వుల అప్పడం (హాట్)',
    (select id from public.categories where slug = 'hot-foods'),
    'Sun-dried lentil papad, ready to fry or roast.'
  )
  returning id
)
insert into public.product_variants
  (product_id, title, attributes, price, compare_at_price, stock, in_stock, is_active, is_default)
values
  (  (select id from prod), '1 kg', jsonb_build_object('weight', '1 kg'), 600.00, null, 50, true, true, false),
  (  (select id from prod), '500 g', jsonb_build_object('weight', '500 g'), 300.00, null, 50, true, true, true),
  (  (select id from prod), '250 g', jsonb_build_object('weight', '250 g'), 150.00, null, 50, true, true, false);

-- Appadam (Medium Hot) (అప్పడం (మీడియం హాట్))
with prod as (
  insert into public.products (name, native_name, category_id, description)
  values (
    'Appadam (Medium Hot)', 'అప్పడం (మీడియం హాట్)',
    (select id from public.categories where slug = 'hot-foods'),
    'Sun-dried lentil papad, ready to fry or roast.'
  )
  returning id
)
insert into public.product_variants
  (product_id, title, attributes, price, compare_at_price, stock, in_stock, is_active, is_default)
values
  (  (select id from prod), '1 kg', jsonb_build_object('weight', '1 kg'), 600.00, null, 50, true, true, false),
  (  (select id from prod), '500 g', jsonb_build_object('weight', '500 g'), 300.00, null, 50, true, true, true),
  (  (select id from prod), '250 g', jsonb_build_object('weight', '250 g'), 150.00, null, 50, true, true, false);

-- Nuvvula Appadam (Medium Hot) (నువ్వుల అప్పడం (మీడియం హాట్))
with prod as (
  insert into public.products (name, native_name, category_id, description)
  values (
    'Nuvvula Appadam (Medium Hot)', 'నువ్వుల అప్పడం (మీడియం హాట్)',
    (select id from public.categories where slug = 'hot-foods'),
    'Sun-dried lentil papad, ready to fry or roast.'
  )
  returning id
)
insert into public.product_variants
  (product_id, title, attributes, price, compare_at_price, stock, in_stock, is_active, is_default)
values
  (  (select id from prod), '1 kg', jsonb_build_object('weight', '1 kg'), 600.00, null, 50, true, true, false),
  (  (select id from prod), '500 g', jsonb_build_object('weight', '500 g'), 300.00, null, 50, true, true, true),
  (  (select id from prod), '250 g', jsonb_build_object('weight', '250 g'), 150.00, null, 50, true, true, false);

-- Appadam (Low Hot) (అప్పడం (తక్కువ కారం))
with prod as (
  insert into public.products (name, native_name, category_id, description)
  values (
    'Appadam (Low Hot)', 'అప్పడం (తక్కువ కారం)',
    (select id from public.categories where slug = 'hot-foods'),
    'Sun-dried lentil papad, ready to fry or roast.'
  )
  returning id
)
insert into public.product_variants
  (product_id, title, attributes, price, compare_at_price, stock, in_stock, is_active, is_default)
values
  (  (select id from prod), '1 kg', jsonb_build_object('weight', '1 kg'), 600.00, null, 50, true, true, false),
  (  (select id from prod), '500 g', jsonb_build_object('weight', '500 g'), 300.00, null, 50, true, true, true),
  (  (select id from prod), '250 g', jsonb_build_object('weight', '250 g'), 150.00, null, 50, true, true, false);

-- Nuvvula Appadam (Low Hot) (నువ్వుల అప్పడం (తక్కువ కారం))
with prod as (
  insert into public.products (name, native_name, category_id, description)
  values (
    'Nuvvula Appadam (Low Hot)', 'నువ్వుల అప్పడం (తక్కువ కారం)',
    (select id from public.categories where slug = 'hot-foods'),
    'Sun-dried lentil papad, ready to fry or roast.'
  )
  returning id
)
insert into public.product_variants
  (product_id, title, attributes, price, compare_at_price, stock, in_stock, is_active, is_default)
values
  (  (select id from prod), '1 kg', jsonb_build_object('weight', '1 kg'), 600.00, null, 50, true, true, false),
  (  (select id from prod), '500 g', jsonb_build_object('weight', '500 g'), 300.00, null, 50, true, true, true),
  (  (select id from prod), '250 g', jsonb_build_object('weight', '250 g'), 150.00, null, 50, true, true, false);

-- Vari Pindi Vadiyalu (వరిపిండి వడియాలు)
with prod as (
  insert into public.products (name, native_name, category_id, description)
  values (
    'Vari Pindi Vadiyalu', 'వరిపిండి వడియాలు',
    (select id from public.categories where slug = 'hot-foods'),
    'Sun-dried rice-flour vadiyalu, ready to fry.'
  )
  returning id
)
insert into public.product_variants
  (product_id, title, attributes, price, compare_at_price, stock, in_stock, is_active, is_default)
values
  (  (select id from prod), '1 kg', jsonb_build_object('weight', '1 kg'), 500.00, null, 50, true, true, false),
  (  (select id from prod), '500 g', jsonb_build_object('weight', '500 g'), 250.00, null, 50, true, true, true),
  (  (select id from prod), '200 g', jsonb_build_object('weight', '200 g'), 100.00, null, 50, true, true, false);

-- Pelapu Vadiyalu (పేలపు వడియాలు)
with prod as (
  insert into public.products (name, native_name, category_id, description)
  values (
    'Pelapu Vadiyalu', 'పేలపు వడియాలు',
    (select id from public.categories where slug = 'hot-foods'),
    'Sun-dried puffed-rice vadiyalu, ready to fry.'
  )
  returning id
)
insert into public.product_variants
  (product_id, title, attributes, price, compare_at_price, stock, in_stock, is_active, is_default)
values
  (  (select id from prod), '1 kg', jsonb_build_object('weight', '1 kg'), 600.00, null, 50, true, true, false),
  (  (select id from prod), '500 g', jsonb_build_object('weight', '500 g'), 300.00, null, 50, true, true, true),
  (  (select id from prod), '250 g', jsonb_build_object('weight', '250 g'), 150.00, null, 50, true, true, false);

-- Gummadi Vadiyalu (గుమ్మడి వడియాలు)
with prod as (
  insert into public.products (name, native_name, category_id, description)
  values (
    'Gummadi Vadiyalu', 'గుమ్మడి వడియాలు',
    (select id from public.categories where slug = 'hot-foods'),
    'Sun-dried pumpkin vadiyalu, ready to fry.'
  )
  returning id
)
insert into public.product_variants
  (product_id, title, attributes, price, compare_at_price, stock, in_stock, is_active, is_default)
values
  (  (select id from prod), '1 kg', jsonb_build_object('weight', '1 kg'), 1000.00, null, 50, true, true, false),
  (  (select id from prod), '500 g', jsonb_build_object('weight', '500 g'), 500.00, null, 50, true, true, true),
  (  (select id from prod), '250 g', jsonb_build_object('weight', '250 g'), 250.00, null, 50, true, true, false),
  (  (select id from prod), '100 g', jsonb_build_object('weight', '100 g'), 100.00, null, 50, true, true, false);

-- Saggu Vadiyam (సగ్గు వడియం)
with prod as (
  insert into public.products (name, native_name, category_id, description)
  values (
    'Saggu Vadiyam', 'సగ్గు వడియం',
    (select id from public.categories where slug = 'hot-foods'),
    'Sun-dried sago vadiyam, ready to fry.'
  )
  returning id
)
insert into public.product_variants
  (product_id, title, attributes, price, compare_at_price, stock, in_stock, is_active, is_default)
values
  (  (select id from prod), '1 kg', jsonb_build_object('weight', '1 kg'), 600.00, null, 50, true, true, false),
  (  (select id from prod), '500 g', jsonb_build_object('weight', '500 g'), 300.00, null, 50, true, true, true),
  (  (select id from prod), '250 g', jsonb_build_object('weight', '250 g'), 150.00, null, 50, true, true, false);

-- Telagapindi Vadiyam (తెలగపిండి వడియం)
with prod as (
  insert into public.products (name, native_name, category_id, description)
  values (
    'Telagapindi Vadiyam', 'తెలగపిండి వడియం',
    (select id from public.categories where slug = 'hot-foods'),
    'Sun-dried vadiyam made with telagapindi (foxtail millet flour).'
  )
  returning id
)
insert into public.product_variants
  (product_id, title, attributes, price, compare_at_price, stock, in_stock, is_active, is_default)
values
  (  (select id from prod), '1 kg', jsonb_build_object('weight', '1 kg'), 500.00, null, 50, true, true, false),
  (  (select id from prod), '500 g', jsonb_build_object('weight', '500 g'), 250.00, null, 50, true, true, true),
  (  (select id from prod), '200 g', jsonb_build_object('weight', '200 g'), 100.00, null, 50, true, true, false);

-- Koora Vadiyam (Minapa) (కూర వడియం (మినపవడియం))
with prod as (
  insert into public.products (name, native_name, category_id, description)
  values (
    'Koora Vadiyam (Minapa)', 'కూర వడియం (మినపవడియం)',
    (select id from public.categories where slug = 'hot-foods'),
    'Sun-dried black-gram vadiyam, ready to fry.'
  )
  returning id
)
insert into public.product_variants
  (product_id, title, attributes, price, compare_at_price, stock, in_stock, is_active, is_default)
values
  (  (select id from prod), '1 kg', jsonb_build_object('weight', '1 kg'), 400.00, null, 50, true, true, false),
  (  (select id from prod), '500 g', jsonb_build_object('weight', '500 g'), 200.00, null, 50, true, true, true),
  (  (select id from prod), '250 g', jsonb_build_object('weight', '250 g'), 100.00, null, 50, true, true, false);

-- Perugu Mirapakayalu (Curd Chillis) (పెరుగు మిరపకాయలు)
with prod as (
  insert into public.products (name, native_name, category_id, description)
  values (
    'Perugu Mirapakayalu (Curd Chillis)', 'పెరుగు మిరపకాయలు',
    (select id from public.categories where slug = 'hot-foods'),
    'Sun-dried curd chillis, ready to fry.'
  )
  returning id
)
insert into public.product_variants
  (product_id, title, attributes, price, compare_at_price, stock, in_stock, is_active, is_default)
values
  (  (select id from prod), '1 kg', jsonb_build_object('weight', '1 kg'), 800.00, null, 50, true, true, false),
  (  (select id from prod), '500 g', jsonb_build_object('weight', '500 g'), 400.00, null, 50, true, true, true),
  (  (select id from prod), '250 g', jsonb_build_object('weight', '250 g'), 200.00, null, 50, true, true, false),
  (  (select id from prod), '125 g', jsonb_build_object('weight', '125 g'), 100.00, null, 50, true, true, false);

-- Appadala Pindi (అప్పడాల పిండి)
with prod as (
  insert into public.products (name, native_name, category_id, description)
  values (
    'Appadala Pindi', 'అప్పడాల పిండి',
    (select id from public.categories where slug = 'spice-powders'),
    'Stone-ground the traditional way, no preservatives.'
  )
  returning id
)
insert into public.product_variants
  (product_id, title, attributes, price, compare_at_price, stock, in_stock, is_active, is_default)
values
  (  (select id from prod), '1 kg', jsonb_build_object('weight', '1 kg'), 400.00, null, 50, true, true, false),
  (  (select id from prod), '500 g', jsonb_build_object('weight', '500 g'), 200.00, null, 50, true, true, true),
  (  (select id from prod), '200 g', jsonb_build_object('weight', '200 g'), 100.00, null, 50, true, true, false);

-- Idly Karam (ఇడ్లీ కారం)
with prod as (
  insert into public.products (name, native_name, category_id, description)
  values (
    'Idly Karam', 'ఇడ్లీ కారం',
    (select id from public.categories where slug = 'spice-powders'),
    'Stone-ground the traditional way, no preservatives.'
  )
  returning id
)
insert into public.product_variants
  (product_id, title, attributes, price, compare_at_price, stock, in_stock, is_active, is_default)
values
  (  (select id from prod), '1 kg', jsonb_build_object('weight', '1 kg'), 500.00, null, 50, true, true, false),
  (  (select id from prod), '500 g', jsonb_build_object('weight', '500 g'), 250.00, null, 50, true, true, true),
  (  (select id from prod), '200 g', jsonb_build_object('weight', '200 g'), 100.00, null, 50, true, true, false);

-- Kandi Podi (కందిపొడి)
with prod as (
  insert into public.products (name, native_name, category_id, description)
  values (
    'Kandi Podi', 'కందిపొడి',
    (select id from public.categories where slug = 'spice-powders'),
    'Stone-ground the traditional way, no preservatives.'
  )
  returning id
)
insert into public.product_variants
  (product_id, title, attributes, price, compare_at_price, stock, in_stock, is_active, is_default)
values
  (  (select id from prod), '1 kg', jsonb_build_object('weight', '1 kg'), 500.00, null, 50, true, true, false),
  (  (select id from prod), '500 g', jsonb_build_object('weight', '500 g'), 250.00, null, 50, true, true, true),
  (  (select id from prod), '200 g', jsonb_build_object('weight', '200 g'), 100.00, null, 50, true, true, false);

-- Nuvvula Podi (నువ్వులపొడి)
with prod as (
  insert into public.products (name, native_name, category_id, description)
  values (
    'Nuvvula Podi', 'నువ్వులపొడి',
    (select id from public.categories where slug = 'spice-powders'),
    'Stone-ground the traditional way, no preservatives.'
  )
  returning id
)
insert into public.product_variants
  (product_id, title, attributes, price, compare_at_price, stock, in_stock, is_active, is_default)
values
  (  (select id from prod), '1 kg', jsonb_build_object('weight', '1 kg'), 500.00, null, 50, true, true, false),
  (  (select id from prod), '500 g', jsonb_build_object('weight', '500 g'), 250.00, null, 50, true, true, true),
  (  (select id from prod), '200 g', jsonb_build_object('weight', '200 g'), 100.00, null, 50, true, true, false);

-- Coconut Podi (కొబ్బరిపొడి)
with prod as (
  insert into public.products (name, native_name, category_id, description)
  values (
    'Coconut Podi', 'కొబ్బరిపొడి',
    (select id from public.categories where slug = 'spice-powders'),
    'Stone-ground the traditional way, no preservatives.'
  )
  returning id
)
insert into public.product_variants
  (product_id, title, attributes, price, compare_at_price, stock, in_stock, is_active, is_default)
values
  (  (select id from prod), '1 kg', jsonb_build_object('weight', '1 kg'), 500.00, null, 50, true, true, false),
  (  (select id from prod), '500 g', jsonb_build_object('weight', '500 g'), 250.00, null, 50, true, true, true),
  (  (select id from prod), '200 g', jsonb_build_object('weight', '200 g'), 100.00, null, 50, true, true, false);

-- Telagapindi Podi (తెలగపిండి పొడి)
with prod as (
  insert into public.products (name, native_name, category_id, description)
  values (
    'Telagapindi Podi', 'తెలగపిండి పొడి',
    (select id from public.categories where slug = 'spice-powders'),
    'Stone-ground the traditional way, no preservatives.'
  )
  returning id
)
insert into public.product_variants
  (product_id, title, attributes, price, compare_at_price, stock, in_stock, is_active, is_default)
values
  (  (select id from prod), '1 kg', jsonb_build_object('weight', '1 kg'), 500.00, null, 50, true, true, false),
  (  (select id from prod), '500 g', jsonb_build_object('weight', '500 g'), 250.00, null, 50, true, true, true),
  (  (select id from prod), '200 g', jsonb_build_object('weight', '200 g'), 100.00, null, 50, true, true, false);

-- Curry Leaf Podi (కరివేపాకు పొడి)
with prod as (
  insert into public.products (name, native_name, category_id, description)
  values (
    'Curry Leaf Podi', 'కరివేపాకు పొడి',
    (select id from public.categories where slug = 'spice-powders'),
    'Stone-ground the traditional way, no preservatives.'
  )
  returning id
)
insert into public.product_variants
  (product_id, title, attributes, price, compare_at_price, stock, in_stock, is_active, is_default)
values
  (  (select id from prod), '1 kg', jsonb_build_object('weight', '1 kg'), 600.00, null, 50, true, true, false),
  (  (select id from prod), '500 g', jsonb_build_object('weight', '500 g'), 300.00, null, 50, true, true, true),
  (  (select id from prod), '250 g', jsonb_build_object('weight', '250 g'), 150.00, null, 50, true, true, false);

-- Sambar Powder (సాంబారుపొడి)
with prod as (
  insert into public.products (name, native_name, category_id, description)
  values (
    'Sambar Powder', 'సాంబారుపొడి',
    (select id from public.categories where slug = 'spice-powders'),
    'Stone-ground the traditional way, no preservatives.'
  )
  returning id
)
insert into public.product_variants
  (product_id, title, attributes, price, compare_at_price, stock, in_stock, is_active, is_default)
values
  (  (select id from prod), '1 kg', jsonb_build_object('weight', '1 kg'), 600.00, null, 50, true, true, false),
  (  (select id from prod), '500 g', jsonb_build_object('weight', '500 g'), 300.00, null, 50, true, true, true),
  (  (select id from prod), '250 g', jsonb_build_object('weight', '250 g'), 150.00, null, 50, true, true, false);

-- Rasam Powder (రసం పొడి)
with prod as (
  insert into public.products (name, native_name, category_id, description)
  values (
    'Rasam Powder', 'రసం పొడి',
    (select id from public.categories where slug = 'spice-powders'),
    'Stone-ground the traditional way, no preservatives.'
  )
  returning id
)
insert into public.product_variants
  (product_id, title, attributes, price, compare_at_price, stock, in_stock, is_active, is_default)
values
  (  (select id from prod), '1 kg', jsonb_build_object('weight', '1 kg'), 600.00, null, 50, true, true, false),
  (  (select id from prod), '500 g', jsonb_build_object('weight', '500 g'), 300.00, null, 50, true, true, true),
  (  (select id from prod), '250 g', jsonb_build_object('weight', '250 g'), 150.00, null, 50, true, true, false);

-- Garam Masala Podi (గరం మసాలా పొడి)
with prod as (
  insert into public.products (name, native_name, category_id, description)
  values (
    'Garam Masala Podi', 'గరం మసాలా పొడి',
    (select id from public.categories where slug = 'spice-powders'),
    'A blend of whole spices, stone-ground the traditional way.'
  )
  returning id
)
insert into public.product_variants
  (product_id, title, attributes, price, compare_at_price, stock, in_stock, is_active, is_default)
values
  (  (select id from prod), '1 kg', jsonb_build_object('weight', '1 kg'), 1000.00, null, 50, true, true, false),
  (  (select id from prod), '500 g', jsonb_build_object('weight', '500 g'), 500.00, null, 50, true, true, true),
  (  (select id from prod), '250 g', jsonb_build_object('weight', '250 g'), 250.00, null, 50, true, true, false),
  (  (select id from prod), '100 g', jsonb_build_object('weight', '100 g'), 100.00, null, 50, true, true, false);

-- Bellam Avakaya (బెల్లం ఆవకాయ)
with prod as (
  insert into public.products (name, native_name, category_id, description)
  values (
    'Bellam Avakaya', 'బెల్లం ఆవకాయ',
    (select id from public.categories where slug = 'pickles'),
    'A traditional Andhra-style pickle, made in small batches.'
  )
  returning id
)
insert into public.product_variants
  (product_id, title, attributes, price, compare_at_price, stock, in_stock, is_active, is_default)
values
  (  (select id from prod), '1 kg', jsonb_build_object('weight', '1 kg'), 500.00, null, 50, true, true, false),
  (  (select id from prod), '500 g', jsonb_build_object('weight', '500 g'), 250.00, null, 50, true, true, true),
  (  (select id from prod), '200 g', jsonb_build_object('weight', '200 g'), 100.00, null, 50, true, true, false);

-- Karam Avakaya (కారం ఆవకాయ)
with prod as (
  insert into public.products (name, native_name, category_id, description)
  values (
    'Karam Avakaya', 'కారం ఆవకాయ',
    (select id from public.categories where slug = 'pickles'),
    'A traditional Andhra-style pickle, made in small batches.'
  )
  returning id
)
insert into public.product_variants
  (product_id, title, attributes, price, compare_at_price, stock, in_stock, is_active, is_default)
values
  (  (select id from prod), '1 kg', jsonb_build_object('weight', '1 kg'), 500.00, null, 50, true, true, false),
  (  (select id from prod), '500 g', jsonb_build_object('weight', '500 g'), 250.00, null, 50, true, true, true),
  (  (select id from prod), '200 g', jsonb_build_object('weight', '200 g'), 100.00, null, 50, true, true, false);

-- Endu Avakaya (ఎండు ఆవకాయ)
with prod as (
  insert into public.products (name, native_name, category_id, description)
  values (
    'Endu Avakaya', 'ఎండు ఆవకాయ',
    (select id from public.categories where slug = 'pickles'),
    'A traditional Andhra-style pickle, made in small batches.'
  )
  returning id
)
insert into public.product_variants
  (product_id, title, attributes, price, compare_at_price, stock, in_stock, is_active, is_default)
values
  (  (select id from prod), '1 kg', jsonb_build_object('weight', '1 kg'), 500.00, null, 50, true, true, false),
  (  (select id from prod), '500 g', jsonb_build_object('weight', '500 g'), 250.00, null, 50, true, true, true),
  (  (select id from prod), '200 g', jsonb_build_object('weight', '200 g'), 100.00, null, 50, true, true, false);

-- Kaya Palam Avakaya (Full Mango) (కాయపాళం ఆవకాయ)
with prod as (
  insert into public.products (name, native_name, category_id, description)
  values (
    'Kaya Palam Avakaya (Full Mango)', 'కాయపాళం ఆవకాయ',
    (select id from public.categories where slug = 'pickles'),
    'A traditional Andhra-style pickle, made in small batches.'
  )
  returning id
)
insert into public.product_variants
  (product_id, title, attributes, price, compare_at_price, stock, in_stock, is_active, is_default)
values
  (  (select id from prod), '1 kg', jsonb_build_object('weight', '1 kg'), 500.00, null, 50, true, true, false),
  (  (select id from prod), '500 g', jsonb_build_object('weight', '500 g'), 250.00, null, 50, true, true, true),
  (  (select id from prod), '200 g', jsonb_build_object('weight', '200 g'), 100.00, null, 50, true, true, false);

-- Pandumirapa Pachadi (Fruit Chilly) (పండుమిరప పచ్చడి)
with prod as (
  insert into public.products (name, native_name, category_id, description)
  values (
    'Pandumirapa Pachadi (Fruit Chilly)', 'పండుమిరప పచ్చడి',
    (select id from public.categories where slug = 'pickles'),
    'A traditional Andhra-style pickle, made in small batches.'
  )
  returning id
)
insert into public.product_variants
  (product_id, title, attributes, price, compare_at_price, stock, in_stock, is_active, is_default)
values
  (  (select id from prod), '1 kg', jsonb_build_object('weight', '1 kg'), 500.00, null, 50, true, true, false),
  (  (select id from prod), '500 g', jsonb_build_object('weight', '500 g'), 250.00, null, 50, true, true, true),
  (  (select id from prod), '200 g', jsonb_build_object('weight', '200 g'), 100.00, null, 50, true, true, false);

-- Allam Pachadi (Ginger Pickle) (అల్లం పచ్చడి)
with prod as (
  insert into public.products (name, native_name, category_id, description)
  values (
    'Allam Pachadi (Ginger Pickle)', 'అల్లం పచ్చడి',
    (select id from public.categories where slug = 'pickles'),
    'A traditional Andhra-style pickle, made in small batches.'
  )
  returning id
)
insert into public.product_variants
  (product_id, title, attributes, price, compare_at_price, stock, in_stock, is_active, is_default)
values
  (  (select id from prod), '1 kg', jsonb_build_object('weight', '1 kg'), 500.00, null, 50, true, true, false),
  (  (select id from prod), '500 g', jsonb_build_object('weight', '500 g'), 250.00, null, 50, true, true, true),
  (  (select id from prod), '200 g', jsonb_build_object('weight', '200 g'), 100.00, null, 50, true, true, false);

-- Dabbakaya (దబ్బకాయ)
with prod as (
  insert into public.products (name, native_name, category_id, description)
  values (
    'Dabbakaya', 'దబ్బకాయ',
    (select id from public.categories where slug = 'pickles'),
    'A traditional Andhra-style pickle, made in small batches.'
  )
  returning id
)
insert into public.product_variants
  (product_id, title, attributes, price, compare_at_price, stock, in_stock, is_active, is_default)
values
  (  (select id from prod), '1 kg', jsonb_build_object('weight', '1 kg'), 500.00, null, 50, true, true, false),
  (  (select id from prod), '500 g', jsonb_build_object('weight', '500 g'), 250.00, null, 50, true, true, true),
  (  (select id from prod), '200 g', jsonb_build_object('weight', '200 g'), 100.00, null, 50, true, true, false);

-- Velamkaya Pachadi (వెలంకాయ పచ్చడి)
with prod as (
  insert into public.products (name, native_name, category_id, description)
  values (
    'Velamkaya Pachadi', 'వెలంకాయ పచ్చడి',
    (select id from public.categories where slug = 'pickles'),
    'A traditional Andhra-style pickle, made in small batches.'
  )
  returning id
)
insert into public.product_variants
  (product_id, title, attributes, price, compare_at_price, stock, in_stock, is_active, is_default)
values
  (  (select id from prod), '1 kg', jsonb_build_object('weight', '1 kg'), 500.00, null, 50, true, true, false),
  (  (select id from prod), '500 g', jsonb_build_object('weight', '500 g'), 250.00, null, 50, true, true, true),
  (  (select id from prod), '200 g', jsonb_build_object('weight', '200 g'), 100.00, null, 50, true, true, false);

-- Tamota Pachadi (Tomato Pickle) (టమాటా పచ్చడి)
with prod as (
  insert into public.products (name, native_name, category_id, description)
  values (
    'Tamota Pachadi (Tomato Pickle)', 'టమాటా పచ్చడి',
    (select id from public.categories where slug = 'pickles'),
    'A traditional Andhra-style pickle, made in small batches.'
  )
  returning id
)
insert into public.product_variants
  (product_id, title, attributes, price, compare_at_price, stock, in_stock, is_active, is_default)
values
  (  (select id from prod), '1 kg', jsonb_build_object('weight', '1 kg'), 500.00, null, 50, true, true, false),
  (  (select id from prod), '500 g', jsonb_build_object('weight', '500 g'), 250.00, null, 50, true, true, true),
  (  (select id from prod), '200 g', jsonb_build_object('weight', '200 g'), 100.00, null, 50, true, true, false);

-- Gongura Pachadi (గోంగూర పచ్చడి)
with prod as (
  insert into public.products (name, native_name, category_id, description)
  values (
    'Gongura Pachadi', 'గోంగూర పచ్చడి',
    (select id from public.categories where slug = 'pickles'),
    'A traditional Andhra-style pickle, made in small batches.'
  )
  returning id
)
insert into public.product_variants
  (product_id, title, attributes, price, compare_at_price, stock, in_stock, is_active, is_default)
values
  (  (select id from prod), '1 kg', jsonb_build_object('weight', '1 kg'), 500.00, null, 50, true, true, false),
  (  (select id from prod), '500 g', jsonb_build_object('weight', '500 g'), 250.00, null, 50, true, true, true),
  (  (select id from prod), '200 g', jsonb_build_object('weight', '200 g'), 100.00, null, 50, true, true, false);

-- Nimmakaya Pachadi (Lemon Pickle) (నిమ్మకాయ పచ్చడి)
with prod as (
  insert into public.products (name, native_name, category_id, description)
  values (
    'Nimmakaya Pachadi (Lemon Pickle)', 'నిమ్మకాయ పచ్చడి',
    (select id from public.categories where slug = 'pickles'),
    'A traditional Andhra-style pickle, made in small batches.'
  )
  returning id
)
insert into public.product_variants
  (product_id, title, attributes, price, compare_at_price, stock, in_stock, is_active, is_default)
values
  (  (select id from prod), '1 kg', jsonb_build_object('weight', '1 kg'), 500.00, null, 50, true, true, false),
  (  (select id from prod), '500 g', jsonb_build_object('weight', '500 g'), 250.00, null, 50, true, true, true),
  (  (select id from prod), '200 g', jsonb_build_object('weight', '200 g'), 100.00, null, 50, true, true, false);

-- Usiri Avakaya Palam (Amla Full) (ఉసిరి ఆవకాయ పాళం)
with prod as (
  insert into public.products (name, native_name, category_id, description)
  values (
    'Usiri Avakaya Palam (Amla Full)', 'ఉసిరి ఆవకాయ పాళం',
    (select id from public.categories where slug = 'pickles'),
    'A traditional Andhra-style pickle, made in small batches.'
  )
  returning id
)
insert into public.product_variants
  (product_id, title, attributes, price, compare_at_price, stock, in_stock, is_active, is_default)
values
  (  (select id from prod), '1 kg', jsonb_build_object('weight', '1 kg'), 500.00, null, 50, true, true, false),
  (  (select id from prod), '500 g', jsonb_build_object('weight', '500 g'), 250.00, null, 50, true, true, true),
  (  (select id from prod), '200 g', jsonb_build_object('weight', '200 g'), 100.00, null, 50, true, true, false);

-- Usirika Pachadi (Amla Pickle) (ఉసిరిక పచ్చడి)
with prod as (
  insert into public.products (name, native_name, category_id, description)
  values (
    'Usirika Pachadi (Amla Pickle)', 'ఉసిరిక పచ్చడి',
    (select id from public.categories where slug = 'pickles'),
    'A traditional Andhra-style pickle, made in small batches.'
  )
  returning id
)
insert into public.product_variants
  (product_id, title, attributes, price, compare_at_price, stock, in_stock, is_active, is_default)
values
  (  (select id from prod), '1 kg', jsonb_build_object('weight', '1 kg'), 500.00, null, 50, true, true, false),
  (  (select id from prod), '500 g', jsonb_build_object('weight', '500 g'), 250.00, null, 50, true, true, true),
  (  (select id from prod), '200 g', jsonb_build_object('weight', '200 g'), 100.00, null, 50, true, true, false);

-- Bellam Magaya (Sweet Magaya) (బెల్లం మాగాయి)
with prod as (
  insert into public.products (name, native_name, category_id, description)
  values (
    'Bellam Magaya (Sweet Magaya)', 'బెల్లం మాగాయి',
    (select id from public.categories where slug = 'pickles'),
    'A traditional Andhra-style pickle, made in small batches.'
  )
  returning id
)
insert into public.product_variants
  (product_id, title, attributes, price, compare_at_price, stock, in_stock, is_active, is_default)
values
  (  (select id from prod), '1 kg', jsonb_build_object('weight', '1 kg'), 600.00, null, 50, true, true, false),
  (  (select id from prod), '500 g', jsonb_build_object('weight', '500 g'), 300.00, null, 50, true, true, true),
  (  (select id from prod), '250 g', jsonb_build_object('weight', '250 g'), 150.00, null, 50, true, true, false);

-- Karam Magaya (Hot Magaya) (కారం మాగాయి)
with prod as (
  insert into public.products (name, native_name, category_id, description)
  values (
    'Karam Magaya (Hot Magaya)', 'కారం మాగాయి',
    (select id from public.categories where slug = 'pickles'),
    'A traditional Andhra-style pickle, made in small batches.'
  )
  returning id
)
insert into public.product_variants
  (product_id, title, attributes, price, compare_at_price, stock, in_stock, is_active, is_default)
values
  (  (select id from prod), '1 kg', jsonb_build_object('weight', '1 kg'), 600.00, null, 50, true, true, false),
  (  (select id from prod), '500 g', jsonb_build_object('weight', '500 g'), 300.00, null, 50, true, true, true),
  (  (select id from prod), '250 g', jsonb_build_object('weight', '250 g'), 150.00, null, 50, true, true, false);

-- Tokkudu Pachadi (తొక్కుడు పచ్చడి)
with prod as (
  insert into public.products (name, native_name, category_id, description)
  values (
    'Tokkudu Pachadi', 'తొక్కుడు పచ్చడి',
    (select id from public.categories where slug = 'pickles'),
    'A traditional Andhra-style pickle, made in small batches.'
  )
  returning id
)
insert into public.product_variants
  (product_id, title, attributes, price, compare_at_price, stock, in_stock, is_active, is_default)
values
  (  (select id from prod), '1 kg', jsonb_build_object('weight', '1 kg'), 600.00, null, 50, true, true, false),
  (  (select id from prod), '500 g', jsonb_build_object('weight', '500 g'), 300.00, null, 50, true, true, true),
  (  (select id from prod), '250 g', jsonb_build_object('weight', '250 g'), 150.00, null, 50, true, true, false);

-- Koru Pachadi (కోరు పచ్చడి)
with prod as (
  insert into public.products (name, native_name, category_id, description)
  values (
    'Koru Pachadi', 'కోరు పచ్చడి',
    (select id from public.categories where slug = 'pickles'),
    'A traditional Andhra-style pickle, made in small batches.'
  )
  returning id
)
insert into public.product_variants
  (product_id, title, attributes, price, compare_at_price, stock, in_stock, is_active, is_default)
values
  (  (select id from prod), '1 kg', jsonb_build_object('weight', '1 kg'), 600.00, null, 50, true, true, false),
  (  (select id from prod), '500 g', jsonb_build_object('weight', '500 g'), 300.00, null, 50, true, true, true),
  (  (select id from prod), '250 g', jsonb_build_object('weight', '250 g'), 150.00, null, 50, true, true, false);

-- Chintakaya Pachadi (Sweet Tamarind) (చింతకాయ పచ్చడి)
with prod as (
  insert into public.products (name, native_name, category_id, description)
  values (
    'Chintakaya Pachadi (Sweet Tamarind)', 'చింతకాయ పచ్చడి',
    (select id from public.categories where slug = 'pickles'),
    'A traditional Andhra-style pickle, made in small batches.'
  )
  returning id
)
insert into public.product_variants
  (product_id, title, attributes, price, compare_at_price, stock, in_stock, is_active, is_default)
values
  (  (select id from prod), '1 kg', jsonb_build_object('weight', '1 kg'), 600.00, null, 50, true, true, false),
  (  (select id from prod), '500 g', jsonb_build_object('weight', '500 g'), 300.00, null, 50, true, true, true),
  (  (select id from prod), '250 g', jsonb_build_object('weight', '250 g'), 150.00, null, 50, true, true, false);

commit;
