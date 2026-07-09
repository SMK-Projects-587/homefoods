import Link from "next/link";
import type { Category } from "@/lib/catalog";

export default function Footer({ categories }: { categories: Category[] }) {
  return (
    <footer className="mt-20 border-t-2 border-ink bg-ink text-paper">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 md:grid-cols-3">
        <div>
          <p className="font-display text-3xl">
            <em>Home</em>Foods<span className="text-turmeric">.</span>
          </p>
          <p className="mt-3 max-w-xs text-sm text-paper/70">
            Pickles, podis, snacks and sweets made in small batches, the way
            they&rsquo;ve always been made at home.
          </p>
          <p className="font-telugu mt-4 text-turmeric-soft">
            ఇంటి రుచి, ప్రేమతో.
          </p>
        </div>
        <div>
          <p className="label text-turmeric">Shop</p>
          <ul className="mt-3 space-y-2 text-sm">
            <li>
              <Link href="/products" className="hover:text-turmeric">
                All products
              </Link>
            </li>
            {categories.map((c) => (
              <li key={c.id}>
                <Link href={`/category/${c.slug}`} className="hover:text-turmeric">
                  {c.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="label text-turmeric">Good to know</p>
          <ul className="mt-3 space-y-2 text-sm text-paper/70">
            <li>No accounts, no passwords — just food.</li>
            <li>Orders are confirmed over a phone call.</li>
            <li>Online checkout is on its way.</li>
          </ul>
        </div>
      </div>
      <p className="border-t border-paper/15 py-4 text-center text-xs text-paper/50">
        © {new Date().getFullYear()} HomeFoods · Guntur, Andhra Pradesh
      </p>
    </footer>
  );
}
