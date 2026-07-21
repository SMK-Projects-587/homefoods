import { supabase } from "./supabase";
import type { Tables } from "./database.types";

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

// product_variants!inner: a product with zero caller-visible active variants
// (RLS hides variants of inactive products, and all-inactive variants) has
// nothing to sell — never fetch it.
const CARD_SELECT = `id, slug, name, native_name,
  category:categories(name, slug),
  variants:product_variants!inner(id, title, sku, price, compare_at_price, in_stock, is_default),
  images:product_images(image_path, is_primary, sort_order)`;

type CardRow = {
  id: number;
  slug: string;
  name: string;
  native_name: string | null;
  category: { name: string; slug: string } | null;
  variants: Pick<
    VariantRow,
    "id" | "title" | "sku" | "price" | "compare_at_price" | "in_stock" | "is_default"
  >[];
  images: Pick<ImageRow, "image_path" | "is_primary" | "sort_order">[];
};

function toCard(row: CardRow): ProductCardData {
  const variants = row.variants ?? [];
  const def =
    variants.find((v) => v.is_default) ??
    [...variants].sort((a, b) => a.price - b.price)[0] ??
    null;
  const image =
    [...(row.images ?? [])].sort(
      (a, b) =>
        Number(b.is_primary) - Number(a.is_primary) ||
        a.sort_order - b.sort_order,
    )[0] ?? null;
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    nativeName: row.native_name,
    price: def?.price ?? null,
    compareAtPrice: def?.compare_at_price ?? null,
    inStock: variants.some((v) => v.in_stock),
    imagePath: image?.image_path ?? null,
    categoryName: row.category?.name ?? null,
    categorySlug: row.category?.slug ?? null,
    variantCount: variants.length,
    defaultVariant:
      def && def.in_stock
        ? { id: def.id, title: def.title, sku: def.sku, price: def.price }
        : null,
  };
}

export async function getCategories(): Promise<Category[]> {
  const { data, error } = await supabase
    .from("categories")
    .select("id, name, slug, description, image_path, native_name")
    .order("id");
  if (error) throw error;
  return data;
}

export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  const { data, error } = await supabase
    .from("categories")
    .select("id, name, slug, description, image_path, native_name")
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function getProducts(opts?: {
  categorySlug?: string;
  limit?: number;
}): Promise<ProductCardData[]> {
  // !inner turns the category join into a filterable one when narrowing by slug.
  const select = opts?.categorySlug
    ? CARD_SELECT.replace("category:categories(", "category:categories!inner(")
    : CARD_SELECT;
  let query = supabase.from("products").select(select).order("name");
  if (opts?.categorySlug) query = query.eq("categories.slug", opts.categorySlug);
  if (opts?.limit) query = query.limit(opts.limit);
  const { data, error } = await query;
  if (error) throw error;
  return (data as unknown as CardRow[]).map(toCard);
}

export async function getProductBySlug(slug: string): Promise<ProductDetail | null> {
  const { data, error } = await supabase
    .from("products")
    .select(
      `id, slug, name, native_name, description, keywords, meta_title, meta_description,
       category:categories(name, slug),
       variants:product_variants!inner(id, title, sku, attributes, price, compare_at_price, stock, in_stock, is_default),
       images:product_images(id, image_path, alt_text, is_primary, sort_order)`,
    )
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const detail = data as unknown as ProductDetail;
  detail.variants.sort((a, b) => a.price - b.price);
  detail.images.sort(
    (a, b) =>
      Number(b.is_primary) - Number(a.is_primary) || a.sort_order - b.sort_order,
  );
  return detail;
}

// Full-text + trigram search via the search_products() RPC. Returns rows
// already shaped for a product card (default variant price, primary image).
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
