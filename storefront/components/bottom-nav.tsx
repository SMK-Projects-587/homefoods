"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSearch } from "@/lib/search";

function Icon({ name }: { name: "home" | "shop" | "search" }) {
  const common = {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2.75,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    className: "size-[21px]",
  };
  if (name === "home")
    return (
      <svg {...common}>
        <path d="M4 11.5 12 4l8 7.5" />
        <path d="M6 10v9h12v-9" />
      </svg>
    );
  if (name === "shop")
    return (
      <svg {...common}>
        <path d="M5 8h14l-1 12H6L5 8Z" />
        <path d="M9 8a3 3 0 0 1 6 0" />
      </svg>
    );
  return (
    <svg {...common}>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}

export default function BottomNav() {
  const pathname = usePathname();
  const { open } = useSearch();

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  const cls = (active: boolean) =>
    `flex flex-1 flex-col items-center gap-1 py-2 text-[10.5px] font-bold transition-colors ${
      active ? "text-accent-700" : "text-neutral-500"
    }`;

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-neutral-200 bg-neutral-100 shadow-lg lg:hidden"
      style={{
        borderRadius: "24px 24px 0 0",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
      aria-label="Primary"
    >
      <div className="mx-auto flex max-w-md items-stretch px-2">
        <Link href="/" className={cls(isActive("/"))}>
          <Icon name="home" />
          Home
        </Link>
        <Link href="/products" className={cls(isActive("/products"))}>
          <Icon name="shop" />
          Shop
        </Link>
        <button type="button" onClick={open} className={cls(false)}>
          <Icon name="search" />
          Search
        </button>
      </div>
    </nav>
  );
}
