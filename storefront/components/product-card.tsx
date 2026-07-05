import Link from "next/link";
import CatalogImage from "./catalog-image";
import { formatINR } from "@/lib/format";
import type { ProductCardData } from "@/lib/catalog";

export default function ProductCard({ product }: { product: ProductCardData }) {
  return (
    <Link
      href={`/products/${product.slug}`}
      className="group block border border-line bg-paper transition-all duration-300 hover:-translate-y-1 hover:border-ink/40 hover:shadow-[6px_6px_0_0_var(--color-cream)]"
    >
      <div className="relative aspect-square overflow-hidden border-b border-line bg-cream">
        <CatalogImage
          path={product.imagePath}
          alt={product.name}
          name={product.name}
          className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        {!product.inStock && (
          <span className="label absolute left-3 top-3 bg-ink px-2 py-1 text-paper">
            Sold out
          </span>
        )}
        {product.inStock && product.compareAtPrice != null && (
          <span className="label absolute left-3 top-3 bg-turmeric px-2 py-1 text-ink">
            Offer
          </span>
        )}
      </div>
      <div className="p-4">
        {product.categoryName && (
          <p className="label text-soft">{product.categoryName}</p>
        )}
        <h3 className="mt-1 font-display text-xl leading-snug">{product.name}</h3>
        <div className="mt-2 flex items-baseline gap-2">
          {product.price != null && (
            <span className="font-bold">{formatINR(product.price)}</span>
          )}
          {product.compareAtPrice != null && (
            <s className="text-sm text-soft">{formatINR(product.compareAtPrice)}</s>
          )}
          {product.variantCount != null && product.variantCount > 1 && (
            <span className="ml-auto text-xs text-soft">
              {product.variantCount} sizes
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
