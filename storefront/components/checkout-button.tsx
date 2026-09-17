"use client";

import { useRouter } from "next/navigation";
import { useCart } from "@/lib/cart";
import { whatsappOrderUrl } from "@/lib/whatsapp";
import WhatsAppGlyph from "./whatsapp-glyph";

export default function CheckoutButton({
  variant = "full",
}: {
  variant?: "full" | "compact";
}) {
  const router = useRouter();
  const { items, beginCheckout } = useCart();
  const disabled = items.length === 0;
  const href = disabled ? undefined : whatsappOrderUrl(items);

  // The <a target="_blank"> hands off to WhatsApp on its own; we just mark
  // the order as pending (so we can ask "did you place it?" once the tab
  // is visible again — see CheckoutConfirmDialog) and send this tab back
  // to the shop instead of leaving it stranded on the now-checked-out cart.
  const handleClick = () => {
    if (disabled) return;
    beginCheckout();
    router.push("/products");
  };

  if (variant === "compact") {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        aria-disabled={disabled}
        onClick={disabled ? undefined : handleClick}
        className={`flex flex-[1.4] items-center justify-center gap-2 rounded-full bg-sage px-4 py-3 text-[14px] font-bold text-bg transition-colors hover:bg-sage-600 active:bg-sage-700 ${
          disabled ? "pointer-events-none opacity-50" : ""
        }`}
      >
        <WhatsAppGlyph className="size-4.5" />
        Order
      </a>
    );
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-disabled={disabled}
      onClick={disabled ? undefined : handleClick}
      className={`flex w-full items-center justify-center gap-2 rounded-full bg-sage px-4 py-3.5 text-[15.5px] font-bold text-bg transition-colors hover:bg-sage-600 active:bg-sage-700 ${
        disabled ? "pointer-events-none opacity-50" : ""
      }`}
    >
      <WhatsAppGlyph className="size-5" />
      Order on WhatsApp
    </a>
  );
}
