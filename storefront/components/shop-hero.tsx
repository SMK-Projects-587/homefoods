import CatalogImage from "@/components/catalog-image";
import { cdnImageUrl } from "@/lib/supabase";

// The photo banner both browse pages share. A specific category passes its
// own `imagePath`; the "whole kitchen" (all-products) view has no single
// category photo to show, so it falls back to the same kitchen-counter shot
// used on the homepage hero — same crop-free 2:1 desktop / 2:3 mobile trick.
export default function ShopHero({
  title,
  nativeName,
  imagePath,
}: {
  title: string;
  nativeName?: string | null;
  imagePath?: string | null;
}) {
  return (
    <div className="relative h-[200px] overflow-hidden rounded-3xl bg-surface sm:h-[260px] md:h-[320px]">
      {imagePath !== undefined ? (
        <CatalogImage
          path={imagePath}
          alt={title}
          name={title}
          preset="gallery"
          priority
          className="washed size-full object-cover"
        />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={cdnImageUrl("homepage-landing.webp", { width: 1200 })}
          alt="A freshly opened jar of avakaya pickle, chilli and turmeric powders, and garlic on a sunlit kitchen counter"
          loading="eager"
          fetchPriority="high"
          className="size-full object-cover"
        />
      )}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/10 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 p-4 sm:p-6">
        <h1 className="font-heading text-[28px] text-bg sm:text-[36px]">
          {title}
        </h1>
        {nativeName && (
          <p className="telugu mt-0.5 text-[14px] text-accent-200">
            {nativeName}
          </p>
        )}
      </div>
    </div>
  );
}
