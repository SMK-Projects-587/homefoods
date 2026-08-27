"use client";

import { useEffect, useRef, useState } from "react";
import { productImageUrl } from "@/lib/supabase";

// Warm, on-palette fallback tones — seeded per name so a product always gets
// the same tile. Soft accent/sage/neutral washes, never a harsh block colour.
const TONES = [
  { a: "#ffe1d0", b: "#ffc6a5", ink: "#8c491a" }, // terracotta
  { a: "#e1eecc", b: "#ccdbb2", ink: "#56633f" }, // sage
  { a: "#f9f4ed", b: "#dcd3c4", ink: "#645c50" }, // neutral
  { a: "#fff2eb", b: "#f6a06b", ink: "#643312" }, // deep terracotta
];

function tone(seed: string) {
  let h = 0;
  for (const ch of seed) h = (h * 31 + ch.charCodeAt(0)) | 0;
  return TONES[Math.abs(h) % TONES.length];
}

function initials(name: string) {
  return name
    .replace(/\(.*?\)/g, "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

function Placeholder({ name, className }: { name: string; className?: string }) {
  const t = tone(name);
  return (
    <div
      aria-hidden
      className={`relative grid place-items-center overflow-hidden ${className ?? ""}`}
      style={{
        containerType: "inline-size",
        backgroundImage: `radial-gradient(120% 120% at 30% 20%, ${t.a} 0%, ${t.b} 100%)`,
      }}
    >
      {/* faint concentric rings, like a jar seen from above */}
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          backgroundImage: `repeating-radial-gradient(circle at 50% 55%, transparent 0 13px, ${t.ink}14 13px 14px)`,
        }}
      />
      <div className="relative flex flex-col items-center gap-[4cqw]" style={{ color: t.ink }}>
        {/* leaf mark */}
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="opacity-70"
          style={{ width: "16cqw", height: "16cqw" }}
        >
          <path d="M11 20A7 7 0 0 1 4 13C4 8 8 4 13 4c3 0 7 1 7 1s-1 4-1 7a7 7 0 0 1-8 8Z" />
          <path d="M8 17c2-3 5-5 8-6" />
        </svg>
        <span
          className="font-heading leading-none"
          style={{ fontSize: "34cqw" }}
        >
          {initials(name)}
        </span>
      </div>
    </div>
  );
}

// Seeded image paths point at objects that may not exist in the local bucket
// yet, so a failed load falls back to a decorative on-palette tile.
export default function CatalogImage({
  path,
  alt,
  name,
  className,
  priority,
}: {
  path: string | null;
  alt: string;
  name: string;
  className?: string;
  // Above-the-fold cards (first row of a grid) should load eagerly at high
  // priority instead of lazily, or the LCP image itself gets deferred.
  priority?: boolean;
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
      loading={priority ? "eager" : "lazy"}
      fetchPriority={priority ? "high" : undefined}
      className={className}
      onError={() => setErrored(true)}
    />
  );
}
