import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { supabase } from "./supabase";
import type {
  Category,
  ImageRow,
  ProductCardData,
  ProductDetail,
  VariantRow,
} from "./catalog";

// Server-only catalog data access. Every fetch is cached with `use cache` and
// tagged, so it's served from cache until the /api/revalidate route calls
// revalidateTag(...) (fired by a Supabase Database Webhook on catalog changes).
// The time-based cacheLife is only a fallback if that webhook never fires.
// Keeping these out of ./catalog means the next/cache imports never reach the
// client bundle.

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
  const sortedImages = [...(row.images ?? [])].sort(
    (a, b) =>
      Number(b.is_primary) - Number(a.is_primary) || a.sort_order - b.sort_order,
  );
  const image = sortedImages[0] ?? null;
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    nativeName: row.native_name,
    price: def?.price ?? null,
    compareAtPrice: def?.compare_at_price ?? null,
    inStock: variants.some((v) => v.in_stock),
    imagePath: image?.image_path ?? null,
    imagePaths: sortedImages.slice(0, 4).map((img) => img.image_path),
    categoryName: row.category?.name ?? null,
    categorySlug: row.category?.slug ?? null,
    variantCount: variants.length,
    defaultVariant:
      def && def.in_stock
        ? {
            id: def.id,
            title: def.title,
            sku: def.sku,
            price: def.price,
            compareAtPrice: def.compare_at_price,
            inStock: def.in_stock,
          }
        : null,
    variants: [...variants]
      .sort((a, b) => a.price - b.price)
      .map((v) => ({
        id: v.id,
        title: v.title,
        sku: v.sku,
        price: v.price,
        compareAtPrice: v.compare_at_price,
        inStock: v.in_stock,
      })),
  };
}

// Deliberately not `"use cache"` — every real request should log, not just
// the first one that populates a cache entry. Fire-and-forget: a logging
// failure must never break the search results page.
export function logSearch(term: string, resultCount: number): void {
  void supabase.rpc("log_search", { p_term: term, p_result_count: resultCount })
    .then(({ error }) => {
      if (error) console.error("log_search failed:", error.message);
    });
}

export async function getCategories(): Promise<Category[]> {
  "use cache";
  cacheLife("hours");
  cacheTag("categories");
  const { data, error } = await supabase
    .from("categories")
    .select("id, name, slug, description, image_path, native_name, updated_at")
    .order("id");
  if (error) throw error;
  return data;
}

export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  "use cache";
  cacheLife("hours");
  cacheTag("categories");
  const { data, error } = await supabase
    .from("categories")
    .select("id, name, slug, description, image_path, native_name, updated_at")
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function getProducts(opts?: {
  categorySlug?: string;
  limit?: number;
}): Promise<ProductCardData[]> {
  "use cache";
  cacheLife("hours");
  cacheTag("products");
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

// Curated via products.is_bestseller / bestseller_rank (staff sets these
// directly for now — see 20260919130000_product_bestsellers.sql). Falls
// back to the regular catalog order when nothing's been flagged yet, so the
// homepage section is never just empty.
export async function getBestsellers(limit = 12): Promise<ProductCardData[]> {
  "use cache";
  cacheLife("hours");
  cacheTag("products");
  const { data, error } = await supabase
    .from("products")
    .select(CARD_SELECT)
    .eq("is_bestseller", true)
    .order("bestseller_rank", { ascending: true, nullsFirst: false })
    .order("name")
    .limit(limit);
  if (error) throw error;
  const rows = (data as unknown as CardRow[]).map(toCard);
  return rows.length > 0 ? rows : getProducts({ limit });
}

// Slim, sitemap-only query — deliberately not routed through getProducts()
// (ProductCardData is also returned by the client-safe search RPC, so
// widening it would mean widening that RPC too, just for a lastModified
// date).
export async function getProductSitemapEntries(): Promise<
  { slug: string; updatedAt: string }[]
> {
  "use cache";
  cacheLife("hours");
  cacheTag("products");
  const { data, error } = await supabase
    .from("products")
    .select("slug, updated_at")
    .order("slug");
  if (error) throw error;
  return data.map((p) => ({ slug: p.slug, updatedAt: p.updated_at }));
}

export async function getProductBySlug(slug: string): Promise<ProductDetail | null> {
  "use cache";
  cacheLife("hours");
  cacheTag("products");
  const { data, error } = await supabase
    .from("products")
    .select(
      `id, slug, name, native_name, description, keywords, meta_title, meta_description,
       category:categories(name, slug),
       variants:product_variants!inner(id, title, sku, price, compare_at_price, stock, in_stock, is_default),
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
