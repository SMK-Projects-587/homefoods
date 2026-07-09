import Link from "next/link";
import CartButton from "./cart-button";
import SearchBar from "./search-bar";
import type { Category } from "@/lib/catalog";

export default function Header({ categories }: { categories: Category[] }) {
  return (
    <header className="sticky top-0 z-40 border-b-2 border-ink bg-paper/95 backdrop-blur-sm">
      <p className="label hidden border-b border-line bg-ink py-1.5 text-center text-paper sm:block">
        <span className="font-telugu normal-case tracking-normal text-turmeric-soft">
          ఇంటి రుచి
        </span>
        <span className="mx-2 text-turmeric">✳</span>
        Small-batch Andhra pantry · made at home in Guntur
      </p>
      <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-2.5 sm:py-3 lg:gap-6">
        <Link href="/" className="shrink-0 font-display text-2xl tracking-tight">
          <em>Home</em>Foods<span className="text-chilli">.</span>
        </Link>
        <nav className="hidden items-center gap-5 lg:flex">
          <Link href="/products" className="label hover:text-chilli">
            Shop all
          </Link>
          {categories.map((c) => (
            <Link
              key={c.id}
              href={`/category/${c.slug}`}
              className="label hover:text-chilli"
            >
              {c.name}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-3">
          <SearchBar className="hidden w-64 md:block lg:w-80" />
          <CartButton />
        </div>
      </div>
      {/* On mobile the search bar is the centrepiece, quick-commerce style. */}
      <div className="px-4 pb-2.5 md:hidden">
        <SearchBar />
      </div>
      <nav className="no-scrollbar flex gap-5 overflow-x-auto border-t border-line px-4 py-2 lg:hidden">
        <Link href="/products" className="label shrink-0 hover:text-chilli">
          Shop all
        </Link>
        {categories.map((c) => (
          <Link
            key={c.id}
            href={`/category/${c.slug}`}
            className="label shrink-0 hover:text-chilli"
          >
            {c.name}
          </Link>
        ))}
      </nav>
    </header>
  );
}
