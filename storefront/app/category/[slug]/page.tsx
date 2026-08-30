import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import CatalogImage from "@/components/catalog-image";
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

      {/* Hero banner — the category's own photo, not a chip row, is what
          should draw the eye landing here. Back link floats over the image
          instead of taking a line of its own above it. */}
      <div className="relative h-[200px] overflow-hidden rounded-3xl bg-surface sm:h-[260px] md:h-[320px]">
        <CatalogImage
          path={category.image_path || null}
          alt={category.name}
          name={category.name}
          priority
          className="washed size-full object-cover"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/10 to-transparent" />
        <Link
          href="/products"
          className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-bg/90 px-3 py-1.5 text-[13px] font-bold text-ink backdrop-blur-sm transition-colors hover:bg-bg"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="size-4">
            <path d="M19 12H5M11 6l-6 6 6 6" />
          </svg>
          Shop
        </Link>
        <div className="absolute inset-x-0 bottom-0 p-4 sm:p-6">
          <h1 className="font-heading text-[28px] text-bg sm:text-[36px]">
            {category.name}
          </h1>
          {category.native_name && (
            <p className="telugu mt-0.5 text-[14px] text-accent-200">
              {category.native_name}
            </p>
          )}
        </div>
      </div>

      {category.description && (
        <p className="mt-4 max-w-xl text-[14.5px] text-neutral-700">
          {category.description}
        </p>
      )}
      <p className="mt-1 text-[14px] text-neutral-600">
        {products.length} {products.length === 1 ? "item" : "items"}
      </p>

      {/* Other shelves — a lighter-weight hop than the hero, not styled to
          compete with it. */}
      {others.length > 0 && (
        <div className="no-scrollbar -mx-4 mt-5 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
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
      )}

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
