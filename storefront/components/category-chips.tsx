import Link from "next/link";
import type { Category } from "@/lib/catalog";

// Shared by /products (browse-all + search) and /category/[slug] so the
// "which category am I looking at" row is identical everywhere instead of
// each page inventing its own — always includes an "All" chip plus every
// category, with the active one highlighted. `hrefFor` lets each page decide
// where a chip should link (plain category pages vs. search-scoped links).
const chipClass = (active: boolean) =>
  `shrink-0 rounded-full border px-4 py-2 text-[13.5px] font-bold transition-colors ${
    active
      ? "border-accent bg-accent text-bg"
      : "border-neutral-300 bg-neutral-100 text-neutral-700 hover:border-accent hover:text-accent-700"
  }`;

export default function CategoryChips({
  categories,
  activeSlug,
  hrefFor,
}: {
  categories: Category[];
  activeSlug: string | null;
  hrefFor: (categorySlug?: string) => string;
}) {
  return (
    <div className="no-scrollbar -mx-4 mt-5 flex gap-2 overflow-x-auto px-4 py-1 sm:mx-0 sm:px-0">
      <Link href={hrefFor()} className={chipClass(!activeSlug)}>
        All
      </Link>
      {categories.map((c) => (
        <Link
          key={c.id}
          href={hrefFor(c.slug)}
          className={chipClass(activeSlug === c.slug)}
        >
          {c.name}
        </Link>
      ))}
    </div>
  );
}
