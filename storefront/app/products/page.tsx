import Link from "next/link";
import type { Metadata } from "next";
import ProductCard from "@/components/product-card";
import { searchProducts } from "@/lib/catalog";
import { getCategories, getProducts, logSearch } from "@/lib/catalog.server";

// Dynamic by virtue of reading searchParams (wrapped in <Suspense>); under
// Cache Components no route directive is needed or allowed.

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string }>;
}): Promise<Metadata> {
  const { q, category } = await searchParams;
  const term = q?.trim();
  if (term) {
    // Search results are thin/duplicate — index the products, not the queries.
    return {
      title: `Search: ${term}`,
      robots: { index: false, follow: true },
      alternates: { canonical: "/products" },
    };
  }
  if (category) {
    // A filtered shop view duplicates the dedicated category page — point the
    // canonical there so link equity consolidates on one URL.
    return {
      title: "Shop",
      alternates: { canonical: `/category/${category}` },
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

  const [categories, products] = await Promise.all([
    getCategories(),
    term
      ? searchProducts(term, { categorySlug: category })
      : getProducts({ categorySlug: category }),
  ]);

  const activeCategory = categories.find((c) => c.slug === category) ?? null;

  // Landing here with a committed query is the "search" event log_search
  // tracks — not every keystroke (those hit search_products directly from
  // search-bar.tsx without logging).
  if (term) logSearch(term, products.length);

  const chip = (active: boolean) =>
    `shrink-0 rounded-full border px-4 py-2 text-[13.5px] font-bold transition-colors ${
      active
        ? "border-accent bg-accent text-bg"
        : "border-neutral-300 bg-neutral-100 text-neutral-700 hover:border-accent hover:text-accent-700"
    }`;

  const withParams = (categorySlug?: string) => {
    const params = new URLSearchParams();
    if (term) params.set("q", term);
    if (categorySlug) params.set("category", categorySlug);
    const qs = params.toString();
    return qs ? `/products?${qs}` : "/products";
  };

  return (
    <div className="mx-auto max-w-[1160px] px-4 py-8 sm:px-[22px] sm:py-10">
      <h1 className="font-heading text-[30px]">
        {term ? (
          <>
            Looking for &ldquo;<span className="text-accent-700">{term}</span>
            &rdquo;
          </>
        ) : activeCategory ? (
          activeCategory.name
        ) : (
          "The whole kitchen"
        )}
      </h1>
      {!term && activeCategory?.native_name ? (
        <p className="telugu mt-1 text-[14px] text-accent-700">
          {activeCategory.native_name}
        </p>
      ) : (
        <p className="mt-1 text-[14px] text-neutral-600">
          {products.length} {products.length === 1 ? "item" : "items"}
          {term && " — typos welcome, we search generously"}
        </p>
      )}

      <div className="no-scrollbar -mx-4 mt-5 flex gap-2 overflow-x-auto px-4 py-1 sm:mx-0 sm:px-0">
        <Link href={withParams()} className={chip(!category)}>
          All
        </Link>
        {categories.map((c) => (
          <Link
            key={c.id}
            href={withParams(c.slug)}
            className={chip(category === c.slug)}
          >
            {c.name}
          </Link>
        ))}
      </div>

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
