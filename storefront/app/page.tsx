import Link from "next/link";
import CatalogImage from "@/components/catalog-image";
import ProductCard from "@/components/product-card";
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
      <section className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-14 md:grid-cols-[3fr_2fr] md:py-20">
        <div>
          <p className="label animate-rise text-chilli">
            From our kitchen in Guntur
          </p>
          <h1
            className="mt-4 animate-rise font-display text-5xl leading-[1.05] sm:text-6xl lg:text-7xl"
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
            className="mt-8 flex animate-rise flex-wrap items-center gap-4"
            style={{ animationDelay: "240ms" }}
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

      {/* Categories */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="flex items-baseline justify-between">
          <h2 className="font-display text-4xl">The shelves</h2>
          <Link href="/products" className="label text-chilli hover:underline">
            Everything →
          </Link>
        </div>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {categories.map((c, i) => (
            <Link
              key={c.id}
              href={`/category/${c.slug}`}
              className="group border border-line bg-paper transition-all duration-300 hover:-translate-y-1 hover:border-ink/40 hover:shadow-[6px_6px_0_0_var(--color-cream)]"
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
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
            The HomeFoods kitchen
          </footer>
        </blockquote>
      </section>
    </>
  );
}
