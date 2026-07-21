"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useCart } from "@/lib/cart";
import { formatINR } from "@/lib/format";
import CatalogImage from "./catalog-image";
import QtyStepper from "./qty-stepper";
import CheckoutButton from "./checkout-button";

export default function CartSidebar() {
  const { items, isOpen, closeCart, removeItem, setQty, subtotal, count } =
    useCart();

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
        className={`fixed inset-0 z-50 bg-neutral-900/45 transition-opacity duration-200 ${
          isOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />
      <aside
        aria-label="Shopping basket"
        className={`fixed inset-x-0 bottom-0 z-50 flex max-h-[78vh] flex-col rounded-t-[28px] bg-bg shadow-lg transition-transform duration-300 ease-out lg:inset-y-0 lg:left-auto lg:right-0 lg:max-h-none lg:h-dvh lg:w-[430px] lg:rounded-[28px_0_0_28px] ${
          isOpen
            ? "translate-y-0 lg:translate-x-0"
            : "translate-y-full lg:translate-x-full lg:translate-y-0"
        }`}
      >
        {/* grab handle (mobile only) */}
        <div className="flex justify-center pt-2.5 lg:hidden">
          <span className="h-1.5 w-10 rounded-full bg-neutral-300" />
        </div>

        <div className="flex items-center justify-between px-5 py-3.5">
          <h2 className="font-heading text-[21px]">Your basket ({count})</h2>
          <button
            type="button"
            onClick={closeCart}
            aria-label="Close basket"
            className="grid size-9 cursor-pointer place-items-center rounded-full bg-neutral-200 text-neutral-700 transition-colors hover:bg-neutral-300"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" className="size-4">
              <path d="M6 6l12 12M18 6 6 18" />
            </svg>
          </button>
        </div>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 px-8 py-14 text-center">
            <span className="grid size-16 place-items-center rounded-full bg-accent-100 text-accent-700">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-7">
                <circle cx="9" cy="20" r="1.4" />
                <circle cx="18" cy="20" r="1.4" />
                <path d="M2.5 3h2l2.2 12.2a1.6 1.6 0 0 0 1.6 1.3h8.4a1.6 1.6 0 0 0 1.6-1.3L21 7H6" />
              </svg>
            </span>
            <p className="font-heading text-[21px]">Your basket is empty</p>
            <p className="text-[14px] text-neutral-600">
              Amma&rsquo;s pickles and podis are waiting.
            </p>
            <Link
              href="/products"
              onClick={closeCart}
              className="mt-2 rounded-full bg-accent px-5 py-3 text-[14px] font-bold text-bg transition-colors hover:bg-accent-600"
            >
              Start shopping
            </Link>
          </div>
        ) : (
          <>
            <ul className="flex-1 space-y-2 overflow-y-auto px-4 pb-2">
              {items.map((item) => (
                <li
                  key={item.variantId}
                  className="flex gap-3 rounded-[18px] bg-neutral-100 p-2.5"
                >
                  <Link
                    href={`/products/${item.productSlug}`}
                    onClick={closeCart}
                    className="block size-14 shrink-0 overflow-hidden rounded-[12px] bg-surface"
                  >
                    <CatalogImage
                      path={item.imagePath}
                      alt={item.productName}
                      name={item.productName}
                      className="washed size-full object-cover"
                    />
                  </Link>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <Link
                        href={`/products/${item.productSlug}`}
                        onClick={closeCart}
                        className="text-[14px] font-bold leading-tight hover:text-accent-700"
                      >
                        {item.productName}
                      </Link>
                      <button
                        type="button"
                        aria-label={`Remove ${item.productName}`}
                        onClick={() => removeItem(item.variantId)}
                        className="-mt-0.5 grid size-6 shrink-0 cursor-pointer place-items-center rounded-full text-neutral-500 transition-colors hover:text-accent-700"
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" className="size-3.5">
                          <path d="M6 6l12 12M18 6 6 18" />
                        </svg>
                      </button>
                    </div>
                    <p className="text-[12.5px] text-neutral-600">
                      {item.variantTitle} · {formatINR(item.price)}
                    </p>
                    <div className="mt-1.5 flex items-center justify-between">
                      <QtyStepper
                        small
                        qty={item.qty}
                        onChange={(q) => setQty(item.variantId, q)}
                      />
                      <span className="text-[14px] font-bold">
                        {formatINR(item.price * item.qty)}
                      </span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            <div className="border-t border-neutral-200 p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
              <div className="mb-3 flex items-baseline justify-between">
                <span className="text-[14px] text-neutral-600">
                  Subtotal
                </span>
                <span className="font-heading text-[20px]">
                  {formatINR(subtotal)}
                </span>
              </div>
              <div className="flex gap-2">
                <Link
                  href="/cart"
                  onClick={closeCart}
                  className="flex flex-1 items-center justify-center rounded-full border border-line px-4 py-3 text-[14px] font-bold transition-colors hover:bg-accent-100"
                >
                  View cart
                </Link>
                <CheckoutButton variant="compact" />
              </div>
            </div>
          </>
        )}
      </aside>
    </>
  );
}
