"use client";

import { useEffect, useRef, useState } from "react";
import { productImageUrl } from "@/lib/supabase";

const TONES = [
  { bg: "#a62c15", fg: "#f8f1e2" }, // chilli
  { bg: "#dda11e", fg: "#2b1a0e" }, // turmeric
  { bg: "#5a7040", fg: "#f8f1e2" }, // leaf
  { bg: "#7c1e0e", fg: "#f2cf85" }, // deep chilli
];

function tone(seed: string) {
  let h = 0;
  for (const ch of seed) h = (h * 31 + ch.charCodeAt(0)) | 0;
  return TONES[Math.abs(h) % TONES.length];
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join("");
}

function Placeholder({ name, className }: { name: string; className?: string }) {
  const t = tone(name);
  return (
    <div
      aria-hidden
      className={`grid place-items-center ${className ?? ""}`}
      style={{
        backgroundColor: t.bg,
        color: t.fg,
        backgroundImage:
          "radial-gradient(currentColor 1px, transparent 1px), radial-gradient(currentColor 1px, transparent 1px)",
        backgroundSize: "22px 22px, 22px 22px",
        backgroundPosition: "0 0, 11px 11px",
      }}
    >
      <span
        className="font-display italic opacity-90"
        style={{ fontSize: "clamp(2rem, 30cqw, 5rem)" }}
      >
        {initials(name)}
      </span>
    </div>
  );
}

// Seeded image paths point at objects that may not exist in the local
// bucket yet, so a failed load falls back to a decorative tile.
export default function CatalogImage({
  path,
  alt,
  name,
  className,
}: {
  path: string | null;
  alt: string;
  name: string;
  className?: string;
}) {
  const [errored, setErrored] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  // Above-the-fold images can fail before hydration, so onError never fires.
  // Catch that case by inspecting the already-settled element after mount.
  useEffect(() => {
    const el = imgRef.current;
    if (el && el.complete && el.naturalWidth === 0) {
      setErrored(true);
    }
  }, []);

  if (!path || errored) return <Placeholder name={name} className={className} />;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      ref={imgRef}
      src={productImageUrl(path)}
      alt={alt}
      loading="lazy"
      className={className}
      onError={() => setErrored(true)}
    />
  );
}
