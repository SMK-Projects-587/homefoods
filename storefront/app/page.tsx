import type { Metadata } from "next";
import Link from "next/link";
import CatalogImage from "@/components/catalog-image";
import ProductCard from "@/components/product-card";
import { getCategories, getProducts } from "@/lib/catalog.server";

// Data is cached per-fetch via `use cache` + cacheTag in lib/catalog.server,
// invalidated on catalog changes through /api/revalidate (Cache Components).

export const metadata: Metadata = {
  alternates: { canonical: "/" },
  openGraph: { url: "/" },
};

function TrustTile({
  bg,
  label,
  icon,
}: {
  bg: string;
  label: string;
  icon: React.ReactNode;
}) {
  return (
    <div
      className={`flex flex-col items-center gap-1.5 rounded-lg px-2.5 py-3.5 text-center ${bg}`}
    >
      {icon}
      <span className="text-[12px] font-bold">{label}</span>
    </div>
  );
}

export default async function HomePage() {
  const [categories, products] = await Promise.all([
    getCategories(),
    getProducts(),
  ]);
  const bestsellers = products.slice(0, 8);
  const collage = products.slice(0, 4);
  const countFor = (slug: string) =>
    products.filter((p) => p.categorySlug === slug).length;

  return (
    <div className="mx-auto max-w-[1160px] px-4 sm:px-[22px]">
      {/* Hero */}
      <section className="grid items-center gap-8 pb-6 pt-8 md:grid-cols-[1.05fr_1fr] md:gap-12 md:pb-12 md:pt-14">
        <div>
          <div className="flex animate-rise flex-wrap gap-2">
            <span className="rounded-full bg-sage-100 px-3 py-1 text-[12px] font-bold text-sage-800">
              100% Pure Veg
            </span>
            <span className="rounded-full bg-accent-100 px-3 py-1 text-[12px] font-bold text-accent-800">
              30+ years of taste
            </span>
          </div>
          <h1
            className="mt-4 animate-rise font-heading text-[40px] leading-[1.06] sm:text-[54px]"
            style={{ animationDelay: "70ms" }}
          >
            Amma&rsquo;s kitchen,
            <br />
            shipped to your door.
          </h1>
          <p
            className="telugu mt-3 animate-rise text-[17px] text-accent-700"
            style={{ animationDelay: "120ms" }}
          >
            పిండి వంటలు · పొడులు · ఊరగాయలు
          </p>
          <p
            className="mt-4 max-w-md animate-rise text-[15.5px] text-neutral-700"
            style={{ animationDelay: "170ms" }}
          >
            Traditional Brahmin home-style snacks, podis and pickles from
            Vizianagaram — hand-made in small batches, no preservatives, ever.
          </p>
          <div
            className="mt-6 flex animate-rise flex-wrap items-center gap-3"
            style={{ animationDelay: "230ms" }}
          >
            <Link
              href="/products"
              className="rounded-full bg-accent px-6 py-3.5 text-[15px] font-bold text-bg transition-colors hover:bg-accent-600 active:bg-accent-700"
            >
              Shop bestsellers
            </Link>
            <Link
              href="/about"
              className="rounded-full border border-line px-6 py-3.5 text-[15px] font-bold text-accent-700 transition-colors hover:bg-accent-100"
            >
              Our story
            </Link>
          </div>
        </div>

        {/* Hero collage — real product tiles, washed, so it feels alive even
            before photography lands. */}
        <div className="grid animate-rise grid-cols-2 gap-3 md:gap-4" style={{ animationDelay: "120ms" }}>
          {collage.map((p, i) => (
            <Link
              key={p.id}
              href={`/products/${p.slug}`}
              className={`overflow-hidden rounded-lg bg-surface shadow-sm ${
                i % 2 === 0 ? "md:mt-6" : ""
              }`}
            >
              <CatalogImage
                path={p.imagePath}
                alt={p.name}
                name={p.name}
                className="washed aspect-square w-full object-cover"
              />
            </Link>
          ))}
        </div>
      </section>

      {/* Trust strip */}
      <section className="grid grid-cols-3 gap-3 py-4">
        <TrustTile
          bg="bg-sage-100 text-sage-800"
          label="100% Pure Veg"
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="size-5">
              <path d="M11 20A7 7 0 0 1 4 13C4 8 8 4 13 4c3 0 7 1 7 1s-1 4-1 7a7 7 0 0 1-8 8Z" />
              <path d="M8 17c2-3 5-5 8-6" />
            </svg>
          }
        />
        <TrustTile
          bg="bg-accent-100 text-accent-800"
          label="30+ years of trust"
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="size-5">
              <circle cx="12" cy="12" r="8" />
              <path d="M12 8v4l3 2" />
            </svg>
          }
        />
        <TrustTile
          bg="bg-sage-200 text-sage-800"
          label="Ships all over India"
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="size-5">
              <path d="M4 12a8 8 0 0 1 16 0" />
              <path d="M7 12a5 5 0 0 1 10 0" />
              <circle cx="12" cy="12" r="1.4" />
            </svg>
          }
        />
      </section>

      {/* Shop by category */}
      <section className="py-8">
        <h2 className="font-heading text-[26px]">Shop by category</h2>
        <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
          {categories.map((c) => (
            <Link
              key={c.id}
              href={`/products?category=${c.slug}`}
              className="flex items-center gap-3 rounded-lg bg-neutral-100 p-4 transition-colors hover:bg-accent-100 active:bg-accent-200"
            >
              <span className="size-[54px] shrink-0 overflow-hidden rounded-full bg-surface">
                <CatalogImage
                  path={c.image_path || null}
                  alt={c.name}
                  name={c.name}
                  className="washed size-full object-cover"
                />
              </span>
              <span className="min-w-0">
                <span className="block truncate text-[15px] font-bold">
                  {c.name}
                </span>
                {c.native_name && (
                  <span className="telugu block truncate text-[12.5px] text-accent-700">
                    {c.native_name}
                  </span>
                )}
                <span className="block text-[12px] text-neutral-600">
                  {countFor(c.slug)} items
                </span>
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Bestsellers */}
      <section className="py-8">
        <div className="flex items-baseline justify-between">
          <h2 className="font-heading text-[26px]">Bestsellers</h2>
          <Link href="/products" className="text-[14px] font-bold text-accent-700 hover:underline">
            See all
          </Link>
        </div>
        {/* mobile: edge-bleed horizontal rail · desktop: 4-col grid */}
        <div className="no-scrollbar fade-edges-x -mx-4 mt-4 scroll-pl-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 sm:-mx-[22px] sm:px-[22px] md:mx-0 md:grid md:grid-cols-4 md:overflow-visible md:px-0 md:[mask-image:none]">
          {bestsellers.map((p) => (
            <div key={p.id} className="w-[168px] shrink-0 snap-start md:w-auto">
              <ProductCard product={p} />
            </div>
          ))}
        </div>
      </section>

      {/* About teaser */}
      <section className="mb-10 mt-2 rounded-lg bg-sage-100 px-5 py-6 sm:px-8">
        <h2 className="font-heading text-[24px] text-sage-900">
          Filling tummies with happiness since 1992.
        </h2>
        <p className="mt-2 max-w-2xl text-[14.5px] text-sage-800">
          What began in a small Vizianagaram kitchen is now amma&rsquo;s taste on
          thousands of plates across India. Same recipes, same hands, same love.
        </p>
        <Link
          href="/about"
          className="mt-4 inline-block rounded-full border border-sage-600/40 bg-neutral-100/60 px-5 py-3 text-[14px] font-bold text-sage-800 transition-colors hover:bg-neutral-100"
        >
          Read our story
        </Link>
      </section>
    </div>
  );
}
