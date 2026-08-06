"use client";

import { useRef, useState } from "react";
import CatalogImage from "./catalog-image";
import type { ImageRow } from "@/lib/catalog";

// Mobile: a swipeable, snap-scrolling carousel with dot indicators — no
// thumbnail strip, which just ate vertical space above the fold on a phone.
// Desktop: the original static main image + clickable thumbnails (dead UI
// before this — the thumbnails never actually changed the main image).
// Both markups render at once, toggled by CSS breakpoint, matching how
// buy-box.tsx already handles its own mobile/desktop split in this codebase.
export default function ProductGallery({
  images,
  productName,
}: {
  images: ImageRow[];
  productName: string;
}) {
  const [active, setActive] = useState(0);
  const scrollerRef = useRef<HTMLDivElement>(null);

  if (images.length === 0) {
    return (
      <div className="overflow-hidden rounded-lg bg-surface">
        <CatalogImage
          path={null}
          alt={productName}
          name={productName}
          className="washed h-[46vh] w-full object-cover lg:aspect-square lg:h-auto"
        />
      </div>
    );
  }

  const onScroll = () => {
    const el = scrollerRef.current;
    if (!el || el.clientWidth === 0) return;
    setActive(Math.round(el.scrollLeft / el.clientWidth));
  };

  return (
    <div>
      {/* Mobile carousel */}
      <div className="lg:hidden">
        <div
          ref={scrollerRef}
          onScroll={onScroll}
          className="flex snap-x snap-mandatory overflow-x-auto overscroll-x-contain rounded-lg [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {images.map((img) => (
            <div key={img.id} className="w-full shrink-0 snap-center bg-surface">
              {/* Capped to well under half the viewport height — full-width
                  aspect-square photos were dominating the whole first
                  screen on a phone before a shopper saw anything else. */}
              <CatalogImage
                path={img.image_path}
                alt={img.alt_text || productName}
                name={productName}
                className="washed h-[46vh] w-full object-cover"
              />
            </div>
          ))}
        </div>
        {images.length > 1 && (
          <div className="mt-2.5 flex justify-center gap-1.5">
            {images.map((img, i) => (
              <span
                key={img.id}
                aria-hidden
                className={`h-1.5 rounded-full transition-all ${
                  i === active ? "w-5 bg-accent" : "w-1.5 bg-neutral-300"
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Desktop: static image + clickable thumbnails */}
      <div className="hidden lg:block">
        <div className="overflow-hidden rounded-lg bg-surface">
          <CatalogImage
            path={images[active].image_path}
            alt={images[active].alt_text || productName}
            name={productName}
            className="washed aspect-square w-full object-cover"
          />
        </div>
        {images.length > 1 && (
          <div className="mt-3 flex gap-3">
            {images.map((img, i) => (
              <button
                key={img.id}
                type="button"
                onClick={() => setActive(i)}
                aria-label={`Show image ${i + 1}`}
                className={`w-20 shrink-0 overflow-hidden rounded-md bg-surface transition-opacity ${
                  i === active ? "" : "opacity-60 hover:opacity-100"
                }`}
              >
                <CatalogImage
                  path={img.image_path}
                  alt={img.alt_text || productName}
                  name={productName}
                  className="washed aspect-square w-full object-cover"
                />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
