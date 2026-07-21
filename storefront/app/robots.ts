import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Utility + thin/duplicate surfaces: the basket, the search screen, and
      // search-result query strings shouldn't be indexed.
      disallow: ["/cart", "/search", "/products?"],
    },
    sitemap: absoluteUrl("/sitemap.xml"),
    host: absoluteUrl("/"),
  };
}
