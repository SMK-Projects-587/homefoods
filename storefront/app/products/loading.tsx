import { Block, ChipsSkeleton, HeroSkeleton, ProductGridSkeleton } from "@/components/skeletons";

// Fallback for /products (force-dynamic — always server-rendered). Mirrors
// the browse-all view (the common case reached from nav links): hero, chips,
// count line, and 4-up product grid.
export default function Loading() {
  return (
    <div className="mx-auto max-w-[1160px] px-4 py-8 sm:px-[22px] sm:py-10">
      <HeroSkeleton />
      <ChipsSkeleton />
      <Block className="mt-4 h-[14px] w-24" />
      <ProductGridSkeleton className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4" />
    </div>
  );
}
