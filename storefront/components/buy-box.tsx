"use client";

import { useState } from "react";
import { useCart } from "@/lib/cart";
import { formatINR } from "@/lib/format";
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
  const { addItem } = useCart();
  const defaultVariant =
    variants.find((v) => v.is_default) ?? variants[0] ?? null;
  const [selectedId, setSelectedId] = useState<number | null>(
    defaultVariant?.id ?? null,
  );
  const [qty, setQty] = useState(1);
  const selected = variants.find((v) => v.id === selectedId) ?? null;

  if (!selected) {
    return (
      <p className="border border-line bg-cream p-4 text-soft">
        Currently unavailable.
      </p>
    );
  }

  const lowStock = selected.in_stock && selected.stock > 0 && selected.stock <= 8;

  return (
    <div className="border-2 border-ink bg-paper p-5">
      <div className="flex flex-wrap items-baseline gap-3">
        <span className="font-display text-4xl">{formatINR(selected.price)}</span>
        {selected.compare_at_price != null && (
          <>
            <s className="text-lg text-soft">
              {formatINR(selected.compare_at_price)}
            </s>
            <span className="label bg-turmeric px-2 py-1 text-ink">
              Save {formatINR(selected.compare_at_price - selected.price)}
            </span>
          </>
        )}
      </div>

      <p className="mt-1 text-sm">
        {!selected.in_stock ? (
          <span className="font-bold text-chilli">Out of stock</span>
        ) : lowStock ? (
          <span className="font-bold text-chilli">
            Only {selected.stock} left
          </span>
        ) : (
          <span className="text-leaf">In stock</span>
        )}
        <span className="ml-2 text-xs text-soft">SKU {selected.sku}</span>
      </p>

      {variants.length > 1 && (
        <fieldset className="mt-5">
          <legend className="label text-soft">Size</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {variants.map((v) => (
              <button
                key={v.id}
                type="button"
                onClick={() => {
                  setSelectedId(v.id);
                  setQty(1);
                }}
                className={`cursor-pointer border px-4 py-2 text-sm font-bold transition-colors ${
                  v.id === selected.id
                    ? "border-ink bg-ink text-paper"
                    : "border-ink/30 hover:border-ink"
                } ${!v.in_stock ? "opacity-50" : ""}`}
              >
                {v.title}
                {!v.in_stock && " · sold out"}
              </button>
            ))}
          </div>
        </fieldset>
      )}

      <div className="mt-6 flex items-center gap-4">
        <div className="inline-flex items-center gap-2">
          <button
            type="button"
            aria-label="Decrease quantity"
            onClick={() => setQty((q) => Math.max(1, q - 1))}
            className="grid size-11 cursor-pointer place-items-center border border-ink/30 hover:bg-ink hover:text-paper"
          >
            −
          </button>
          <span className="w-8 text-center font-bold">{qty}</span>
          <button
            type="button"
            aria-label="Increase quantity"
            onClick={() => setQty((q) => q + 1)}
            className="grid size-11 cursor-pointer place-items-center border border-ink/30 hover:bg-ink hover:text-paper"
          >
            +
          </button>
        </div>
        <button
          type="button"
          disabled={!selected.in_stock}
          onClick={() =>
            addItem(
              {
                variantId: selected.id,
                productId,
                productSlug,
                productName,
                variantTitle: selected.title,
                price: selected.price,
                imagePath,
              },
              qty,
            )
          }
          className="label flex-1 cursor-pointer bg-chilli py-4 text-paper transition-colors hover:bg-chilli-deep disabled:cursor-not-allowed disabled:bg-soft"
        >
          {selected.in_stock ? "Add to basket" : "Sold out"}
        </button>
      </div>
    </div>
  );
}
