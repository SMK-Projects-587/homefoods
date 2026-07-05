"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useCart } from "@/lib/cart";
import { formatINR } from "@/lib/format";
import CatalogImage from "./catalog-image";
import QtyStepper from "./qty-stepper";

export default function CartSidebar() {
  const { items, isOpen, closeCart, removeItem, setQty, subtotal } = useCart();

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && closeCart();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [isOpen, closeCart]);

  return (
    <>
      <div
        aria-hidden
        onClick={closeCart}
        className={`fixed inset-0 z-50 bg-ink/50 transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />
      <aside
        aria-label="Shopping cart"
        className={`fixed right-0 top-0 z-50 flex h-dvh w-full max-w-md flex-col border-l-2 border-ink bg-paper transition-transform duration-300 ease-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <h2 className="font-display text-2xl">Your basket</h2>
          <button
            type="button"
            onClick={closeCart}
            aria-label="Close cart"
            className="label cursor-pointer border border-ink/30 px-3 py-1.5 hover:bg-ink hover:text-paper"
          >
            Close
          </button>
        </div>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
            <p className="font-display text-3xl italic">Nothing pickled yet.</p>
            <p className="text-soft">
              The jars are waiting — go find your avakaya.
            </p>
            <Link
              href="/products"
              onClick={closeCart}
              className="label mt-2 bg-chilli px-5 py-3 text-paper transition-colors hover:bg-chilli-deep"
            >
              Browse the pantry
            </Link>
          </div>
        ) : (
          <>
            <ul className="flex-1 divide-y divide-line overflow-y-auto px-5">
              {items.map((item) => (
                <li key={item.variantId} className="flex gap-4 py-4">
                  <Link
                    href={`/products/${item.productSlug}`}
                    onClick={closeCart}
                    className="block size-16 shrink-0 overflow-hidden border border-line"
                  >
                    <CatalogImage
                      path={item.imagePath}
                      alt={item.productName}
                      name={item.productName}
                      className="size-full object-cover"
                    />
                  </Link>
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/products/${item.productSlug}`}
                      onClick={closeCart}
                      className="font-display leading-tight hover:text-chilli"
                    >
                      {item.productName}
                    </Link>
                    <p className="text-xs text-soft">{item.variantTitle}</p>
                    <div className="mt-2 flex items-center justify-between">
                      <QtyStepper
                        small
                        qty={item.qty}
                        onChange={(q) => setQty(item.variantId, q)}
                      />
                      <span className="text-sm font-bold">
                        {formatINR(item.price * item.qty)}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    aria-label={`Remove ${item.productName}`}
                    onClick={() => removeItem(item.variantId)}
                    className="cursor-pointer self-start text-soft transition-colors hover:text-chilli"
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
            <div className="border-t-2 border-ink px-5 py-4">
              <div className="flex items-baseline justify-between">
                <span className="label text-soft">Subtotal</span>
                <span className="font-display text-2xl">{formatINR(subtotal)}</span>
              </div>
              <p className="mt-1 text-xs text-soft">
                Shipping worked out when we call to confirm your order.
              </p>
              {/* Checkout is intentionally a no-op for now. */}
              <button
                type="button"
                className="label mt-4 w-full cursor-pointer bg-chilli py-3.5 text-paper transition-colors hover:bg-chilli-deep"
              >
                Checkout
              </button>
              <Link
                href="/cart"
                onClick={closeCart}
                className="label mt-2 block w-full border border-ink/30 py-3 text-center transition-colors hover:bg-ink hover:text-paper"
              >
                View full cart
              </Link>
            </div>
          </>
        )}
      </aside>
    </>
  );
}
