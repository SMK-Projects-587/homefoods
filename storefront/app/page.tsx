import Link from "next/link";
import CatalogImage from "@/components/catalog-image";
import ProductCard from "@/components/product-card";
import SearchBar from "@/components/search-bar";
import VegMark from "@/components/veg-mark";
import { getCategories, getProducts } from "@/lib/catalog";

export const dynamic = "force-dynamic";

const TICKER = [
  "Avakaya",
  "Gongura",
  "Karam Podi",
  "Murukulu",
  "Kaju Katli",
  "Nimmakaya",
  "Kandi Podi",
  "Chekkalu",
  "Bandar Laddu",
];

export default async function HomePage() {
  const [categories, products] = await Promise.all([
    getCategories(),
    getProducts(),
  ]);
  const featured = products.slice(0, 8);
  const collage = products.slice(0, 3);

  return (
    <>
      {/* Hero */}
      <section className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-10 md:grid-cols-[3fr_2fr] md:py-20">
        <div>
          <p className="label animate-rise text-chilli">
            <span className="font-telugu text-sm normal-case tracking-normal">
              ఇంటి రుచి
            </span>{" "}
            · from our kitchen in Guntur
          </p>
          <h1
            className="mt-4 animate-rise font-display text-4xl leading-[1.05] sm:text-6xl lg:text-7xl"
            style={{ animationDelay: "80ms" }}
          >
            Pickles with a<br />
            <em className="text-chilli">temper</em>, podis
            <br />
            with a <em className="text-leaf">past</em>.
          </h1>
          <p
            className="mt-6 max-w-md animate-rise text-lg text-soft"
            style={{ animationDelay: "160ms" }}
          >
            Andhra pantry staples stirred, sun-cured and stone-ground in small
            batches — then packed into jars the day you order.
          </p>
          <div
            className="mt-8 hidden max-w-md animate-rise md:block"
            style={{ animationDelay: "220ms" }}
          >
            <SearchBar variant="hero" />
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="label text-soft">Popular:</span>
              {["Avakaya", "Karam podi", "Gongura", "Kaju katli"].map((t) => (
                <Link
                  key={t}
                  href={`/products?q=${encodeURIComponent(t)}`}
                  className="rounded-full border border-ink/30 px-3 py-1 text-xs font-bold transition-colors hover:border-chilli hover:text-chilli"
                >
                  {t}
                </Link>
              ))}
            </div>
          </div>
          <div
            className="mt-8 flex animate-rise flex-wrap items-center gap-4"
            style={{ animationDelay: "300ms" }}
          >
            <Link
              href="/products"
              className="label bg-chilli px-6 py-4 text-paper transition-colors hover:bg-chilli-deep"
            >
              Shop the pantry
            </Link>
            <Link
              href="/category/pickles"
              className="label border border-ink/30 px-6 py-4 transition-colors hover:bg-ink hover:text-paper"
            >
              Straight to pickles
            </Link>
          </div>
        </div>

        {/* jar collage */}
        <div className="relative hidden h-105 md:block" aria-hidden>
          {collage.map((p, i) => (
            <div
              key={p.id}
              className="absolute w-52 animate-rise border-2 border-ink bg-paper p-2 shadow-[8px_8px_0_0_var(--color-cream)]"
              style={{
                top: `${i * 18}%`,
                left: `${i * 22}%`,
                rotate: `${(i - 1) * 5}deg`,
                animationDelay: `${200 + i * 120}ms`,
              }}
            >
              <CatalogImage
                path={p.imagePath}
                alt=""
                name={p.name}
                className="aspect-square w-full object-cover"
              />
              <p className="label mt-2 truncate text-center">{p.name}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Ticker */}
      <div className="overflow-hidden border-y-2 border-ink bg-turmeric py-3">
        <div className="flex w-max animate-marquee gap-8">
          {[...TICKER, ...TICKER, ...TICKER, ...TICKER].map((word, i) => (
            <span key={i} className="label flex items-center gap-8 text-ink">
              {word} <span className="text-chilli">✳</span>
            </span>
          ))}
        </div>
      </div>

      {/* Trust strip */}
      <div className="border-b-2 border-ink bg-paper">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-8 gap-y-2 px-4 py-3">
          <span className="flex items-center gap-2">
            <VegMark />
            <span className="label">100% vegetarian</span>
          </span>
          <span className="label text-soft">No preservatives</span>
          <span className="label text-soft">Made to order</span>
          <span className="label text-soft">Ships across India</span>
        </div>
      </div>

      {/* Categories */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="flex items-baseline justify-between">
          <h2 className="font-display text-4xl">The shelves</h2>
          <Link href="/products" className="label text-chilli hover:underline">
            Everything →
          </Link>
        </div>
        <div className="no-scrollbar -mx-4 mt-8 grid snap-x snap-mandatory grid-flow-col auto-cols-[72%] gap-4 overflow-x-auto px-4 sm:mx-0 sm:grid-flow-row sm:auto-cols-auto sm:grid-cols-2 sm:overflow-visible sm:px-0 lg:grid-cols-4">
          {categories.map((c, i) => (
            <Link
              key={c.id}
              href={`/category/${c.slug}`}
              className="group snap-start border border-line bg-paper transition-all duration-300 hover:-translate-y-1 hover:border-ink/40 hover:shadow-[6px_6px_0_0_var(--color-cream)]"
            >
              <div className="aspect-4/3 overflow-hidden border-b border-line">
                <CatalogImage
                  path={c.image_path || null}
                  alt={c.name}
                  name={c.name}
                  className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>
              <div className="p-4">
                <h3 className="font-display text-2xl">
                  <span className="mr-2 text-sm text-soft">0{i + 1}</span>
                  {c.name}
                </h3>
                <p className="mt-1 line-clamp-2 text-sm text-soft">
                  {c.description}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured products */}
      <section className="mx-auto max-w-6xl px-4 pb-16">
        <div className="flex items-baseline justify-between">
          <h2 className="font-display text-4xl">The regulars</h2>
          <Link href="/products" className="label text-chilli hover:underline">
            Shop all →
          </Link>
        </div>
        <div className="mt-8 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {featured.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>

      {/* Story strip */}
      <section className="border-t-2 border-ink bg-cream">
        <blockquote className="mx-auto max-w-3xl px-4 py-16 text-center">
          <p className="font-display text-3xl italic leading-snug sm:text-4xl">
            &ldquo;No factories, no shortcuts. Just mustard, chilli, gingelly
            oil and the patience to let a jar sit in the sun.&rdquo;
          </p>
          <footer className="label mt-6 text-soft">
            <span className="font-telugu normal-case tracking-normal">
              ఇంటి రుచి
            </span>{" "}
            · The HomeFoods kitchen
          </footer>
        </blockquote>
      </section>
    </>
  );
}
