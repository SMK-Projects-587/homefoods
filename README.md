# HomeFoods — Supabase backend

Standalone Supabase backend for HomeFoods, a small Indian food e-commerce
business (pickles, podis, snacks, sweets). It replaces the old Django/DRF
backend (kept read-only at `../backend` for reference). There is **no
application server**: the entire backend is versioned SQL migrations, and the
future React admin dashboard talks to Supabase directly via
PostgREST/supabase-js.

## Trust model — read this first

- **Every authenticated user is staff/admin.** There are no customer
  accounts, ever. Public signups are disabled; staff accounts are created
  manually by the owner.
- The `anon` key gets **read-only access to the active catalog** (categories,
  active products/variants, their images) so a public storefront can exist
  later. Nothing else.
- Orders are recorded manually by staff. No payments, no automation.
- Invoices are legal documents (India, GST): sequential numbering per Indian
  financial year, immutable snapshots of billing data and line items.

RLS policies are deliberately flat (`authenticated` = full access) because of
this model. If customer accounts are ever introduced, rewrite
`20260705191531_rls_policies.sql`'s successors — don't patch.

## Directory layout

```
supabase/
  config.toml          # local stack config (signups disabled here too)
  seed.sql             # local dev data: catalog, orders, one issued invoice
  migrations/
    ..._extensions.sql        # pg_trgm, set_updated_at(), slugify()
    ..._categories.sql        # categories + race-safe unique-slug trigger
    ..._products.sql          # products + search_vector trigger (simple config)
    ..._product_variants.sql  # sellable units, jsonb attributes, HF-xxxxxx SKUs
    ..._product_images.sql    # one primary per product (index + auto-demote)
    ..._orders.sql            # orders + order_items (snapshot columns)
    ..._invoices.sql          # invoices + per-FY invoice numbering
    ..._search.sql            # search_products() RPC
    ..._rls_policies.sql      # grants + RLS (trust model above)
    ..._storage.sql           # product-images (public) / invoices (private)
types/
  database.types.ts    # generated: npx supabase gen types typescript --local
```

## Schema overview

```
categories 1──* products 1──* product_variants     auth.users
                    │                                  │
                    1──* product_images                │ created_by
                                                       │
        orders 1──* order_items *──(set null)── product_variants
          │            (snapshots: name/title/sku/attrs/price)
          1──1 invoices ──uses── invoice_counters (per-FY sequence)
```

- **products** carry no price/stock/SKU — every sellable attribute lives on
  **product_variants** (`title` like "500 g", free-form `attributes` jsonb,
  price/compare_at_price, stock, `is_default`). Nothing hard-codes "weight".
- **order_items** snapshot everything needed to display/invoice the line, so
  history survives variant edits/deletions.
- **invoices** freeze billing data + line items; numbering is
  `HF/<FY>/<seq>` (e.g. `HF/2026-27/0001`), sequential per Indian financial
  year (Apr 1 – Mar 31, computed in Asia/Kolkata), race-safe via an atomic
  UPSERT on `invoice_counters`.

Notable triggers (each commented in its migration):

| Trigger | Behaviour |
|---|---|
| slug generation | blank slug → slugified name, `-1`/`-2` on collision, advisory-lock race-safe |
| search vector | `'simple'` config (no stemming — "Avakaya" stays "Avakaya"); weights: name **A**, keywords **A**, description **B** |
| SKU / order number | blank → `HF-000042` / `ORD-000042` from the identity value |
| primary image | setting `is_primary = true` auto-demotes the previous primary (plus a partial unique index as backstop) |
| invoice number | blank → next per-FY sequence |

## Search

`search_products(term, category_slug, in_stock_filter, max_results, offset_by)`
— call via `supabase.rpc('search_products', { term: 'avakaya' })`.

- Full-text websearch on the weighted vector **or** trigram word-similarity
  fallback for typos (`avakya` still finds Avakaya; threshold 0.3, pinned on
  the function).
- Ordered by `ts_rank` desc (name/keyword matches first), then `id` desc.
- Returns the product row plus its default variant's price/availability and
  the primary image path — everything a list card needs.
- `SECURITY INVOKER`, so RLS applies: anon only searches active products,
  staff search everything.

## Commands

