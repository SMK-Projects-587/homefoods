"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import CartButton from "./cart-button";
import { useSearch } from "@/lib/search";

const NAV = [
  { href: "/", label: "Home" },
  { href: "/products", label: "Shop" },
  { href: "/about", label: "Our story" },
];

export default function Header() {
  const pathname = usePathname();
  const { open } = useSearch();
  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <header className="fixed inset-x-0 top-0 z-40 border-b border-line bg-bg/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-[1160px] items-center gap-1 px-4 py-3 sm:px-[22px]">
        <Link href="/" className="flex min-w-0 items-center gap-2.5">
          <span className="relative size-[64px] shrink-0 overflow-hidden rounded-full">
            <Image
              src="/logo.webp"
              alt="Andhra Brahmin Home Own Manufacturing Food Items"
              fill
              className="scale-178 object-cover"
              priority
            />
          </span>
          <span className="min-w-0 leading-tight">
            <span title="Andhra Brahmin Home Own Manufacturing Food Items" className="block truncate font-heading font-bold text-[19px]">
              A.B.H.O.M.F.I
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
            title="Search"
            className="rounded-full size-11 inline-flex justify-center items-center text-neutral-500 transition-colors hover:bg-accent-100 hover:text-accent-700"
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
        </nav>

        <div className="ml-auto flex items-center gap-2 lg:ml-2">
          {/* mobile: search only — cart lives in the bottom nav */}
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
          <span className="hidden lg:block">
            <CartButton />
          </span>
        </div>
      </div>
    </header>
  );
}
