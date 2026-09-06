import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Anonymous, read-only catalog access — the storefront never authenticates.
export const supabase = createClient<Database>(url, anonKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

// Public Cloudflare R2 origin serving the `images` bucket — its custom domain
// in production (or the r2.dev URL for staging). No trailing slash. When set,
// image URLs are built directly against it.
const r2PublicBaseUrl = (
  process.env.NEXT_PUBLIC_R2_PUBLIC_BASE_URL || ""
).replace(/\/$/, "");

// Fixed size/quality buckets for Cloudflare Image Resizing (zone-level,
// "This zone only" source), kept deliberately small: each distinct
// width/quality/format combo is a separate billed transformation on the free
// tier (5,000/month), cached at the edge after the first request. Every
// CatalogImage call site picks one of these rather than an arbitrary pixel
// width, so the whole app can never produce more than a handful of variants
// per source image.
const IMAGE_PRESETS = {
  thumb: { width: 96, quality: 70 }, // cart, search dropdown, variant drawer, gallery thumbnails
  card: { width: 480, quality: 75 }, // product grid cards, home tiles/collage
  gallery: { width: 800, quality: 75 }, // category hero, product gallery main image
  zoom: { width: 1200, quality: 80 }, // lightbox full view
} as const;

export type ImagePreset = keyof typeof IMAGE_PRESETS;

// image_path columns store object keys (e.g. "products/avakaya/main.jpg"),
// never full URLs. In production the objects live in the public R2 bucket
// above. When NEXT_PUBLIC_R2_PUBLIC_BASE_URL is unset (local dev) we fall back
// to the local Supabase Storage public object route, so images still work with
// zero extra config — that origin isn't proxied through the Cloudflare zone,
// so presets don't apply there.
export function productImageUrl(path: string, preset?: ImagePreset) {
  const key = path.replace(/^\/+/, "");
  if (!r2PublicBaseUrl) {
    return `${url}/storage/v1/object/public/images/${key}`;
  }
  if (!preset) return `${r2PublicBaseUrl}/${key}`;
  const { width, quality } = IMAGE_PRESETS[preset];
  return `${r2PublicBaseUrl}/cdn-cgi/image/width=${width},quality=${quality},format=auto/${key}`;
}
