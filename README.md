# HomeFoods — Supabase backend

Standalone Supabase backend for HomeFoods, a small Indian food e-commerce
business (pickles, podis, snacks, sweets). It replaces the old Django/DRF
backend (kept read-only at `../backend` for reference). There is **no
application server**: the entire backend is versioned SQL migrations, and the
future React admin dashboard talks to Supabase directly via
PostgREST/supabase-js.

> **New machine?** `npm run setup` bootstraps everything (pinned supabase
> CLI, env files, local stack with all migrations + seed). See
> [SETUP.md](./SETUP.md) for prerequisites and the manual-secrets checklist.

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

**Nothing is ever deleted.** Categories, products, orders, invoices and
invoice counters cannot be DELETEd by staff (privilege revoked + RLS, see
`..._deletion_protection.sql`): deactivate catalog records (`is_active`),
cancel orders, void invoices. Variants, images and order items stay
deletable (routine data entry; order history survives via snapshots). The
service key retains DELETE as a deliberate owner-only escape hatch.

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

The supabase CLI is a pinned devDependency (`npm ci` installs it), so `npx
supabase` below always resolves to the same version on every machine — never
a global/`npx`-latest CLI. The same commands are also wrapped as npm scripts
(`npm run db:start`, `db:reset`, `db:status`, `functions:serve`, `types` —
see `package.json`) if you'd rather skip the Makefile.

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

## Storage: local Supabase Storage (dev) / Cloudflare R2 (prod) + `r2-presign`

Images and invoice PDFs are **not** stored in the database. `image_path`
columns store object keys (`products/<slug>/main.jpg`), never URLs. Where
those keys actually live differs by environment, selected by the
`STORAGE_DRIVER` secret read by the `r2-presign` edge function:

- **Local (`STORAGE_DRIVER=local`, the default — see `functions-env`
  below):** the `images` and `invoices` buckets declared in
  `supabase/config.toml`, served by the `storage-api` container that's
  already part of `supabase start`. Zero Cloudflare setup needed to develop.
  `images` is a **public** bucket — reads are plain, unsigned GETs, no staff
  auth involved. `invoices` stays private.
- **Production (`STORAGE_DRIVER=r2`):** **Cloudflare R2** (zero egress
  fees), two buckets, both APAC: `homefoods-images` (will be public via an
  R2 custom domain once bought — no `r2.dev` URL enabled) and
  `homefoods-invoices` (private, presigned-URL access only). **Not set up
  yet** — see [TODO.md](./TODO.md) for what's left before this can go live.

Either way, browsers can't hold storage credentials directly, so the
**`r2-presign` edge function** (staff JWT required — same trust model)
brokers upload/delete for both buckets, and download for the private one:

```
POST /functions/v1/r2-presign   Authorization: Bearer <staff jwt>
  {"action":"upload",   "bucket":"images|invoices", "key":"products/x/y.jpg"}
     -> presigned PUT url (client uploads directly to storage)
  {"action":"download", ...}  -> signed GET url for invoices; for the public
                                  images bucket, a plain unsigned URL instead
  {"action":"delete",   ...}  -> deletes the object server-side
```

Once a public base URL exists for images (locally: the Storage public
object route; in prod: `R2_PUBLIC_BASE_URL` after the domain is connected),
the frontend can build image URLs directly and skip calling `r2-presign` for
image reads entirely — it's only required for uploads, deletes, and
invoice downloads.

Secrets: `npm run functions:env` (or `make functions-env`) writes
`supabase/functions/.env` (gitignored, auto-loaded by `supabase functions
serve`) with `STORAGE_DRIVER=local` plus any `R2_*` lines found in `.env`
(only needed if you want to test the `r2` driver locally against real R2
credentials). On the hosted project, `STORAGE_DRIVER=r2` and the `R2_*`
secrets are set via `npx supabase secrets set` — see TODO.md. Local serve:

```bash
npx supabase functions serve r2-presign
```

Image optimization plan (once the R2 domain exists): keep one untouched
master per image; serve via Cloudflare Image Transformations
(`/cdn-cgi/image/width=...,format=auto/...`) with fixed srcset widths
(320/640/960/1280/1920) to stay inside the free 5k-unique-transforms tier.

## TODO (future work)

- [ ] Invoice PDF generation (edge function) + Cloudflare R2 upload (`invoices.pdf_key`)
- [ ] Keep-alive ping — free-tier projects pause after ~7 days of inactivity
- [ ] Stock decrement on confirmed orders / restock on cancellation
- [ ] Totals validation trigger (`line_total = unit_price * quantity`, order totals from items)
- [ ] Guard trigger: issued invoices immutable except `status -> 'void'`
