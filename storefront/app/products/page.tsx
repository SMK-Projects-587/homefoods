import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import ProductCard from "@/components/product-card";
import ShopHero from "@/components/shop-hero";
import CategoryChips from "@/components/category-chips";
import { searchProducts } from "@/lib/catalog";
import { getCategories, getProducts, logSearch } from "@/lib/catalog.server";
import { SITE_DESCRIPTION } from "@/lib/site";

// Dynamic by virtue of reading searchParams (wrapped in <Suspense>); under
// Cache Components no route directive is needed or allowed.

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string }>;
}): Promise<Metadata> {
  const { q } = await searchParams;
  const term = q?.trim();
  if (term) {
    // Search results are thin/duplicate — index the products, not the queries.
    return {
      title: `Search: ${term}`,
      robots: { index: false, follow: true },
      alternates: { canonical: "/products" },
    };
  }
  return { title: "Shop", alternates: { canonical: "/products" } };
}

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string }>;
}) {
  const { q, category } = await searchParams;
  const term = q?.trim() || "";

  // Browsing a single category (no search term) is the exact page
  // /category/[slug] already renders — consolidate onto that one URL
  // instead of maintaining a second copy behind a query param.
  if (category && !term) redirect(`/category/${category}`);

  const [categories, products] = await Promise.all([
    getCategories(),
    term ? searchProducts(term, { categorySlug: category }) : getProducts(),
  ]);

  const activeCategory = term
    ? (categories.find((c) => c.slug === category) ?? null)
    : null;

  // Landing here with a committed query is the "search" event log_search
  // tracks — not every keystroke (those hit search_products directly from
  // search-bar.tsx without logging).
  if (term) logSearch(term, products.length);

  // While searching, chips stay on /products and scope the same query by
  // category (there's no search UI on /category/[slug]); otherwise they
  // send you to the real category/all-products pages.
  const hrefFor = (categorySlug?: string) => {
    if (!term) return categorySlug ? `/category/${categorySlug}` : "/products";
    const params = new URLSearchParams({ q: term });
    if (categorySlug) params.set("category", categorySlug);
    return `/products?${params.toString()}`;
  };

  return (
    <div className="mx-auto max-w-[1160px] px-4 py-8 sm:px-[22px] sm:py-10">
      {term ? (
        <>
          <h1 className="font-heading text-[30px]">
            Looking for &ldquo;<span className="text-accent-700">{term}</span>
            &rdquo;
          </h1>
          <p className="mt-1 text-[14px] text-neutral-600">
            {products.length} {products.length === 1 ? "item" : "items"} —
            typos welcome, we search generously
          </p>
        </>
      ) : (
        <>
          <ShopHero title="The whole kitchen" />
          <p className="mt-4 max-w-xl text-[14.5px] text-neutral-700">
            {SITE_DESCRIPTION}
          </p>
          <p className="mt-1 text-[14px] text-neutral-600">
            {products.length} {products.length === 1 ? "item" : "items"}
          </p>
        </>
      )}

      <CategoryChips
        categories={categories}
        activeSlug={term ? (activeCategory?.slug ?? null) : null}
        hrefFor={hrefFor}
      />

      {products.length === 0 ? (
        <div className="mt-12 rounded-lg bg-neutral-100 p-12 text-center">
          <p className="font-heading text-[24px]">
            Nothing on this shelf{term && ` for “${term}”`}.
          </p>
          <p className="mt-2 text-neutral-600">
            Try another spelling — or browse{" "}
            <Link href="/products" className="font-bold text-accent-700 underline">
              the whole kitchen
            </Link>
            .
          </p>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
          {products.map((p, i) => (
            <ProductCard key={p.id} product={p} priority={i < 4} />
          ))}
        </div>
      )}
    </div>
  );
}
