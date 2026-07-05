"use client";

import { useCart } from "@/lib/cart";

export default function CartButton() {
  const { count, hydrated, openCart } = useCart();
  return (
    <button
      type="button"
      onClick={openCart}
      className="label relative cursor-pointer border border-ink/30 px-4 py-2 transition-colors hover:bg-ink hover:text-paper"
      aria-label="Open cart"
    >
      Cart
      {hydrated && count > 0 && (
        <span className="absolute -right-2 -top-2 grid size-5 place-items-center rounded-full bg-chilli text-[10px] font-bold text-paper">
          {count}
        </span>
      )}
    </button>
  );
}
