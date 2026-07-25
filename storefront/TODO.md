# TODO: storefront production readiness

Covers the Andhra HomeFoods redesign, WhatsApp checkout, and SEO work. Nothing
here blocks local dev (every item has a working placeholder/fallback), but all
of it should be settled before the storefront goes live. Backend/R2 deployment
lives in the repo-root `TODO.md`.

## Blockers — dummy values to replace

- [ ] **`NEXT_PUBLIC_SITE_URL`** — real production origin, no trailing slash.
      Currently defaults to the placeholder `https://www.andhrahomefoods.in`
      in `lib/site.ts`. This one value drives `metadataBase`, **every
      canonical URL**, all Open Graph/Twitter URLs, `sitemap.xml`, and the
      `robots.txt` host + sitemap line. Wrong value = wrong canonicals =
      broken SEO. Set it in the hosting env (and `.env.local` for parity).
- [ ] **`NEXT_PUBLIC_WHATSAPP_NUMBER`** — the real WhatsApp business number,
      digits only with country code, no `+` (e.g. `9198…`). Currently
      defaults to the placeholder `919876543210` in `lib/whatsapp.ts`. Every
      "Order on WhatsApp" button builds `https://wa.me/<this>?text=…`.
- [ ] **Product & category photography.** Seeded `image_path`s point at
      objects that don't exist yet (`products/<slug>/main.jpg`,
      `.../detail-1.jpg`); categories mostly have empty `image_path`. Until
      real images are uploaded to the `images` bucket, the storefront renders
      the fallback placeholder tiles (the pale tiles you see in the hero,
      cards, product page, about hero). Uploading real photos is the single
      biggest visual win. (Depends on the R2/image work in root `TODO.md`.)
- [ ] **Telugu `native_name` values in the production DB.** The
      `20260720120000_native_names.sql` migration adds the (nullable) column;
      the actual Telugu names only exist in local `supabase/seed.sql`.
      Populate them in production (admin/dashboard), and have a native Telugu
      speaker proofread the seeded ones — double-check `కాజు కత్లీ`
      (Kaju Katli), `నిమ్మకాయ ఊరగాయ`, `గోంగూర ఊరగాయ`.

## Confirm — decisions I made that you should sign off on

- [ ] **WhatsApp message format.** Your core spec (per-item
      `Name / Qty / Variant=SKU / Cost`, `---` separators, then
      `Total without shipping: 2 * 129 + 3 * 49`) is implemented verbatim in
      `lib/whatsapp.ts`. I additionally: appended `= <total>` to the total
      line, added a one-line greeting, and appended a
      `My details — Name / Delivery address / Pincode` block (an order needs a
      delivery address). Confirm or trim.
- [ ] **Category mismatch with the design.** The handoff showed 5 categories
      (incl. "Papads & Vadiyalu"); the real catalog has 4 (Pickles, Spice
      Powders, Snacks, Sweets). Decide whether to add a Papads category +
      products, or leave at 4.
- [ ] **Brand facts.** Footer/about assert "Vizianagaram, Andhra Pradesh" and
      "since 1992" (from the design). Confirm these are accurate for the real
      business before launch — they're also emitted in Organization JSON-LD.

## SEO follow-ups (nice to have, not blocking)

- [ ] Google Search Console: verify the domain, submit `/sitemap.xml`. Can add
      a `verification: { google: "…" }` block to the metadata in
      `app/layout.tsx`.
- [ ] Analytics (GA4 / Plausible / etc.) — not wired yet.
- [ ] Set a Twitter handle (`twitter.site` / `creator`) in `app/layout.tsx`
      metadata if there's a brand account.
- [ ] Branded **favicon / apple-touch-icon / web manifest** — still the
      scaffold `app/favicon.ico`.
- [ ] `app/opengraph-image.tsx` uses a 🌿 emoji as the logo mark — swap for
      the real logo if there is one.
- [ ] `sitemap.ts` uses build time for `lastModified`; could use each row's
      `updated_at` for more accurate freshness signals.
- [ ] When product reviews exist, add `aggregateRating` to the Product JSON-LD
      in `app/products/[slug]/page.tsx` to unlock star rich-results.

## Code cleanup (tech debt, non-blocking)

- [ ] **Legacy color-token aliases** in `app/globals.css`
      (`chilli/turmeric/paper/cream/leaf/soft`) were kept so nothing broke
      mid-migration. The only remaining consumer is `components/veg-mark.tsx`,
      which is now **unused** — delete `veg-mark.tsx`, then remove the aliases.
- [ ] **Search result cards are second-class.** `search_products()` returns a
      flat row without `native_name` or a default variant, so search-result
      cards show no Telugu line and link through instead of quick-adding
      (see `lib/catalog.ts` `searchProducts`). Enhance the RPC to also return
      `native_name` + the default variant `id/sku/title` for full parity.
- [ ] Run a production **`next build`** to confirm ISR/prerender manifests and
      that the dynamic OG image route builds cleanly.

## Verify before calling this done

- [ ] With both env vars set: view-source a product page — canonical, OG, and
      `wa.me` all use the real domain/number.
- [ ] Real images load (no placeholder) on cards, product, hero, category.
- [ ] "Order on WhatsApp" on a real phone opens WhatsApp with the prefilled
      message and correct totals.
- [ ] `sitemap.xml` and `robots.txt` show the production host; submit the
      sitemap to Search Console.
