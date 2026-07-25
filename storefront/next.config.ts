import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
  },
};

export default nextConfig;
