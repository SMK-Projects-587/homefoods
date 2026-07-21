"use client";

import Link from "next/link";
import CatalogImage from "./catalog-image";
import { useCart } from "@/lib/cart";
import { formatINR } from "@/lib/format";
import type { ProductCardData } from "@/lib/catalog";

export default function ProductCard({ product }: { product: ProductCardData }) {
  const { addItem } = useCart();
  const dv = product.defaultVariant;
  const soldOut = !product.inStock;
  const multiSize = (product.variantCount ?? 1) > 1;

  const quickAdd = () => {
    if (!dv) return;
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
            {product.name}
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
        ) : dv ? (
          <button
            type="button"
            onClick={quickAdd}
            aria-label={`Add ${product.name} to basket`}
            className="grid size-[34px] shrink-0 cursor-pointer place-items-center rounded-full bg-accent text-bg transition-colors hover:bg-accent-600 active:bg-accent-700"
          >
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
    </div>
  );
}
