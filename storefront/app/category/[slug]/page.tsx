import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import ProductCard from "@/components/product-card";
import { getCategories, getCategoryBySlug, getProducts } from "@/lib/catalog";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);
  return {
    title: category?.name ?? "Category",
    description: category?.description,
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

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <nav className="label text-soft">
        <Link href="/" className="hover:text-chilli">
          Home
        </Link>{" "}
        / <span className="text-ink">{category.name}</span>
      </nav>
      <div className="mt-4 border-b-2 border-ink pb-8">
        <h1 className="font-display text-4xl sm:text-6xl">{category.name}</h1>
        {category.description && (
          <p className="mt-3 max-w-xl text-lg text-soft">
            {category.description}
          </p>
        )}
        <p className="label mt-4 text-chilli">
          {products.length} {products.length === 1 ? "product" : "products"}
        </p>
      </div>

      {products.length === 0 ? (
        <div className="mt-12 border border-line bg-cream p-12 text-center">
          <p className="font-display text-3xl italic">
            This shelf is being restocked.
          </p>
        </div>
      ) : (
        <div className="mt-10 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}

      {others.length > 0 && (
        <div className="mt-16 flex flex-wrap items-center gap-3 border-t border-line pt-8">
          <span className="label text-soft">Also on the shelves:</span>
          {others.map((c) => (
            <Link
              key={c.id}
              href={`/category/${c.slug}`}
              className="label border border-ink/30 px-4 py-2 transition-colors hover:bg-ink hover:text-paper"
            >
              {c.name}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
