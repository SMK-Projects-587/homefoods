import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import BuyBox from "@/components/buy-box";
import CatalogImage from "@/components/catalog-image";
import ProductCard from "@/components/product-card";
import JsonLd from "@/components/json-ld";
import { getProductBySlug, getProducts } from "@/lib/catalog";
import { productImageUrl } from "@/lib/supabase";
import { SITE_NAME, absoluteUrl } from "@/lib/site";

// ISR: product pages re-render at most every 10 minutes.
export const revalidate = 600;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: "Product" };
  const path = `/products/${product.slug}`;
  const description = product.meta_description || product.description;
  const image = product.images[0]?.image_path
    ? productImageUrl(product.images[0].image_path)
    : undefined;
  return {
    title: product.meta_title || product.name,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: "website",
      title: product.meta_title || product.name,
      description,
      url: path,
      ...(image ? { images: [{ url: image, alt: product.name }] } : {}),
    },
    ...(image ? { twitter: { card: "summary_large_image", images: [image] } } : {}),
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const primaryImage = product.images[0] ?? null;
  const related = product.category
    ? (await getProducts({ categorySlug: product.category.slug }))
        .filter((p) => p.id !== product.id)
        .slice(0, 4)
    : [];

  // ── Structured data ────────────────────────────────────────────────────
  const prices = product.variants.map((v) => v.price);
  const inStock = product.variants.some((v) => v.in_stock);
  const availability = inStock
    ? "https://schema.org/InStock"
    : "https://schema.org/OutOfStock";
  const images = product.images
    .filter((img) => img.image_path)
    .map((img) => productImageUrl(img.image_path));
  const productUrl = absoluteUrl(`/products/${product.slug}`);

  const productJsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.meta_description || product.description,
    ...(images.length ? { image: images } : {}),
    sku: product.variants[0]?.sku,
    brand: { "@type": "Brand", name: SITE_NAME },
    ...(product.category ? { category: product.category.name } : {}),
    offers:
      product.variants.length > 1
        ? {
            "@type": "AggregateOffer",
            priceCurrency: "INR",
            lowPrice: Math.min(...prices),
            highPrice: Math.max(...prices),
            offerCount: product.variants.length,
            availability,
            url: productUrl,
          }
        : {
            "@type": "Offer",
            priceCurrency: "INR",
            price: prices[0],
            availability,
            url: productUrl,
          },
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: absoluteUrl("/") },
      ...(product.category
        ? [
            {
              "@type": "ListItem",
              position: 2,
              name: product.category.name,
              item: absoluteUrl(`/category/${product.category.slug}`),
            },
          ]
        : []),
      {
        "@type": "ListItem",
        position: product.category ? 3 : 2,
        name: product.name,
        item: productUrl,
      },
    ],
  };

  return (
    // extra bottom padding on mobile clears the sticky add bar + tab bar
    <div className="mx-auto max-w-[1160px] px-4 pb-44 pt-6 sm:px-[22px] lg:pb-16 lg:pt-8">
      <JsonLd data={productJsonLd} />
      <JsonLd data={breadcrumbJsonLd} />
      <Link
        href={product.category ? `/category/${product.category.slug}` : "/products"}
        className="inline-flex items-center gap-1.5 text-[14px] font-bold text-accent-700 hover:underline"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="size-4">
          <path d="M19 12H5M11 6l-6 6 6 6" />
        </svg>
        {product.category ? `Back to ${product.category.name}` : "Back to shop"}
      </Link>

      <div className="mt-4 grid gap-8 lg:grid-cols-[440px_1fr] lg:gap-12">
        {/* Gallery */}
        <div className="lg:sticky lg:top-[90px] lg:self-start">
          <div className="overflow-hidden rounded-lg bg-surface">
            <CatalogImage
              path={primaryImage?.image_path ?? null}
              alt={primaryImage?.alt_text || product.name}
              name={product.name}
              className="washed aspect-square w-full object-cover"
            />
          </div>
          {product.images.length > 1 && (
            <div className="mt-3 flex gap-3">
              {product.images.map((img) => (
                <div
                  key={img.id}
                  className="w-20 overflow-hidden rounded-md bg-surface"
                >
                  <CatalogImage
                    path={img.image_path}
                    alt={img.alt_text || product.name}
                    name={product.name}
                    className="washed aspect-square w-full object-cover"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Details */}
        <div>
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full bg-sage-100 px-3 py-1 text-[12px] font-bold text-sage-800">
              Pure Veg
            </span>
            <span className="rounded-full bg-accent-100 px-3 py-1 text-[12px] font-bold text-accent-800">
              No preservatives
            </span>
          </div>
          <h1 className="mt-3 font-heading text-[32px] leading-tight">
            {product.name}
          </h1>
          {product.native_name && (
            <p className="telugu mt-1 text-[16px] text-accent-700">
              {product.native_name}
            </p>
          )}
          {product.description && (
            <p className="mt-3 text-[15px] text-neutral-700">
              {product.description}
            </p>
          )}

          <div className="mt-6">
            <BuyBox
              productId={product.id}
              productSlug={product.slug}
              productName={product.name}
              imagePath={primaryImage?.image_path ?? null}
              variants={product.variants}
            />
          </div>

          {/* Good to know */}
          <div className="mt-6 rounded-lg bg-neutral-100 p-4">
            <p className="text-[13px] font-bold">Good to know</p>
            <p className="mt-1 text-[14px] text-neutral-700">
              Made fresh to order in our Vizianagaram kitchen. No preservatives —
              best enjoyed within 3–4 weeks. Ships across India in 2–5 days.
            </p>
          </div>

          {product.keywords.length > 0 && (
            <div className="mt-5 flex flex-wrap gap-2">
              {product.keywords.map((k) => (
                <Link
                  key={k}
                  href={`/products?q=${encodeURIComponent(k)}`}
                  className="rounded-full border border-neutral-300 px-3 py-1 text-xs text-neutral-600 transition-colors hover:border-accent hover:text-accent-700"
                >
                  {k}
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-16">
          <h2 className="font-heading text-[26px]">
            More from {product.category!.name}
          </h2>
          <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
