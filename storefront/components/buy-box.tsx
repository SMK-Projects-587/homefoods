"use client";

import { useState } from "react";
import { useCart } from "@/lib/cart";
import { formatINR } from "@/lib/format";
import QtyStepper from "./qty-stepper";
import Spinner from "./spinner";
import { addDelayMs } from "@/lib/timing";
import type { VariantRow } from "@/lib/catalog";

export default function BuyBox({
  productId,
  productSlug,
  productName,
  imagePath,
  variants,
}: {
  productId: number;
  productSlug: string;
  productName: string;
  imagePath: string | null;
  variants: VariantRow[];
}) {
  const { items, addItem, setQty } = useCart();
  const defaultVariant =
    variants.find((v) => v.is_default) ?? variants[0] ?? null;
  const [selectedId, setSelectedId] = useState<number | null>(
    defaultVariant?.id ?? null,
  );
  const [adding, setAdding] = useState(false);
  const selected = variants.find((v) => v.id === selectedId) ?? null;
  const cartQty = selected
    ? items.find((i) => i.variantId === selected.id)?.qty ?? 0
    : 0;

  if (!selected) {
    return (
      <p className="rounded-lg bg-neutral-100 p-4 text-neutral-600">
        Currently unavailable.
      </p>
    );
  }

  const addToCart = () => {
    if (!selected.in_stock || adding) return;
    setAdding(true);
    // Same brief, randomised pause as the card quick-add (see
    // product-card.tsx) so both add-to-cart paths feel consistent.
    setTimeout(
      () => {
        addItem({
          variantId: selected.id,
          productId,
          productSlug,
          productName,
          variantTitle: selected.title,
          sku: selected.sku,
          price: selected.price,
          imagePath,
        });
        setAdding(false);
      },
      addDelayMs(),
    );
  };

  return (
    <>
      <p className="text-[13px] font-bold uppercase tracking-wide text-neutral-600">
        Pack size
      </p>
      <div className="mt-2 grid grid-cols-3 gap-2">
        {variants.map((v) => {
          const active = v.id === selected.id;
          return (
            <button
              key={v.id}
              type="button"
              onClick={() => setSelectedId(v.id)}
              className={`rounded-md px-2 py-3 text-center transition-colors ${
                active
                  ? "border-2 border-accent bg-accent-100 text-accent-800"
                  : "border-[1.5px] border-neutral-300 bg-neutral-100 hover:border-neutral-400"
              } ${!v.in_stock ? "opacity-50" : ""}`}
            >
              <span className="block text-[15px] font-bold">{v.title}</span>
              <span className="block text-[13px] text-neutral-600">
                {formatINR(v.price)}
                {!v.in_stock && " · sold out"}
              </span>
            </button>
          );
        })}
      </div>

      {/* Price on the left, one action on the right — the button doubles as
          the qty counter once this variant's in the basket, same pattern as
          product-card.tsx, so there's a single control instead of two. */}
      <div className="mt-4 flex items-center justify-between gap-3">
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
          <span className="font-heading text-[24px] tabular-nums lg:text-[30px]">
            {formatINR(selected.price)}
          </span>
          {selected.compare_at_price != null && selected.in_stock && (
            <s className="text-[13px] text-neutral-500 lg:text-[15px]">
              {formatINR(selected.compare_at_price)}
            </s>
          )}
        </div>

        {!selected.in_stock ? (
          <button
            type="button"
            disabled
            className="rounded-lg bg-neutral-400 px-5 py-3 text-center text-[14px] font-bold text-bg"
          >
            Sold out
          </button>
        ) : cartQty > 0 ? (
          <div className="flex items-center justify-center rounded-lg border-2 border-accent p-0.5">
            <QtyStepper
              qty={cartQty}
              onChange={(q) => setQty(selected.id, q)}
              className="bg-transparent"
            />
          </div>
        ) : (
          <button
            type="button"
            disabled={adding}
            onClick={addToCart}
            className="flex items-center justify-center gap-2 rounded-lg border-2 border-accent px-5 py-3 text-center text-[14px] font-bold text-accent-700 transition-colors hover:bg-accent-100 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {adding ? <Spinner /> : "Add to cart"}
          </button>
        )}
      </div>
    </>
  );
}
