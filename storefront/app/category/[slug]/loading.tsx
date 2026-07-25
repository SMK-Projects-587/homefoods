import { Block, ChipsSkeleton, ProductGridSkeleton } from "@/components/skeletons";

// Fallback for /category/[slug]. Mirrors the back link, category title +
// native line, chip row, and product grid.
export default function Loading() {
  return (
    <div className="mx-auto max-w-[1160px] px-4 py-8 sm:px-[22px] sm:py-10">
      <Block className="h-[18px] w-28" />
      <Block className="mt-3 h-[30px] w-52" />
      <Block className="mt-1.5 h-[14px] w-24" />
      <ChipsSkeleton />
      <ProductGridSkeleton className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4" />
    </div>
  );
}
