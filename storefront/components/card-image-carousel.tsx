"use client";

import { useRef, useState } from "react";
import CatalogImage from "./catalog-image";

// Grid-card image slot. Mobile (below lg): if a product has more than one
// photo, it becomes a native snap-scroll carousel with an ellipsis
// indicator over the bottom of the image — swipe, don't drag-and-drop a JS
// library into every card. Desktop just shows the primary image; hover
// isn't a mobile concept and a mouse-drag carousel in a dense grid is more
// nuisance than feature.
export default function CardImageCarousel({
  paths,
  alt,
  name,
  priority,
}: {
  paths: string[];
  alt: string;
  name: string;
  priority?: boolean;
}) {
  const [active, setActive] = useState(0);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const multi = paths.length > 1;

  const onScroll = () => {
    const el = scrollerRef.current;
    if (!el || el.clientWidth === 0) return;
    setActive(Math.round(el.scrollLeft / el.clientWidth));
  };

  if (!multi) {
    return (
      <CatalogImage
        path={paths[0] ?? null}
        alt={alt}
        name={name}
        priority={priority}
        className="washed size-full object-cover transition-transform duration-500 group-hover:scale-105"
      />
    );
  }

  return (
    <>
      <div
        ref={scrollerRef}
        onScroll={onScroll}
        className="no-scrollbar flex size-full snap-x snap-mandatory overflow-x-auto overscroll-x-contain lg:hidden"
      >
        {paths.map((path, i) => (
          <div key={path + i} className="w-full shrink-0 snap-center">
            <CatalogImage
              path={path}
              alt={alt}
              name={name}
              priority={priority && i === 0}
              className="washed size-full object-cover"
            />
          </div>
        ))}
      </div>
      {/* Desktop: single static image, no scroller/JS needed. */}
      <CatalogImage
        path={paths[0]}
        alt={alt}
        name={name}
        priority={priority}
        className="washed hidden size-full object-cover transition-transform duration-500 group-hover:scale-105 lg:block"
      />
      {/* Ellipsis indicator, mobile only — hints there's more to swipe. */}
      <div className="pointer-events-none absolute inset-x-0 bottom-2 flex justify-center gap-1 lg:hidden">
        {paths.map((_, i) => (
          <span
            key={i}
            aria-hidden
            className={`size-1.5 rounded-full transition-colors ${
              i === active ? "bg-bg" : "bg-bg/50"
            }`}
          />
        ))}
      </div>
    </>
  );
}
