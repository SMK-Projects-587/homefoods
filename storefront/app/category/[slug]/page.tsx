import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import ProductCard from "@/components/product-card";
import JsonLd from "@/components/json-ld";
import { getCategories, getCategoryBySlug, getProducts } from "@/lib/catalog.server";
import { absoluteUrl } from "@/lib/site";

// Data is cached per-fetch via `use cache` + cacheTag in lib/catalog.server.

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);
  if (!category) return { title: "Category" };
  const path = `/category/${category.slug}`;
  return {
    title: category.name,
    description:
      category.description ||
      `${category.name} — traditional Andhra ${category.name.toLowerCase()} from Andhra HomeFoods.`,
    alternates: { canonical: path },
    openGraph: { title: category.name, description: category.description, url: path },
  };
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [category, categories] = await Promise.all([
    getCategoryBySlug(slug),
    getCategories(),
  ]);
  if (!category) notFound();

  const products = await getProducts({ categorySlug: slug });
  const others = categories.filter((c) => c.slug !== slug);

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: absoluteUrl("/") },
      { "@type": "ListItem", position: 2, name: "Shop", item: absoluteUrl("/products") },
      {
        "@type": "ListItem",
        position: 3,
        name: category.name,
        item: absoluteUrl(`/category/${category.slug}`),
      },
    ],
  };

  const itemListJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: products.map((p, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: absoluteUrl(`/products/${p.slug}`),
      name: p.name,
    })),
  };

  return (
    <div className="mx-auto max-w-[1160px] px-4 py-8 sm:px-[22px] sm:py-10">
      <JsonLd data={breadcrumbJsonLd} />
      <JsonLd data={itemListJsonLd} />
      <Link
        href="/products"
        className="inline-flex items-center gap-1.5 text-[14px] font-bold text-accent-700 hover:underline"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="size-4">
          <path d="M19 12H5M11 6l-6 6 6 6" />
        </svg>
        Back to shop
      </Link>
      <h1 className="mt-3 font-heading text-[30px]">{category.name}</h1>
      {category.native_name && (
        <p className="telugu mt-1 text-[14px] text-accent-700">
          {category.native_name}
        </p>
      )}
      {category.description && (
        <p className="mt-2 max-w-xl text-[14.5px] text-neutral-700">
          {category.description}
        </p>
      )}

      {/* Category chips for quick hopping between shelves */}
      <div className="no-scrollbar fade-edges-x -mx-4 mt-5 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
        <Link
          href="/products"
          className="shrink-0 rounded-full border border-neutral-300 bg-neutral-100 px-4 py-2 text-[13.5px] font-bold text-neutral-700 transition-colors hover:border-accent hover:text-accent-700"
        >
          All
        </Link>
        <span className="shrink-0 rounded-full border border-accent bg-accent px-4 py-2 text-[13.5px] font-bold text-bg">
          {category.name}
        </span>
        {others.map((c) => (
          <Link
            key={c.id}
            href={`/category/${c.slug}`}
            className="shrink-0 rounded-full border border-neutral-300 bg-neutral-100 px-4 py-2 text-[13.5px] font-bold text-neutral-700 transition-colors hover:border-accent hover:text-accent-700"
          >
            {c.name}
          </Link>
        ))}
      </div>

      {products.length === 0 ? (
        <div className="mt-12 rounded-lg bg-neutral-100 p-12 text-center">
          <p className="font-heading text-[24px]">This shelf is being restocked.</p>
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
