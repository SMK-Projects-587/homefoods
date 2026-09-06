"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useCart } from "@/lib/cart";
import { formatINR } from "@/lib/format";
import CatalogImage from "./catalog-image";
import QtyStepper from "./qty-stepper";
import Spinner from "./spinner";
import { addDelayMs } from "@/lib/timing";
import type { ProductCardData } from "@/lib/catalog";

// Variant picker opened from a product card's quick-add button: a bottom
// sheet on mobile, a centered modal from `lg:` up. Each pack size is its own
// live row with its own counter — bound straight to the cart — so a shopper
// can bump one size and start another without leaving the sheet. Rendered
// via a portal straight onto <body> — nested inside the card it would
// inherit the card's `hover:-translate-y-1`, which opens a new CSS
// containing block on hover and breaks `fixed` positioning. No SSR guard is
// needed for the portal target: this component only ever mounts client-side,
// in response to a click, so `document` is always available by then.
export default function VariantDrawer({
  product,
  onClose,
}: {
  product: ProductCardData;
  onClose: () => void;
}) {
  const { items, addItem, setQty } = useCart();
  const [addingId, setAddingId] = useState<number | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const qtyFor = (variantId: number) =>
    items.find((i) => i.variantId === variantId)?.qty ?? 0;

  const addVariant = (v: ProductCardData["variants"][number]) => {
    if (!v.inStock || addingId != null) return;
    setAddingId(v.id);
    // A brief, randomised pause + spinner so an add reads as a real network
    // step rather than a flicker — see product-card.tsx for the same delay.
    setTimeout(
      () => {
        addItem(
          {
            variantId: v.id,
            productId: product.id,
            productSlug: product.slug,
            productName: product.name,
            variantTitle: v.title,
            sku: v.sku,
            price: v.price,
            imagePath: product.imagePath,
          },
          1,
        );
        setAddingId(null);
      },
      addDelayMs(),
    );
  };

  return createPortal(
    <>
      <div
        aria-hidden
        onClick={onClose}
        className="fixed inset-0 z-50 animate-fade bg-neutral-900/45"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Choose a size for ${product.name}`}
        className="fixed inset-x-0 bottom-0 z-50 flex max-h-[80vh] flex-col rounded-t-[20px] bg-bg shadow-lg animate-slide-up lg:inset-0 lg:m-auto lg:h-fit lg:max-h-[85vh] lg:w-[420px] lg:animate-rise lg:rounded-[18px]"
      >
        <div className="flex justify-center pt-2.5 lg:hidden">
          <span className="h-1.5 w-10 rounded-full bg-neutral-300" />
        </div>

        <div className="flex items-center gap-3 px-5 pt-3 lg:pt-5">
          <span className="block size-12 shrink-0 overflow-hidden rounded-[10px] bg-surface">
            <CatalogImage
              path={product.imagePath}
              alt=""
              name={product.name}
              preset="thumb"
              className="washed size-full object-cover"
            />
          </span>
          <div className="min-w-0">
            <p className="truncate font-bold leading-tight">{product.name}</p>
            {product.nativeName && (
              <p className="telugu text-[12.5px] text-accent-700">
                {product.nativeName}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="ml-auto grid size-8 shrink-0 place-items-center rounded-full text-neutral-500 transition-colors hover:bg-neutral-200 hover:text-ink"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              className="size-4"
            >
              <path d="M6 6l12 12M18 6 6 18" />
            </svg>
          </button>
        </div>

        <div className="overflow-y-auto px-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] pt-4 lg:pb-5">
          <p className="text-[13px] font-bold uppercase tracking-wide text-neutral-600">
            Pack size
          </p>
          <ul className="mt-2 space-y-2">
            {product.variants.map((v) => {
              const qty = qtyFor(v.id);
              return (
                <li
                  key={v.id}
                  className={`flex items-center justify-between gap-3 rounded-md border-[1.5px] px-3 py-2.5 transition-colors ${
                    qty > 0
                      ? "border-accent bg-accent-100"
                      : "border-neutral-300 bg-neutral-100"
                  } ${!v.inStock ? "opacity-50" : ""}`}
                >
                  <div className="min-w-0">
                    <p className="text-[15px] font-bold">{v.title}</p>
                    <p className="text-[13px] text-neutral-600">
                      {formatINR(v.price)}
                      {!v.inStock && " · sold out"}
                    </p>
                  </div>
                  {!v.inStock ? (
                    <span className="label shrink-0 text-neutral-500">
                      Sold out
                    </span>
                  ) : qty > 0 ? (
                    <QtyStepper
                      small
                      qty={qty}
                      onChange={(q) => setQty(v.id, q)}
                    />
                  ) : (
                    <button
                      type="button"
                      disabled={addingId != null}
                      onClick={() => addVariant(v)}
                      className="flex h-[34px] shrink-0 items-center justify-center gap-1.5 rounded-full border border-accent px-4 text-[13px] font-bold text-accent-700 transition-colors hover:bg-accent-200 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {addingId === v.id ? <Spinner className="size-3.5" /> : "Add"}
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </>,
    document.body,
  );
}
