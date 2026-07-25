import { Block, ChipsSkeleton, ProductGridSkeleton } from "@/components/skeletons";

// Fallback for /products (force-dynamic — always server-rendered). Mirrors the
// heading + native/count line, category chips, and 4-up product grid.
export default function Loading() {
  return (
    <div className="mx-auto max-w-[1160px] px-4 py-8 sm:px-[22px] sm:py-10">
      <Block className="h-[30px] w-64" />
      <Block className="mt-2 h-[14px] w-28" />
      <ChipsSkeleton />
      <ProductGridSkeleton className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4" />
    </div>
  );
}
