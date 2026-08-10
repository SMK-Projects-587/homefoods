import type { NextConfig } from "next";

// Origins the storefront actually talks to — everything else in
// script/connect/img-src is deliberately left off.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const r2PublicBaseUrl = process.env.NEXT_PUBLIC_R2_PUBLIC_BASE_URL || "";

// No nonce/strict-dynamic here (would need per-request middleware to
// generate one) — 'unsafe-inline' on script-src is required because Next's
// App Router streams RSC payloads via inline <script> tags. Still meaningful:
// this blocks script/connect/frame to any origin outside the ones the store
// actually calls, which is the bulk of the XSS/data-exfil value of a CSP.
// Tightening to nonce-based script-src is a good follow-up, not a blocker.
const csp = [
  `default-src 'self'`,
  `script-src 'self' 'unsafe-inline'`,
  `style-src 'self' 'unsafe-inline'`,
  `img-src 'self' data: ${supabaseUrl} ${r2PublicBaseUrl}`.trim(),
  `connect-src 'self' ${supabaseUrl}`.trim(),
  `font-src 'self' data:`,
  `frame-ancestors 'none'`,
  `base-uri 'self'`,
  `form-action 'self'`,
]
  .map((d) => d.replace(/\s+/g, " ").trim())
  .join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
];

const nextConfig: NextConfig = {
  async headers() {
    // Dev-only skip: React's dev mode needs eval() for its debugging
    // features (never used in production), which script-src above blocks —
    // without this the dev overlay flags a bogus CSP "issue" on every page.
    if (process.env.NODE_ENV !== "production") return [];
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  // Cache Components (PPR + `use cache`): catalog data is cached at runtime and
  // invalidated by tag (see lib/catalog.ts + app/api/revalidate). Build time
  // stays constant regardless of catalog size.
  cacheComponents: true,
  experimental: {
    // Re-enable the client Router Cache for dynamic routes. Next 15+ defaults
    // `dynamic` to 0s (no client caching), which is why returning to a
    // previously-visited category/product page refetched every time. 300s means
    // back-navigation is served instantly from the client cache.
    staleTimes: {
      dynamic: 300,
      static: 300,
    },
    // Turbopack's on-disk dev cache (.next/dev/cache/turbopack) has no built-in
    // eviction and grew unbounded to multiple GB, which is what was driving
    // `next dev --turbo`'s RAM use — Turbopack keeps its working set resident.
    // Cap it; Turbopack will evict old entries once this is hit instead of
    // growing forever. Raise if rebuilds start thrashing the cache.
    turbopackMemoryLimit: 1024 * 1024 * 1024, // 1 GiB
  },
};

export default nextConfig;
