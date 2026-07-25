import { supabase } from "./supabase";
import type { Tables } from "./database.types";

// Shared catalog types + the client-safe search call. The cached, server-only
// data fetchers (getCategories, getProducts, …) live in ./catalog.server so
// their `use cache` / next/cache imports never reach the client bundle — this
// module is imported by client components (search-bar.tsx) too.

export type Category = Pick<
  Tables<"categories">,
  "id" | "name" | "slug" | "description" | "image_path" | "native_name"
>;

export type VariantRow = Pick<
  Tables<"product_variants">,
  | "id"
  | "title"
  | "sku"
  | "attributes"
  | "price"
  | "compare_at_price"
  | "stock"
  | "in_stock"
  | "is_default"
>;

export type ImageRow = Pick<
  Tables<"product_images">,
  "id" | "image_path" | "alt_text" | "is_primary" | "sort_order"
>;

// The default variant a card's quick-add button drops into the cart.
export type CardVariant = {
  id: number;
  title: string;
  sku: string;
  price: number;
};

export type ProductCardData = {
  id: number;
  slug: string;
  name: string;
  nativeName: string | null;
  price: number | null;
  compareAtPrice: number | null;
  inStock: boolean;
  imagePath: string | null;
  categoryName: string | null;
  categorySlug: string | null;
  variantCount: number | null;
  // null when we can't resolve a default variant (e.g. search RPC cards);
  // the card falls back to linking through to the product page.
  defaultVariant: CardVariant | null;
};

export type ProductDetail = {
  id: number;
  slug: string;
  name: string;
  native_name: string | null;
  description: string;
  keywords: string[];
  meta_title: string;
  meta_description: string;
  category: { name: string; slug: string } | null;
  variants: VariantRow[];
  images: ImageRow[];
};

// Full-text + trigram search via the search_products() RPC. Returns rows
// already shaped for a product card (default variant price, primary image).
// Not cached: the term is user input and this is also called live from the
// client search overlay.
export async function searchProducts(
  term: string,
  opts?: { categorySlug?: string; limit?: number },
): Promise<ProductCardData[]> {
  const { data, error } = await supabase.rpc("search_products", {
    term,
    category_slug: opts?.categorySlug,
    max_results: opts?.limit ?? 48,
    require_variant: true,
  });
  if (error) throw error;
  return data.map((row) => ({
    id: row.id,
    slug: row.slug,
    name: row.name,
    // The search RPC returns a flat row without native_name or variant ids,
    // so these cards show no Telugu line and link through instead of quick-add.
    nativeName: null,
    price: row.price,
    compareAtPrice: row.compare_at_price,
    inStock: row.in_stock,
    imagePath: row.primary_image_path || null,
    categoryName: null,
    categorySlug: row.category_slug_out || null,
    variantCount: null,
    defaultVariant: null,
  }));
}
