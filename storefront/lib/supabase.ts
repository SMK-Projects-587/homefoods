import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Anonymous, read-only catalog access — the storefront never authenticates.
export const supabase = createClient<Database>(url, anonKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

// image_path columns store object paths inside the public product-images
// bucket, not URLs.
export function productImageUrl(path: string) {
  return `${url}/storage/v1/object/public/product-images/${path}`;
}
