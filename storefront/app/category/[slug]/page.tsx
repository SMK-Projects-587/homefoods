import { notFound } from "next/navigation";
import type { Metadata } from "next";
import ProductCard from "@/components/product-card";
import ShopHero from "@/components/shop-hero";
import CategoryChips from "@/components/category-chips";
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
      `${category.name} — traditional Andhra ${category.name.toLowerCase()} from Andhra Brahmin Home Own Manufacturing Food Items.`,
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

      <ShopHero
        title={category.name}
        nativeName={category.native_name}
        imagePath={category.image_path}
      />

      {category.description && (
        <p className="mt-4 max-w-xl text-[14.5px] text-neutral-700">
          {category.description}
        </p>
      )}
      <p className="mt-1 text-[14px] text-neutral-600">
        {products.length} {products.length === 1 ? "item" : "items"}
      </p>

      <CategoryChips
        categories={categories}
        activeSlug={slug}
        hrefFor={(categorySlug) =>
          categorySlug ? `/category/${categorySlug}` : "/products"
        }
      />

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
