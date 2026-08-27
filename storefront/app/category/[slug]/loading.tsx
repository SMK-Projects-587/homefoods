import { Block, ChipsSkeleton, ProductGridSkeleton } from "@/components/skeletons";

// Fallback for /category/[slug]. Mirrors the hero banner, item count, chip
// row, and product grid.
export default function Loading() {
  return (
    <div className="mx-auto max-w-[1160px] px-4 py-8 sm:px-[22px] sm:py-10">
      <div className="h-[200px] animate-pulse rounded-3xl bg-neutral-200 sm:h-[260px] md:h-[320px]" />
      <Block className="mt-4 h-[14px] w-24" />
      <ChipsSkeleton />
      <ProductGridSkeleton className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4" />
    </div>
  );
}
