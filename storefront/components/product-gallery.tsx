"use client";

import { useRef, useState } from "react";
import CatalogImage from "./catalog-image";
import GalleryLightbox from "./gallery-lightbox";
import type { ImageRow } from "@/lib/catalog";

// One swipeable, snap-scrolling carousel at every breakpoint. Mobile gets
// dot indicators below it (thumbnails would eat vertical space above the
// fold on a phone); desktop gets a clickable thumbnail strip instead, kept
// in sync with the carousel in both directions — scrolling the carousel
// updates the active thumbnail, clicking a thumbnail scrolls the carousel.
export default function ProductGallery({
  images,
  productName,
}: {
  images: ImageRow[];
  productName: string;
}) {
  const [active, setActive] = useState(0);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);

  if (images.length === 0) {
    return (
      <div className="overflow-hidden rounded-lg bg-surface">
        <CatalogImage
          path={null}
          alt={productName}
          name={productName}
          preset="gallery"
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

  const scrollToIndex = (i: number) => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollTo({ left: i * el.clientWidth, behavior: "smooth" });
    setActive(i);
  };

  return (
    <div>
      <div
        ref={scrollerRef}
        onScroll={onScroll}
        className="flex snap-x snap-mandatory overflow-x-auto overscroll-x-contain rounded-lg [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {images.map((img, i) => (
          <button
            key={img.id}
            type="button"
            onClick={() => setLightboxIndex(i)}
            aria-label={`View full image ${i + 1}`}
            className="w-full shrink-0 snap-center bg-surface"
          >
            {/* Capped to well under half the viewport height on mobile —
                full-width aspect-square photos were dominating the whole
                first screen on a phone before a shopper saw anything else. */}
            <CatalogImage
              path={img.image_path}
              alt={img.alt_text || productName}
              name={productName}
              preset="gallery"
              className="washed h-[46vh] w-full object-cover lg:aspect-square lg:h-auto lg:cursor-zoom-in"
            />
          </button>
        ))}
      </div>

      {images.length > 1 && (
        <>
          {/* Mobile: dot indicators */}
          <div className="mt-2.5 flex justify-center gap-1.5 lg:hidden">
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

          {/* Desktop: thumbnail strip */}
          <div className="mt-3 hidden gap-3 lg:flex">
            {images.map((img, i) => (
              <button
                key={img.id}
                type="button"
                onClick={() => scrollToIndex(i)}
                aria-label={`Show image ${i + 1}`}
                className={`w-20 shrink-0 overflow-hidden rounded-md bg-surface transition-opacity ${
                  i === active ? "" : "opacity-60 hover:opacity-100"
                }`}
              >
                <CatalogImage
                  path={img.image_path}
                  alt={img.alt_text || productName}
                  name={productName}
                  preset="thumb"
                  className="washed aspect-square w-full object-cover"
                />
              </button>
            ))}
          </div>
        </>
      )}

      {lightboxIndex !== null && (
        <GalleryLightbox
          images={images}
          initialIndex={lightboxIndex}
          productName={productName}
          onClose={() => setLightboxIndex(null)}
        />
      )}
    </div>
  );
}
