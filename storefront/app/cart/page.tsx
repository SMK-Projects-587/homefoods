"use client";

import Link from "next/link";
import CatalogImage from "@/components/catalog-image";
import QtyStepper from "@/components/qty-stepper";
import { useCart } from "@/lib/cart";
import { formatINR } from "@/lib/format";

export default function CartPage() {
  const { items, hydrated, subtotal, count, setQty, removeItem, clear } =
    useCart();

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <p className="label text-chilli">Your basket</p>
      <h1 className="mt-2 font-display text-5xl">
        {count > 0 ? `${count} ${count === 1 ? "jar" : "jars"} packed` : "Cart"}
      </h1>

      {!hydrated ? null : items.length === 0 ? (
        <div className="mt-12 border border-line bg-cream p-16 text-center">
          <p className="font-display text-4xl italic">Nothing pickled yet.</p>
          <p className="mt-3 text-soft">
            The jars are waiting — go find your avakaya.
          </p>
          <Link
            href="/products"
            className="label mt-8 inline-block bg-chilli px-8 py-4 text-paper transition-colors hover:bg-chilli-deep"
          >
            Browse the pantry
          </Link>
        </div>
      ) : (
        <div className="mt-10 grid gap-10 lg:grid-cols-[2fr_1fr]">
          <div>
            <ul className="divide-y divide-line border-y border-line">
              {items.map((item) => (
                <li key={item.variantId} className="flex gap-5 py-5">
                  <Link
                    href={`/products/${item.productSlug}`}
                    className="block size-24 shrink-0 overflow-hidden border border-line"
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
                      className="font-display text-xl leading-tight hover:text-chilli"
                    >
                      {item.productName}
                    </Link>
                    <p className="text-sm text-soft">{item.variantTitle}</p>
                    <p className="mt-1 text-sm text-soft">
                      {formatINR(item.price)} each
                    </p>
                    <div className="mt-3 flex items-center gap-6">
                      <QtyStepper
                        small
                        qty={item.qty}
                        onChange={(q) => setQty(item.variantId, q)}
                      />
                      <button
                        type="button"
                        onClick={() => removeItem(item.variantId)}
                        className="label cursor-pointer text-soft transition-colors hover:text-chilli"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                  <span className="font-bold">
                    {formatINR(item.price * item.qty)}
                  </span>
                </li>
              ))}
            </ul>
            <div className="mt-4 flex justify-between">
              <Link href="/products" className="label text-chilli hover:underline">
                ← Keep shopping
              </Link>
              <button
                type="button"
                onClick={clear}
                className="label cursor-pointer text-soft transition-colors hover:text-chilli"
              >
                Empty the basket
              </button>
            </div>
          </div>

          <aside className="h-fit border-2 border-ink bg-paper p-6">
            <h2 className="font-display text-2xl">Order summary</h2>
            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-soft">Items ({count})</dt>
                <dd className="font-bold">{formatINR(subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-soft">Shipping</dt>
                <dd className="text-soft">decided on call</dd>
              </div>
            </dl>
            <div className="mt-4 flex items-baseline justify-between border-t-2 border-ink pt-4">
              <span className="label">Subtotal</span>
              <span className="font-display text-3xl">{formatINR(subtotal)}</span>
            </div>
            {/* Checkout is intentionally a no-op for now. */}
            <button
              type="button"
              className="label mt-6 w-full cursor-pointer bg-chilli py-4 text-paper transition-colors hover:bg-chilli-deep"
            >
              Checkout
            </button>
            <p className="mt-3 text-center text-xs text-soft">
              Online checkout is on its way. For now your basket lives safely
              in this browser.
            </p>
          </aside>
        </div>
      )}
    </div>
  );
}
