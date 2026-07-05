# HomeFoods — storefront

Public storefront for the HomeFoods catalog. Next.js (App Router) talking
directly to the local Supabase stack with the **anon key** — RLS restricts it
to the active catalog, exactly as the backend intends. No accounts, no logins.

- **Catalog pages**: home, `/products` (listing + search + category filter),
  `/category/[slug]`, `/products/[slug]` (variant picker + add to cart).
- **Search** uses the `search_products()` RPC — weighted full-text plus
  trigram fallback, so typos like "avakya" still find Avakaya.
- **Cart** is frontend-only: React context persisted to
  `localStorage` (`homefoods:cart:v1`), shown in a slide-in sidebar and at
  `/cart`. The checkout button is intentionally a no-op for now.
- **Images**: `image_path` columns point into the public `product-images`
  bucket. Objects don't exist locally yet, so `CatalogImage` falls back to a
  decorative tile; real photos will appear automatically once uploaded.

## Running

```bash
# from the repo root — start the local Supabase stack first
npx supabase start

# then, in storefront/
cp .env.example .env.local   # paste the anon key from `npx supabase status`
npm install
npm run dev
```

`lib/database.types.ts` is a copy of `../types/database.types.ts` (generated
via `npx supabase gen types typescript --local`). Re-copy it after schema
changes.
