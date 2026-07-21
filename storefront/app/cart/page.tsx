"use client";

import Link from "next/link";
import CatalogImage from "@/components/catalog-image";
import QtyStepper from "@/components/qty-stepper";
import CheckoutButton from "@/components/checkout-button";
import { useCart } from "@/lib/cart";
import { formatINR } from "@/lib/format";

export default function CartPage() {
  const { items, hydrated, subtotal, count, setQty, removeItem } = useCart();

  return (
    <div className="mx-auto max-w-[720px] px-4 py-8 sm:px-[22px] sm:py-10">
      <h1 className="font-heading text-[30px]">Your basket</h1>

      {!hydrated ? null : items.length === 0 ? (
        <div className="mt-10 flex flex-col items-center gap-3 rounded-lg bg-neutral-100 p-12 text-center">
          <span className="grid size-[72px] place-items-center rounded-full bg-accent-100 text-accent-700">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-8">
              <circle cx="9" cy="20" r="1.4" />
              <circle cx="18" cy="20" r="1.4" />
              <path d="M2.5 3h2l2.2 12.2a1.6 1.6 0 0 0 1.6 1.3h8.4a1.6 1.6 0 0 0 1.6-1.3L21 7H6" />
            </svg>
          </span>
          <p className="font-heading text-[21px]">Your basket is empty</p>
          <p className="text-[14px] text-neutral-600">
            Go find your avakaya — the jars are waiting.
          </p>
          <Link
            href="/products"
            className="mt-2 rounded-full bg-accent px-6 py-3 text-[14px] font-bold text-bg transition-colors hover:bg-accent-600"
          >
            Start shopping
          </Link>
        </div>
      ) : (
        <div className="mt-6 space-y-6">
          <ul className="space-y-3">
            {items.map((item) => (
              <li
                key={item.variantId}
                className="flex gap-3 rounded-lg bg-neutral-100 p-3 shadow-sm"
              >
                <Link
                  href={`/products/${item.productSlug}`}
                  className="block size-[54px] shrink-0 overflow-hidden rounded-[12px] bg-surface"
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
                      className="text-[14.5px] font-bold leading-tight hover:text-accent-700"
                    >
                      {item.productName}
                    </Link>
                    <span className="shrink-0 text-[15px] font-bold">
                      {formatINR(item.price * item.qty)}
                    </span>
                  </div>
                  <p className="text-[12.5px] text-neutral-600">
                    {item.variantTitle} · {formatINR(item.price)}
                  </p>
                  <div className="mt-2 flex items-center gap-4">
                    <QtyStepper
                      small
                      qty={item.qty}
                      onChange={(q) => setQty(item.variantId, q)}
                    />
                    <button
                      type="button"
                      onClick={() => removeItem(item.variantId)}
                      className="cursor-pointer text-[13px] font-semibold text-neutral-500 transition-colors hover:text-accent-700"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          <div className="rounded-lg bg-neutral-100 p-[18px] shadow-sm">
            <div className="flex justify-between text-[14px]">
              <span className="text-neutral-600">Items ({count})</span>
              <span className="font-semibold">{formatINR(subtotal)}</span>
            </div>
            <div className="my-3 h-px bg-neutral-200" />
            <div className="flex items-baseline justify-between">
              <span className="text-[17px] font-bold">Total</span>
              <span className="font-heading text-[22px]">
                {formatINR(subtotal)}
              </span>
            </div>
            <div className="mt-4">
              <CheckoutButton />
            </div>
            <p className="mt-2 text-center text-[12px] text-neutral-500">
              Opens WhatsApp with your order pre-filled. Delivery &amp; payment
              confirmed there.
            </p>
          </div>

          <Link
            href="/products"
            className="inline-block text-[14px] font-bold text-accent-700 hover:underline"
          >
            ← Keep shopping
          </Link>
        </div>
      )}
    </div>
  );
}
