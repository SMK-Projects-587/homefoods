import type { MetadataRoute } from "next";
import { getCategories, getProductSitemapEntries } from "@/lib/catalog.server";
import { absoluteUrl } from "@/lib/site";

// Regenerate the sitemap periodically rather than on every crawl.
// Data is cached per-fetch via `use cache` in lib/catalog.server.

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [categories, products] = await Promise.all([
    getCategories(),
    getProductSitemapEntries(),
  ]);
  // The three static routes have no single DB record to date them by —
  // "now" is the least wrong choice there. Category/product routes do have
  // real updated_at columns, so those drive their own lastModified instead
  // of everything sharing one build-time stamp.
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: absoluteUrl("/"), lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: absoluteUrl("/products"), lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: absoluteUrl("/about"), lastModified: now, changeFrequency: "yearly", priority: 0.5 },
  ];

  const categoryRoutes: MetadataRoute.Sitemap = categories.map((c) => ({
    url: absoluteUrl(`/category/${c.slug}`),
    lastModified: new Date(c.updated_at),
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  const productRoutes: MetadataRoute.Sitemap = products.map((p) => ({
    url: absoluteUrl(`/products/${p.slug}`),
    lastModified: new Date(p.updatedAt),
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  return [...staticRoutes, ...categoryRoutes, ...productRoutes];
}
