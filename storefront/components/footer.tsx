import Link from "next/link";
import type { Category } from "@/lib/catalog";

// Copyright year, evaluated once at module load (build time) rather than during
// render — Cache Components forbids `new Date()` in the prerendered shell. A
// year-stale copyright between a New Year and the next deploy is immaterial.
const COPYRIGHT_YEAR = new Date().getFullYear();

export default function Footer({ categories }: { categories: Category[] }) {
  return (
    <footer className="mt-12 border-t border-line bg-surface pb-24 lg:pb-0">
      <div className="mx-auto grid max-w-[1160px] gap-8 px-4 py-12 sm:px-[22px] md:grid-cols-3">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="grid size-[38px] shrink-0 place-items-center rounded-full bg-accent text-bg">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" className="size-5">
                <path d="M11 20A7 7 0 0 1 4 13C4 8 8 4 13 4c3 0 7 1 7 1s-1 4-1 7a7 7 0 0 1-8 8Z" />
                <path d="M8 17c2-3 5-5 8-6" />
              </svg>
            </span>
            <span className="font-heading text-[19px]">Andhra HomeFoods</span>
          </div>
          <p className="mt-3 max-w-xs text-[14px] text-neutral-700">
            Traditional Brahmin home-style snacks, podis, pickles and sweets —
            hand-made in small batches since 1992.
          </p>
          <p className="telugu mt-3 text-[14px] text-accent-700">
            అమ్మ చేతి రుచి, ప్రేమతో.
          </p>
        </div>
        <div>
          <p className="label text-neutral-500">Shop</p>
          <ul className="mt-3 space-y-2 text-[14px]">
            <li>
              <Link href="/products" className="hover:text-accent-700">
                The whole kitchen
              </Link>
            </li>
            {categories.map((c) => (
              <li key={c.id}>
                <Link
                  href={`/category/${c.slug}`}
                  className="hover:text-accent-700"
                >
                  {c.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="label text-neutral-500">Good to know</p>
          <ul className="mt-3 space-y-2 text-[14px] text-neutral-700">
            <li>100% pure veg · no preservatives</li>
            <li>Orders placed &amp; confirmed on WhatsApp</li>
            <li>Ships all over India in 2–5 days</li>
            <li>
              <Link href="/about" className="font-semibold hover:text-accent-700">
                Our story →
              </Link>
            </li>
          </ul>
        </div>
      </div>
      <p className="border-t border-line py-4 text-center text-[12px] text-neutral-500">
        © {COPYRIGHT_YEAR} Andhra HomeFoods · Vizianagaram, Andhra
        Pradesh
      </p>
    </footer>
  );
}
