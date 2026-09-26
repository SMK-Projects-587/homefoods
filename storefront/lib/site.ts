// Canonical site identity used across metadata, structured data, sitemap and
// robots. Set NEXT_PUBLIC_SITE_URL to the production origin (no trailing slash)
// — the placeholder below only keeps local builds from erroring.
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || "https://www.andhrabrahminhomefoods.org"
).replace(/\/$/, "");

export const SITE_NAME = "Andhra Brahmin Home Own Manufacturing Food Items";

export const SITE_TAGLINE = "Traditional Food, shipped to your door";

// Kept to ~142 chars — Bing/Google truncate well past 155-160, so this stays
// inside the recommended range instead of getting cut off mid-sentence.
export const SITE_DESCRIPTION =
  "Traditional Brahmin home-style Andhra foods from Vizianagaram since 1993 — pickles, podis, snacks and sweets, hand-made with no preservatives.";

// Absolute URL helper for canonicals / structured data.
export function absoluteUrl(path = "/"): string {
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}
