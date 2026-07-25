import { revalidateTag } from "next/cache";
import { NextResponse, type NextRequest } from "next/server";

// Maps a mutated DB table to the storefront cache tag it should invalidate.
// Everything that feeds a product card (variants, images) lives under
// "products"; the category list/detail lives under "categories".
function tagsForTable(table?: string): string[] {
  switch (table) {
    case "categories":
      return ["categories"];
    case "products":
    case "product_variants":
    case "product_images":
      return ["products"];
    default:
      return [];
  }
}

const KNOWN_TAGS = new Set(["products", "categories"]);

// On-demand revalidation endpoint. Called by a Supabase Database Webhook (or the
// dashboard) after a catalog mutation so the storefront cache refreshes without
// a redeploy. Guarded by the REVALIDATE_SECRET env var.
//
//   POST /api/revalidate            body: { "tag": "products" }
//                                     or: { "tags": ["products","categories"] }
//                                     or a Supabase webhook payload: { "table": "products", ... }
//   header  x-revalidate-secret: <REVALIDATE_SECRET>   (or ?secret=)
export async function POST(req: NextRequest) {
  const provided =
    req.headers.get("x-revalidate-secret") ??
    new URL(req.url).searchParams.get("secret");
  const expected = process.env.REVALIDATE_SECRET;
  if (!expected || provided !== expected) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = (await req.json().catch(() => ({}))) as {
    tag?: string;
    tags?: string[];
    table?: string; // Supabase Database Webhook payload shape
  };

  let tags: string[];
  if (body.tag) tags = [body.tag];
  else if (Array.isArray(body.tags)) tags = body.tags;
  else if (body.table) tags = tagsForTable(body.table);
  // No hint at all → refresh the whole catalog.
  else tags = ["products", "categories"];

  const applied = [...new Set(tags)].filter((t) => KNOWN_TAGS.has(t));
  for (const tag of applied) revalidateTag(tag, "max");

  return NextResponse.json({ revalidated: applied, now: Date.now() });
}
