"use client";

import { useState } from "react";
import Link from "next/link";
import CatalogImage from "./catalog-image";
import MarqueeText from "./marquee-text";
import QtyStepper from "./qty-stepper";
import VariantDrawer from "./variant-drawer";
import Spinner from "./spinner";
import { useCart } from "@/lib/cart";
import { addDelayMs } from "@/lib/timing";
import { formatINR } from "@/lib/format";
import type { ProductCardData } from "@/lib/catalog";

export default function ProductCard({ product }: { product: ProductCardData }) {
  const { items, addItem, setQty } = useCart();
  const dv = product.defaultVariant;
  const soldOut = !product.inStock;
  const multiSize = (product.variantCount ?? 1) > 1;
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [adding, setAdding] = useState(false);

  // Single-variant products: the stepper tracks that one SKU directly.
  const cartItem = items.find((i) => i.productId === product.id);
  // Multi-size products: a shopper can have several sizes in the basket at
  // once, each with its own counter inside the drawer — the card just shows
  // the combined total and reopens the drawer to adjust any of them.
  const cartQty = items
    .filter((i) => i.productId === product.id)
    .reduce((n, i) => n + i.qty, 0);
  const anyInStock = product.variants.some((v) => v.inStock);

  const quickAdd = () => {
    if (!dv || adding) return;
    setAdding(true);
    // A brief, randomised pause + spinner so the add reads as a real step
    // rather than an instant, web-app-y flicker.
    setTimeout(
      () => {
        addItem({
          variantId: dv.id,
          productId: product.id,
          productSlug: product.slug,
          productName: product.name,
          variantTitle: dv.title,
          sku: dv.sku,
          price: dv.price,
          imagePath: product.imagePath,
        });
        setAdding(false);
      },
      addDelayMs(),
    );
  };

  return (
    <div className="group relative flex flex-col rounded-lg bg-neutral-100 p-2.5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md">
      <Link
        href={`/products/${product.slug}`}
        className="block focus-visible:outline-none"
      >
        <div className="relative aspect-square overflow-hidden rounded-[14px] bg-surface">
          <CatalogImage
            path={product.imagePath}
            alt={product.name}
            name={product.name}
            className="washed size-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          {soldOut && (
            <span className="label absolute left-2 top-2 rounded-full bg-ink/85 px-2.5 py-1 text-[10px] text-bg">
              Sold out
            </span>
          )}
          {!soldOut && product.compareAtPrice != null && (
            <span className="label absolute left-2 top-2 rounded-full bg-accent px-2.5 py-1 text-[10px] text-bg">
              Offer
            </span>
          )}
        </div>
        <div className="px-1 pt-3">
          <h3 className="font-body text-[14.5px] font-bold leading-snug">
            <MarqueeText text={product.name} />
          </h3>
          {product.nativeName && (
            <p className="telugu mt-0.5 text-[12.5px] text-accent-700">
              {product.nativeName}
            </p>
          )}
        </div>
      </Link>

      <div className="mt-auto flex items-end justify-between gap-2 px-1 pt-2">
        <span className="text-[13.5px] font-bold">
          {product.price != null ? (
            <>
              {multiSize && (
                <span className="mr-1 text-[11px] font-semibold text-neutral-600">
                  From
                </span>
              )}
              {formatINR(product.price)}
            </>
          ) : (
            <span className="text-neutral-500">—</span>
          )}
        </span>

        {soldOut ? (
          <span className="label grid h-[34px] place-items-center rounded-full px-3 text-[10px] text-neutral-500">
            Out
          </span>
        ) : multiSize ? (
          anyInStock ? (
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              aria-label={
                cartQty > 0
                  ? `${cartQty} in basket — edit ${product.name}`
                  : `Add ${product.name} to basket`
              }
              className={
                cartQty > 0
                  ? "flex h-[34px] shrink-0 items-center gap-1 rounded-full bg-accent pl-3 pr-2 text-[13px] font-bold text-bg transition-colors hover:bg-accent-600"
                  : "grid size-[34px] shrink-0 cursor-pointer place-items-center rounded-full bg-accent text-bg transition-colors hover:bg-accent-600 active:bg-accent-700"
              }
            >
              {cartQty > 0 ? (
                <>
                  {cartQty}
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.75"
                    strokeLinecap="round"
                    className="size-3.5"
                  >
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                </>
              ) : (
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.75"
                  strokeLinecap="round"
                  className="size-4"
                >
                  <path d="M12 5v14M5 12h14" />
                </svg>
              )}
            </button>
          ) : (
            <span className="label grid h-[34px] place-items-center rounded-full px-3 text-[10px] text-neutral-500">
              Out
            </span>
          )
        ) : cartItem ? (
          <QtyStepper
            small
            qty={cartItem.qty}
            onChange={(q) => setQty(cartItem.variantId, q)}
          />
        ) : dv ? (
          <button
            type="button"
            onClick={quickAdd}
            disabled={adding}
            aria-label={`Add ${product.name} to basket`}
            className="grid size-[34px] shrink-0 cursor-pointer place-items-center rounded-full bg-accent text-bg transition-colors hover:bg-accent-600 active:bg-accent-700 disabled:cursor-wait"
          >
            {adding ? (
              <Spinner className="size-3.5" />
            ) : (
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.75"
                strokeLinecap="round"
                className="size-4"
              >
                <path d="M12 5v14M5 12h14" />
              </svg>
            )}
          </button>
        ) : (
          <Link
            href={`/products/${product.slug}`}
            aria-label={`View ${product.name}`}
            className="grid size-[34px] shrink-0 place-items-center rounded-full bg-accent-100 text-accent-800 transition-colors hover:bg-accent-200"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="size-4"
            >
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </Link>
        )}
      </div>

      {drawerOpen && (
        <VariantDrawer product={product} onClose={() => setDrawerOpen(false)} />
      )}
    </div>
  );
}
