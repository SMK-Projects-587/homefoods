import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import BuyBox from "@/components/buy-box";
import CatalogImage from "@/components/catalog-image";
import ProductCard from "@/components/product-card";
import { getProductBySlug, getProducts } from "@/lib/catalog";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: "Product" };
  return {
    title: product.meta_title || product.name,
    description: product.meta_description || product.description,
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

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <nav className="label text-soft">
        <Link href="/" className="hover:text-chilli">
          Home
        </Link>{" "}
        /{" "}
        {product.category && (
          <>
            <Link
              href={`/category/${product.category.slug}`}
              className="hover:text-chilli"
            >
              {product.category.name}
            </Link>{" "}
            /{" "}
          </>
        )}
        <span className="text-ink">{product.name}</span>
      </nav>

      <div className="mt-6 grid gap-10 lg:grid-cols-2">
        {/* Gallery */}
        <div>
          <div className="overflow-hidden border-2 border-ink">
            <CatalogImage
              path={primaryImage?.image_path ?? null}
              alt={primaryImage?.alt_text || product.name}
              name={product.name}
              className="aspect-square w-full object-cover"
            />
          </div>
          {product.images.length > 1 && (
            <div className="mt-3 flex gap-3">
              {product.images.map((img) => (
                <div
                  key={img.id}
                  className="w-20 overflow-hidden border border-line"
                >
                  <CatalogImage
                    path={img.image_path}
                    alt={img.alt_text || product.name}
                    name={product.name}
                    className="aspect-square w-full object-cover"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Details */}
        <div>
          {product.category && (
            <p className="label text-chilli">{product.category.name}</p>
          )}
          <h1 className="mt-2 font-display text-5xl leading-tight">
            {product.name}
          </h1>
          {product.description && (
            <p className="mt-4 text-lg text-soft">{product.description}</p>
          )}

          <div className="mt-8">
            <BuyBox
              productId={product.id}
              productSlug={product.slug}
              productName={product.name}
              imagePath={primaryImage?.image_path ?? null}
              variants={product.variants}
            />
          </div>

          {product.keywords.length > 0 && (
            <div className="mt-6 flex flex-wrap gap-2">
              {product.keywords.map((k) => (
                <Link
                  key={k}
                  href={`/products?q=${encodeURIComponent(k)}`}
                  className="border border-line px-3 py-1 text-xs text-soft transition-colors hover:border-ink hover:text-ink"
                >
                  {k}
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-20 border-t-2 border-ink pt-10">
          <h2 className="font-display text-3xl">
            More from {product.category!.name}
          </h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
