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
  // lastmod must only move when content does — a timestamp that is "now" on
  // every fetch teaches crawlers to ignore it. Listing pages take the newest
  // updated_at of what they show; /about is static copy, so it carries the
  // date it last changed (bump when editing app/about).
  const newest = (dates: string[]) =>
    new Date(Math.max(...dates.map((d) => new Date(d).getTime())));
  const productsUpdated = products.length
    ? newest(products.map((p) => p.updatedAt))
    : undefined;
  const homeUpdated =
    products.length || categories.length
      ? newest([
          ...products.map((p) => p.updatedAt),
          ...categories.map((c) => c.updated_at),
        ])
      : undefined;
  const ABOUT_LAST_MODIFIED = new Date("2026-09-26");

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: absoluteUrl("/"), lastModified: homeUpdated, changeFrequency: "weekly", priority: 1 },
    { url: absoluteUrl("/products"), lastModified: productsUpdated, changeFrequency: "daily", priority: 0.9 },
    { url: absoluteUrl("/about"), lastModified: ABOUT_LAST_MODIFIED, changeFrequency: "yearly", priority: 0.5 },
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
