import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import BuyBox from "@/components/buy-box";
import ProductGallery from "@/components/product-gallery";
import ProductCard from "@/components/product-card";
import JsonLd from "@/components/json-ld";
import { getProductBySlug, getProducts } from "@/lib/catalog.server";
import { productImageUrl } from "@/lib/supabase";
import { SITE_NAME, absoluteUrl } from "@/lib/site";

// Data is cached per-fetch via `use cache` + cacheTag in lib/catalog.server.

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
    ? productImageUrl(product.images[0].image_path, "zoom")
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
    <div className="mx-auto max-w-[1160px] px-4 pb-10 pt-6 sm:px-[22px] lg:pb-16 lg:pt-8">
      <JsonLd data={productJsonLd} />
      <JsonLd data={breadcrumbJsonLd} />
      {/* Breadcrumb — desktop only. On mobile it was one more thing sitting
          above the fold before the product itself. */}
      <Link
        href={product.category ? `/category/${product.category.slug}` : "/products"}
        className="hidden items-center gap-1.5 text-[14px] font-bold text-accent-700 hover:underline lg:inline-flex"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="size-4">
          <path d="M19 12H5M11 6l-6 6 6 6" />
        </svg>
        {product.category ? `Back to ${product.category.name}` : "Back to shop"}
      </Link>

      <div className="grid gap-8 lg:mt-4 lg:grid-cols-[440px_1fr] lg:gap-12">
        {/* Gallery */}
        <div className="lg:sticky lg:top-[90px] lg:self-start">
          <ProductGallery images={product.images} productName={product.name} />
        </div>

        {/* Details */}
        <div>
          <h1 className="mt-3 font-heading text-[22px] leading-tight lg:mt-0 lg:text-[32px]">
            {product.name}
          </h1>
          {product.native_name && (
            <p className="telugu mt-1 text-[13px] text-accent-700 lg:text-[16px]">
              {product.native_name}
            </p>
          )}

          {/* Pack size + price/add-to-cart row, right under the title. */}
          <div className="mt-4">
            <BuyBox
              productId={product.id}
              productSlug={product.slug}
              productName={product.name}
              imagePath={primaryImage?.image_path ?? null}
              variants={product.variants}
            />
          </div>

          {product.description && (
            <p className="mt-5 text-[15px] text-neutral-700">
              {product.description}
            </p>
          )}

          {/* Good to know */}
          <div className="mt-6 rounded-lg bg-neutral-100 p-4">
            <p className="text-[13px] font-bold">Good to know</p>
            <p className="mt-1 text-[14px] text-neutral-700">
              Made fresh to order in our Vizianagaram kitchen. No preservatives —
              best enjoyed within 3–4 weeks. Ships across India in 2–5 days.
            </p>
          </div>
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
