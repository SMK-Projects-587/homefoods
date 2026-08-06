"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import CartButton from "./cart-button";
import { useSearch } from "@/lib/search";

const NAV = [
  { href: "/", label: "Home" },
  { href: "/products", label: "Shop" },
  { href: "/about", label: "Our story" },
];

function LeafLogo() {
  return (
    <span className="grid size-[38px] shrink-0 place-items-center rounded-full bg-accent text-bg">
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="size-5"
      >
        <path d="M11 20A7 7 0 0 1 4 13C4 8 8 4 13 4c3 0 7 1 7 1s-1 4-1 7a7 7 0 0 1-8 8Z" />
        <path d="M8 17c2-3 5-5 8-6" />
      </svg>
    </span>
  );
}

export default function Header() {
  const pathname = usePathname();
  const { open } = useSearch();
  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  // Mobile: stay off-screen at the top of the page and slide in once the
  // shopper has actually scrolled, instead of permanently occupying the
  // first ~60px of every screen. Fixed (not sticky) below lg so the hidden
  // header doesn't still reserve its flow height and leave a blank gap.
  // Unaffected on lg — see the lg: override below.
  const [revealed, setRevealed] = useState(false);
  useEffect(() => {
    const onScroll = () => setRevealed(window.scrollY > 64);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-40 border-b border-line bg-bg/90 backdrop-blur-md transition-transform duration-300 lg:sticky lg:translate-y-0 ${
        revealed ? "translate-y-0" : "-translate-y-full"
      }`}
    >
      <div className="mx-auto flex max-w-[1160px] items-center gap-4 px-4 py-3 sm:px-[22px]">
        <Link href="/" className="flex min-w-0 items-center gap-2.5">
          <LeafLogo />
          <span className="min-w-0 leading-tight">
            <span className="block truncate font-heading text-[19px]">
              Andhra HomeFoods
            </span>
            <span className="telugu block truncate text-[11px] text-accent-700">
              అమ్మ చేతి రుచి · Since 1992
            </span>
          </span>
        </Link>

        <nav className="ml-auto hidden items-center gap-1 lg:flex">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              aria-current={isActive(n.href) ? "page" : undefined}
              className={`rounded-full px-4 py-2.5 text-[14.5px] font-bold transition-colors ${
                isActive(n.href)
                  ? "text-accent-700"
                  : "text-neutral-500 hover:bg-accent-100 hover:text-accent-700"
              }`}
            >
              {n.label}
            </Link>
          ))}
          <button
            type="button"
            onClick={open}
            className="rounded-full px-4 py-2.5 text-[14.5px] font-bold text-neutral-500 transition-colors hover:bg-accent-100 hover:text-accent-700"
          >
            Search
          </button>
        </nav>

        <div className="ml-auto flex items-center gap-2 lg:ml-2">
          {/* mobile: quick search button next to the cart */}
          <button
            type="button"
            onClick={open}
            aria-label="Search"
            className="grid size-11 shrink-0 cursor-pointer place-items-center rounded-full bg-accent-100 text-accent-800 transition-colors hover:bg-accent-200 lg:hidden"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              className="size-5"
            >
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" />
            </svg>
          </button>
          <CartButton />
        </div>
      </div>
    </header>
  );
}
