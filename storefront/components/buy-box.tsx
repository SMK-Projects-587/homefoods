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
  const selected = variants.find((v) => v.id === selectedId) ?? null;

  if (!selected) {
    return (
      <p className="rounded-lg bg-neutral-100 p-4 text-neutral-600">
        Currently unavailable.
      </p>
    );
  }

  const addToCart = () => {
    if (!selected.in_stock) return;
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
  };

  const AddBar = ({ fixed }: { fixed?: boolean }) => (
    <div
      className={`flex items-center gap-2 rounded-full bg-neutral-100 p-2 pl-5 shadow-md ${
        fixed ? "" : ""
      }`}
    >
      <span className="font-heading text-[19px]">
        {formatINR(selected.price)}
      </span>
      <button
        type="button"
        disabled={!selected.in_stock}
        onClick={addToCart}
        className="flex-1 rounded-full bg-accent px-5 py-3 text-center text-[15px] font-bold text-bg transition-colors hover:bg-accent-600 active:bg-accent-700 disabled:cursor-not-allowed disabled:bg-neutral-400"
      >
        {selected.in_stock ? "Add to cart" : "Sold out"}
      </button>
    </div>
  );

  return (
    <>
      <div>
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

        {selected.compare_at_price != null && selected.in_stock && (
          <p className="mt-3 flex items-center gap-2 text-[13px]">
            <s className="text-neutral-500">
              {formatINR(selected.compare_at_price)}
            </s>
            <span className="rounded-full bg-sage-100 px-2 py-0.5 font-bold text-sage-800">
              Save {formatINR(selected.compare_at_price - selected.price)}
            </span>
          </p>
        )}
      </div>

      {/* Desktop / inline add bar */}
      <div className="mt-5 hidden lg:block">
        <AddBar />
      </div>

      {/* Mobile: sticky add bar riding just above the bottom tab bar. */}
      <div className="fixed inset-x-0 bottom-[68px] z-30 px-4 pb-[env(safe-area-inset-bottom)] lg:hidden">
        <div className="mx-auto max-w-[1160px]">
          <AddBar fixed />
        </div>
      </div>
    </>
  );
}
