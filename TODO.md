# TODO: production R2 + deployment

`r2-presign` already supports both storage drivers (`STORAGE_DRIVER=local`
today, `STORAGE_DRIVER=r2` for prod — see README "Storage" section). Nothing
below blocks local development; all of it must happen before the hosted
project can serve real image/invoice traffic.

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
- [ ] `npx supabase link --project-ref <ref>` + `npx supabase db push` if
      not already done.
- [ ] Hosted dashboard: Authentication → Sign In / Providers → *Allow new
      users to sign up* → OFF, anonymous sign-ins → OFF (config.toml only
      governs the local stack — see README "Auth" section).
- [ ] **Prevent inactivity pause (prod only).** Free-tier Supabase projects
      pause after ~7 days of inactivity, and a paused project can't wake
      itself (its internal `pg_cron` is paused too). Before real traffic, set
      up a way to keep the prod project from pausing. Robust fix: upgrade to
      Pro (projects never pause) — an external scheduled keep-alive query is
      only a free stopgap, not something to rely on for a live store.

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
