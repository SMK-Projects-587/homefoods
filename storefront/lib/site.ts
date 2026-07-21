// Canonical site identity used across metadata, structured data, sitemap and
// robots. Set NEXT_PUBLIC_SITE_URL to the production origin (no trailing slash)
// — the placeholder below only keeps local builds from erroring.
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || "https://www.andhrahomefoods.in"
).replace(/\/$/, "");

export const SITE_NAME = "Andhra HomeFoods";

export const SITE_TAGLINE = "Amma's kitchen, shipped to your door";

export const SITE_DESCRIPTION =
  "Traditional Brahmin home-style Andhra foods from Vizianagaram since 1992: pindi vantalu, podis, pickles, sweets and papads — hand-made in small batches, 100% pure veg, no preservatives.";

// Absolute URL helper for canonicals / structured data.
export function absoluteUrl(path = "/"): string {
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}
