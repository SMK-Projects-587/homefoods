import type { Metadata } from "next";
import ProductCard from "@/components/product-card";
import SearchBar from "@/components/search-bar";
import { getProducts } from "@/lib/catalog.server";

// Utility screen — keep it out of the index (desktop uses the overlay anyway).
export const metadata: Metadata = {
  title: "Search",
  robots: { index: false, follow: true },
  alternates: { canonical: "/search" },
};

export default async function SearchPage() {
  const bestsellers = (await getProducts()).slice(0, 6);

  return (
    <div className="mx-auto max-w-[720px] px-4 py-8 sm:px-[22px] sm:py-10">
      <h1 className="font-heading text-[30px]">Search</h1>
      <div className="mt-4">
        <SearchBar autoFocus />
      </div>
      <p className="label mt-8 text-neutral-500">Bestsellers</p>
      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {bestsellers.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </div>
  );
}
