# TODO: production readiness

`r2-presign` already supports both storage drivers (`STORAGE_DRIVER=local`
today, `STORAGE_DRIVER=r2` for prod — see README "Storage" section). Nothing
below blocks local development; all of it must happen before the hosted
project can serve real image/invoice traffic.

## Storefront — before real traffic

- [ ] **`generate-invoice` ships fake business details.** Name, address,
      phone, GSTIN are all literal `"PLACEHOLDER"` strings in
      `supabase/functions/generate-invoice/index.ts` — every invoice issued
      today is legally unusable. Deliberately left untouched for now — fill
      in before any real order is invoiced.
- [ ] **`NEXT_PUBLIC_WHATSAPP_NUMBER` is required now, not optional.**
      `lib/whatsapp.ts` fails the build/render if it's unset (previously
      silently fell back to a placeholder number — orders would have gone
      nowhere with no error). Set it in every environment's `.env.local` /
      hosting env vars, including local dev.
- [ ] **No real order-creation path from the storefront.** Checkout only
      builds a `wa.me` deep link with the cart as text — nothing is ever
      written to `orders`/`order_items`. Staff manually re-key every order
      from the WhatsApp chat, with no system-of-record link between the two.
      Confirm this is genuinely the intended v1 workflow before real volume.
- [ ] Zero automated test coverage (no unit/e2e tests) and no error
      monitoring (e.g. Sentry) wired into the storefront or edge functions.
      `app/error.tsx`/`global-error.tsx` now catch render-time exceptions in
      the UI, but failures are still only visible via `console.error`/logs.
- [ ] CI (`.github/workflows/ci.yml`) only runs lint + typecheck for the
      storefront and `deno check` for the edge functions — no `next build`
      or e2e, since build needs a live Supabase URL/anon key. Wire that up
      once there's a CI-reachable Supabase project (or mocked catalog data)
      to build against.
- [ ] (Hardening, not blocking) CSP in `next.config.ts` uses `'unsafe-inline'`
      on `script-src` — Next's App Router streams RSC payloads via inline
      `<script>` tags with no nonce wired up yet. A per-request nonce via
      middleware would tighten this.
- [ ] (Hardening, not blocking) No rate limiting anywhere — the
      `search_products` RPC, `/api/revalidate`, and both edge functions are
      all reachable at whatever rate a caller sends requests. Fine at
      current scale; cheap to add later (Cloudflare in front, or Supabase's
      built-in options).

## Cloudflare R2

- [ ] Buy the domain (blocks the two domain-dependent items below).
- [ ] Create two R2 buckets, both APAC: `homefoods-images`, `homefoods-invoices`.
- [ ] Create an R2 API token (S3-compatible Access Key ID/Secret) scoped to
      just those two buckets — not an account-wide token.
- [ ] **CORS on both buckets** — the dashboard/storefront origins must be
      allowed to `PUT` directly to presigned upload URLs, or uploads will
      fail in-browser with an opaque CORS error. Easy to miss since local
      dev (Supabase Storage) doesn't need this.
- [ ] Connect an R2 **custom domain** to `homefoods-images` (keep
      `homefoods-invoices` off any public domain — it must stay private).
      This produces the value for `R2_PUBLIC_BASE_URL`.

## Supabase (hosted project)

- [ ] `npx supabase secrets set STORAGE_DRIVER=r2 R2_ACCESS_KEY_ID=... \`
      `R2_SECRET_ACCESS_KEY=... R2_S3_ENDPOINT=... \`
      `R2_BUCKET_IMAGES=homefoods-images R2_BUCKET_INVOICES=homefoods-invoices`
      (see SETUP.md "Hosted project"). Until this is set, `r2-presign` on
      the hosted project fails closed with "Missing required secret" rather
      than silently writing to the wrong place.
- [x] ~~`npx supabase link --project-ref <ref>` + `npx supabase db push`.~~
      Project is linked; all migrations (through
      `20260810091500_search_products_clamp_paging.sql`) are pushed and
      confirmed in sync (`supabase migration list` shows local == remote).
      Note for future migrations that touch function-level `SET` clauses on
      extension GUCs (e.g. `pg_trgm.*`): the hosted migration role doesn't
      have privilege to attach those (`SQLSTATE 42501`) — call the
      underlying function explicitly (e.g. `word_similarity()`) instead of
      relying on a session GUC.
- [ ] Hosted dashboard: Authentication → Sign In / Providers → *Allow new
      users to sign up* → OFF, anonymous sign-ins → OFF (config.toml only
      governs the local stack — see README "Auth" section).
- [x] ~~Prevent inactivity pause (prod only).~~ `keep_alive` table +
      daily `pg_cron` job added (`supabase/migrations/20260810090000_keep_alive.sql`)
      — real DB activity every day keeps the project from ever reaching the
      7-day inactivity threshold. Still only a stopgap: it can't revive an
      *already*-paused project (pg_cron pauses with it), so upgrading to Pro
      (projects never pause) remains the robust fix before real traffic.

## Frontend (dashboard / storefront — separate repos)

- [ ] Once `R2_PUBLIC_BASE_URL` exists, wire it in so image `<img>` src is
      built directly (`${R2_PUBLIC_BASE_URL}/${image_path}`) instead of
      calling `r2-presign` with `action: "download"` for images — that
      round-trip is only meant to be a pre-domain stopgap.
- [ ] Invoice downloads keep going through `r2-presign` (`action:
      "download"`, `bucket: "invoices"`) — that bucket is never public, in
      any environment.

## Verify before calling this done

- [ ] Staff-authenticated upload → presigned PUT → object lands in
      `homefoods-images`.
- [ ] Public image URL (via the custom domain) loads with **no**
      Authorization header.
- [ ] Invoice download still requires a staff JWT and a fresh signed URL.
- [ ] Delete removes the object from R2, not just the DB row.
- [ ] (Optional, cost/perf) Cloudflare Image Transformations
      (`/cdn-cgi/image/...`) wired for the srcset widths noted in the
      README, to stay inside the free 5k-unique-transforms tier.