Day-to-day work goes through the Makefile (it papers over the local-stack
gotchas: the edge runtime container staying stopped after `supabase start`,
`db reset` wiping auth users, functions needing their own secrets file):

```bash
make up          # start everything: stack, edge runtime, functions env, staff user, smoke test
make down        # stop the stack
make restart     # stop+start (needed after config.toml / functions/.env changes)
make reset       # replay migrations + seed, recreate staff user, smoke test
make status      # stack + edge runtime state
make smoke       # REST / RLS / search / edge-function health check
make staff-user  # (re)create local staff login (staff@homefoods.test / local-dev-password-1)
make types       # regenerate types/database.types.ts
make migration name=add_thing   # new migration file
```

The underlying CLI, if you need it directly:

```bash
npx supabase start        # start local stack (Docker)
npx supabase stop         # stop it (config.toml changes need stop+start)
npx supabase status       # URLs and local API keys
npx supabase db reset     # replay all migrations + seed.sql
npx supabase migration new <name>   # new migration file
npx supabase gen types typescript --local > types/database.types.ts

# hosted project (after `npx supabase login`)
npx supabase link --project-ref <ref>
npx supabase db push      # apply local migrations to the hosted DB
```

Migrations are **append-only** once pushed to the hosted project: fix
mistakes with a new migration, never by editing a pushed file.

## Auth: how staff users are created

Signups are disabled everywhere; there is no self-service path.

- **Hosted:** Dashboard → Authentication → Users → *Add user* (create with
  email + password, mark email as confirmed).
- **Local / scripted:** admin API with the service key:

  ```bash
  curl -X POST "$SUPABASE_URL/auth/v1/admin/users" \
    -H "apikey: $SERVICE_ROLE_KEY" -H "Authorization: Bearer $SERVICE_ROLE_KEY" \
    -H "Content-Type: application/json" \
    -d '{"email":"staff@example.com","password":"...","email_confirm":true}'
  ```

> **Hosted dashboard checklist (config.toml only governs the local stack):**
> Authentication → Sign In / Providers: *Allow new users to sign up* → **OFF**,
> anonymous sign-ins → **OFF**, keep only Email enabled.

## Storage: Cloudflare R2 + `r2-presign` edge function

Images and invoice PDFs live in **Cloudflare R2** (zero egress fees), not
Supabase Storage. Two buckets, both APAC:

- `homefoods-images` — product/category images. Will be public via an R2
  custom domain once the domain is bought (no `r2.dev` URL enabled).
  `image_path` columns store object keys (`products/<slug>/main.jpg`), never
  URLs — the frontend builds URLs from `R2_PUBLIC_BASE_URL`.
- `homefoods-invoices` — private invoice PDFs, presigned-URL access only.

Browsers can't hold R2 credentials, so the **`r2-presign` edge function**
(staff JWT required — same trust model) brokers all access:

```
POST /functions/v1/r2-presign   Authorization: Bearer <staff jwt>
  {"action":"upload",   "bucket":"images|invoices", "key":"products/x/y.jpg"}
     -> presigned PUT url (client uploads directly to R2)
  {"action":"download", ...}  -> presigned GET url (private invoices; images pre-domain)
  {"action":"delete",   ...}  -> deletes the object server-side
```

Secrets: copy the `R2_*` lines from `.env` into `supabase/functions/.env`
(gitignored, auto-loaded by `supabase functions serve`); on the hosted
project use `npx supabase secrets set` instead. Local serve:

```bash
npx supabase functions serve r2-presign
```

Image optimization plan (once the domain exists): keep one untouched master
per image; serve via Cloudflare Image Transformations
(`/cdn-cgi/image/width=...,format=auto/...`) with fixed srcset widths
(320/640/960/1280/1920) to stay inside the free 5k-unique-transforms tier.

Supabase Storage is not used at all (an early `storage` migration created
buckets there, but it was removed before anything was pushed — R2 is the
only object store).

## TODO (future work)

- [ ] Invoice PDF generation (edge function) + Cloudflare R2 upload (`invoices.pdf_key`)
- [ ] Keep-alive ping — free-tier projects pause after ~7 days of inactivity
- [ ] Stock decrement on confirmed orders / restock on cancellation
- [ ] Totals validation trigger (`line_total = unit_price * quantity`, order totals from items)
- [ ] Guard trigger: issued invoices immutable except `status -> 'void'`
