"use client";

import { useCart } from "@/lib/cart";

export default function CartButton() {
  const { count, hydrated, openCart } = useCart();
  return (
    <button
      type="button"
      onClick={openCart}
      className="relative grid size-11 shrink-0 cursor-pointer place-items-center rounded-full bg-accent-100 text-accent-800 transition-colors hover:bg-accent-200"
      aria-label="Open basket"
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="size-5"
      >
        <circle cx="9" cy="20" r="1.4" />
        <circle cx="18" cy="20" r="1.4" />
        <path d="M2.5 3h2l2.2 12.2a1.6 1.6 0 0 0 1.6 1.3h8.4a1.6 1.6 0 0 0 1.6-1.3L21 7H6" />
      </svg>
      {hydrated && count > 0 && (
        <span className="absolute -right-1 -top-1 grid min-w-5 place-items-center rounded-full bg-accent px-1 text-[10px] font-bold text-bg">
          {count}
        </span>
      )}
    </button>
  );
}
