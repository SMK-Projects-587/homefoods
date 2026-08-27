// Loading skeletons used by the route-level loading.tsx files. Pure
// presentational server components (no hooks, no client boundary) — they mirror
// the real layouts in product-card.tsx and the shop/category/product pages so
// the fallback lines up with the content that streams in behind it.

export function Block({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded bg-neutral-200 ${className}`} />;
}

// Mirrors components/product-card.tsx: square image, title + native line, then
// a price / add-button row pinned to the bottom.
export function ProductCardSkeleton() {
  return (
    <div className="flex flex-col">
      <div className="aspect-square animate-pulse rounded-2xl bg-neutral-200" />
      <div className="pt-2.5">
        <Block className="h-[15px] w-4/5" />
        <Block className="mt-1.5 h-[12px] w-2/5" />
      </div>
      <div className="mt-auto flex items-center justify-between pt-1.5">
        <Block className="h-[14px] w-14" />
        <div className="size-[34px] animate-pulse rounded-full bg-neutral-200" />
      </div>
    </div>
  );
}

export function ProductGridSkeleton({
  count = 8,
  className = "grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4",
}: {
  count?: number;
  className?: string;
}) {
  return (
    <div className={className}>
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}

// The horizontally-scrolling category chip row on the shop / category pages.
export function ChipsSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="no-scrollbar fade-edges-x -mx-4 mt-5 flex gap-2 overflow-hidden px-4 sm:mx-0 sm:px-0">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="h-[38px] w-20 shrink-0 animate-pulse rounded-full bg-neutral-200"
        />
      ))}
    </div>
  );
}
