# TODO: storefront production readiness

Covers the Andhra HomeFoods redesign, WhatsApp checkout, and SEO work. Nothing
here blocks local dev (every item has a working placeholder/fallback), but all
of it should be settled before the storefront goes live. Backend/R2 deployment
lives in the repo-root `TODO.md`.

## Blockers — dummy values to replace

- [ ] **`NEXT_PUBLIC_SITE_URL`** — real production origin, no trailing slash.
      `lib/site.ts` now defaults to `https://www.andhrabrahminhomefoods.org`
      (the real domain), but set this explicitly in the Vercel env so it
      doesn't silently rely on the fallback. This one value drives
      `metadataBase`, **every canonical URL**, all Open Graph/Twitter URLs,
      `sitemap.xml`, and the `robots.txt` host + sitemap line. Wrong value =
      wrong canonicals = broken SEO — this was live on prod pointing at an
      unrelated WordPress domain (`www.andhrahomefoods.in`) until 2026-09-20.

## Confirm — decisions I made that you should sign off on

- [ ] **WhatsApp message format.** Your core spec (per-item
      `Name / Qty / Variant=SKU / Cost`, `---` separators, then
      `Total without shipping: 2 * 129 + 3 * 49`) is implemented verbatim in
      `lib/whatsapp.ts`. I additionally: appended `= <total>` to the total
      line, added a one-line greeting, and appended a
      `My details — Name / Delivery address / Pincode` block (an order needs a
      delivery address). Confirm or trim.
- [x] **Brand facts.** Footer/about assert "Vizianagaram, Andhra Pradesh" and
      "since 1993" — confirmed accurate, updated from the design's "1992"
      everywhere (footer, header, about, homepage, layout JSON-LD, OG image,
      site description).

## SEO follow-ups (nice to have, not blocking)

- [ ] Google Search Console: verify the domain, submit `/sitemap.xml`. Can add
      a `verification: { google: "…" }` block to the metadata in
      `app/layout.tsx`.
- [ ] Analytics (GA4 / Plausible / etc.) — not wired yet.
- [ ] Set a Twitter handle (`twitter.site` / `creator`) in `app/layout.tsx`
      metadata if there's a brand account.
- [x] Branded **favicon / apple-touch-icon** — replaced with a cropped brand
      logo icon (`app/icon.png`, `app/apple-icon.png`), matching the header's
      circular logo badge.
- [ ] `app/opengraph-image.tsx` still uses a 🌿 emoji as the logo mark, not
      the real logo — swap it for the actual brand mark.
- [ ] `sitemap.ts` uses build time for `lastModified`; could use each row's
      `updated_at` for more accurate freshness signals.
- [ ] When product reviews exist, add `aggregateRating` to the Product JSON-LD
      in `app/products/[slug]/page.tsx` to unlock star rich-results.

## Code cleanup (tech debt, non-blocking)

- [ ] **Legacy color-token aliases** in `app/globals.css`
      (`chilli/turmeric/paper/cream/leaf/soft`) were kept so nothing broke
      mid-migration. The only remaining consumer is `components/veg-mark.tsx`,
      which is now **unused** — delete `veg-mark.tsx`, then remove the aliases.
- [x] **Search result cards: Telugu line.** `search_products()` now returns
      `native_name` (`20260920080000_search_products_native_name.sql`);
      `searchProducts()` in `lib/catalog.ts` maps it through, and
      `product-card.tsx` already rendered it conditionally, so no component
      change was needed. Needs `supabase db push` to reach prod.
- [ ] **Search result cards still can't quick-add.** `search_products()` still
      doesn't return default-variant `id/sku/title`, so `defaultVariant` and
      `variants` stay empty for search cards and they link through to the
      product page instead of quick-adding (see `lib/catalog.ts`
      `searchProducts`).
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
