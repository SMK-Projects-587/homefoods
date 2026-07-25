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

// image_path columns store object keys (e.g. "products/avakaya/main.jpg"),
// never full URLs. In production the objects live in the public R2 bucket
// above. When NEXT_PUBLIC_R2_PUBLIC_BASE_URL is unset (local dev) we fall back
// to the local Supabase Storage public object route, so images still work with
// zero extra config.
export function productImageUrl(path: string) {
  const key = path.replace(/^\/+/, "");
  return r2PublicBaseUrl
    ? `${r2PublicBaseUrl}/${key}`
    : `${url}/storage/v1/object/public/images/${key}`;
}
