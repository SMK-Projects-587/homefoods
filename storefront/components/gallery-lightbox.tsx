"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import CatalogImage from "./catalog-image";
import type { ImageRow } from "@/lib/catalog";

// Full-view popup opened by tapping/clicking a gallery image. Portal'd onto
// <body> (same reasoning as variant-drawer.tsx) so it always sits above
// everything regardless of where the gallery lives in the tree.
export default function GalleryLightbox({
  images,
  initialIndex,
  productName,
  onClose,
}: {
  images: ImageRow[];
  initialIndex: number;
  productName: string;
  onClose: () => void;
}) {
  const [index, setIndex] = useState(initialIndex);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") setIndex((i) => (i - 1 + images.length) % images.length);
      if (e.key === "ArrowRight") setIndex((i) => (i + 1) % images.length);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose, images.length]);

  const img = images[index];

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`${productName} — full view`}
      onClick={onClose}
      className="fixed inset-0 z-50 flex animate-fade flex-col bg-neutral-900/90"
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Close"
        className="absolute right-4 top-4 z-10 grid size-10 place-items-center rounded-full bg-neutral-900/60 text-white transition-colors hover:bg-neutral-900/80"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" className="size-5">
          <path d="M6 6l12 12M18 6 6 18" />
        </svg>
      </button>

      <div className="flex flex-1 items-center justify-center px-4" onClick={(e) => e.stopPropagation()}>
        <CatalogImage
          path={img.image_path}
          alt={img.alt_text || productName}
          name={productName}
          preset="zoom"
          className="max-h-[85vh] max-w-full object-contain"
        />
      </div>

      {images.length > 1 && (
        <>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIndex((i) => (i - 1 + images.length) % images.length);
            }}
            aria-label="Previous image"
            className="absolute left-2 top-1/2 grid size-10 -translate-y-1/2 place-items-center rounded-full bg-neutral-900/60 text-white transition-colors hover:bg-neutral-900/80 lg:left-4"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="size-5">
              <path d="M15 6l-6 6 6 6" />
            </svg>
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIndex((i) => (i + 1) % images.length);
            }}
            aria-label="Next image"
            className="absolute right-2 top-1/2 grid size-10 -translate-y-1/2 place-items-center rounded-full bg-neutral-900/60 text-white transition-colors hover:bg-neutral-900/80 lg:right-4"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="size-5">
              <path d="M9 6l6 6-6 6" />
            </svg>
          </button>
          <div
            aria-hidden
            className="mb-[calc(1rem+env(safe-area-inset-bottom))] flex justify-center gap-1.5"
          >
            {images.map((im, i) => (
              <span
                key={im.id}
                className={`h-1.5 rounded-full transition-all ${
                  i === index ? "w-5 bg-white" : "w-1.5 bg-white/40"
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>,
    document.body,
  );
}
