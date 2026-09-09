import type { Metadata } from "next";
import Link from "next/link";
import CatalogImage from "@/components/catalog-image";
import ProductCard from "@/components/product-card";
import { getCategories, getProducts } from "@/lib/catalog.server";
import { cdnImageUrl } from "@/lib/supabase";

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
  const countFor = (slug: string) =>
    products.filter((p) => p.categorySlug === slug).length;

  return (
    <div className="mx-auto max-w-[1160px] px-4 sm:px-[22px]">
      {/* Hero — real kitchen-counter photography, shot with a wall of
          negative space on the left built in for exactly this: the copy
          sits directly on the photo instead of beside it. Same crop-free
          aspect-ratio trick as the about-us banner (mobile 2:3 portrait,
          desktop 2:1 landscape) so nothing gets awkwardly cut off. */}
      <section
        className="relative -mx-4 min-h-dvh max-h-[640px] overflow-hidden rounded-none sm:-mx-[22px] md:mx-0 md:mt-8 md:min-h-0 md:max-h-none md:rounded-[28px]"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={cdnImageUrl("homepage-landing-mobile.png", { width: 860 })}
          alt="A freshly opened jar of avakaya pickle, chilli and turmeric powders, and garlic on a sunlit kitchen counter"
          loading="eager"
          fetchPriority="high"
          className="absolute inset-0 h-full w-full object-cover md:hidden"
        />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={cdnImageUrl("homepage-landing.webp", { width: 1600 })}
          alt="A freshly opened jar of avakaya pickle, chilli and turmeric powders, and garlic on a sunlit kitchen counter"
          loading="eager"
          fetchPriority="high"
          className="hidden w-full object-cover md:block"
          style={{ aspectRatio: "2 / 1", maxHeight: "620px" }}
        />
        {/* Cream scrim, same tone as the wall in the photo, fading toward
            the product side so the copy reads as part of the shot. */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-bg via-bg/75 to-transparent md:via-bg/55" />

        <div className="absolute inset-0 flex flex-col justify-start px-4 pt-5 pb-6 sm:px-[22px] md:justify-center md:max-w-[54%] md:py-0 lg:max-w-[48%]">
          <div className="flex animate-rise flex-wrap gap-2">
            <span className="rounded-full bg-sage-100 px-3 py-1 text-[12px] font-bold text-sage-800">
              100% Pure Veg
            </span>
            <span className="rounded-full bg-accent-100 px-3 py-1 text-[12px] font-bold text-accent-800">
              30+ years of taste
            </span>
          </div>
          <h1
            className="mt-4 animate-rise font-heading text-[38px] leading-[1.06] sm:text-[46px] md:text-[52px]"
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
              href="#bestsellers"
              className="rounded-full bg-accent px-6 py-3.5 text-[15px] font-bold text-bg transition-colors hover:bg-accent-600 active:bg-accent-700"
            >
              Shop bestsellers
            </Link>
            <Link
              href="/about"
              className="rounded-full border border-line bg-bg/70 px-6 py-3.5 text-[15px] font-bold text-accent-700 backdrop-blur-sm transition-colors hover:bg-accent-100"
            >
              Our story
            </Link>
          </div>
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

      {/* Shop by category — full-photo tiles (same source image as the
          category page's own hero banner) instead of a small circle avatar,
          so the shelf actually looks like what's on it. */}
      <section className="py-8">
        <h2 className="font-heading text-[26px]">Shop by category</h2>
        <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
          {categories.map((c) => (
            <Link
              key={c.id}
              href={`/category/${c.slug}`}
              className="group relative block aspect-[4/5] overflow-hidden rounded-2xl bg-surface"
            >
              <CatalogImage
                path={c.image_path || null}
                alt={c.name}
                name={c.name}
                preset="card"
                className="washed size-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/10 to-transparent" />
              <span className="absolute inset-x-0 bottom-0 p-3">
                <span className="block truncate font-heading text-[17px] text-bg">
                  {c.name}
                </span>
                {c.native_name && (
                  <span className="telugu block truncate text-[12px] text-accent-200">
                    {c.native_name}
                  </span>
                )}
                <span className="block text-[11.5px] text-bg/75">
                  {countFor(c.slug)} items
                </span>
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Bestsellers */}
      <section className="py-8 scroll-mt-20" id="bestsellers">
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
