import { Block } from "@/components/skeletons";

// Fallback for /products/[slug]. Mirrors the two-column detail layout: sticky
// gallery (main image + thumbnails) on the left, details + buy box on the right.
export default function Loading() {
  return (
    <div className="mx-auto max-w-[1160px] px-4 pb-44 pt-6 sm:px-[22px] lg:pb-16 lg:pt-8">
      <Block className="h-[18px] w-32" />

      <div className="mt-4 grid gap-8 lg:grid-cols-[440px_1fr] lg:gap-12">
        {/* Gallery */}
        <div>
          <div className="aspect-square w-full animate-pulse rounded-lg bg-neutral-200" />
          <div className="mt-3 flex gap-3">
            {Array.from({ length: 2 }).map((_, i) => (
              <div
                key={i}
                className="size-20 animate-pulse rounded-md bg-neutral-200"
              />
            ))}
          </div>
        </div>

        {/* Details */}
        <div>
          <div className="flex gap-2">
            <div className="h-[26px] w-24 animate-pulse rounded-full bg-neutral-200" />
            <div className="h-[26px] w-32 animate-pulse rounded-full bg-neutral-200" />
          </div>
          <Block className="mt-3 h-[32px] w-3/4" />
          <Block className="mt-2 h-[16px] w-32" />
          <Block className="mt-3 h-[14px] w-full" />
          <Block className="mt-1.5 h-[14px] w-5/6" />

          {/* Buy box: size chips + add-to-basket */}
          <div className="mt-6 space-y-3">
            <div className="flex gap-2">
              <div className="h-[42px] w-24 animate-pulse rounded-lg bg-neutral-200" />
              <div className="h-[42px] w-24 animate-pulse rounded-lg bg-neutral-200" />
            </div>
            <div className="h-[52px] w-full animate-pulse rounded-full bg-neutral-200" />
          </div>

          <div className="mt-6 h-[92px] w-full animate-pulse rounded-lg bg-neutral-200" />
        </div>
      </div>
    </div>
  );
}
