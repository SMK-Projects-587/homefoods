import Link from "next/link";
import type { Metadata } from "next";
import ProductCard from "@/components/product-card";
import SearchBar from "@/components/search-bar";
import { getCategories, getProducts, searchProducts } from "@/lib/catalog";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Shop all" };

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

  const chip = (active: boolean) =>
    `label shrink-0 border px-4 py-2 transition-colors ${
      active
        ? "border-ink bg-ink text-paper"
        : "border-ink/30 hover:border-ink"
    }`;

  const withParams = (categorySlug?: string) => {
    const params = new URLSearchParams();
    if (term) params.set("q", term);
    if (categorySlug) params.set("category", categorySlug);
    const qs = params.toString();
    return qs ? `/products?${qs}` : "/products";
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <p className="label text-chilli">The pantry</p>
      <h1 className="mt-2 font-display text-4xl sm:text-5xl">
        {term ? (
          <>
            Looking for <em className="text-chilli">&ldquo;{term}&rdquo;</em>
          </>
        ) : activeCategory ? (
          activeCategory.name
        ) : (
          "Everything we make"
        )}
      </h1>
      <p className="mt-2 text-soft">
        {products.length} {products.length === 1 ? "product" : "products"}
        {term && " — typos welcome, we search generously"}
      </p>

      <div className="mt-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
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
        <SearchBar defaultValue={term} className="hidden md:block md:w-72" />
      </div>

      {products.length === 0 ? (
        <div className="mt-16 border border-line bg-cream p-12 text-center">
          <p className="font-display text-3xl italic">
            Nothing on this shelf{term && ` for “${term}”`}.
          </p>
          <p className="mt-2 text-soft">
            Try another spelling — or browse{" "}
            <Link href="/products" className="text-chilli underline">
              everything we make
            </Link>
            .
          </p>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}
