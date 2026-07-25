import { Block, ProductGridSkeleton } from "@/components/skeletons";

// Fallback for /search (force-dynamic). Narrow column: heading, search input,
// and the bestsellers grid (3-up on sm).
export default function Loading() {
  return (
    <div className="mx-auto max-w-[720px] px-4 py-8 sm:px-[22px] sm:py-10">
      <Block className="h-[30px] w-40" />
      <div className="mt-4 h-[46px] w-full animate-pulse rounded-full bg-neutral-200" />
      <Block className="mt-8 h-[12px] w-24" />
      <ProductGridSkeleton
        count={6}
        className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3"
      />
    </div>
  );
}
