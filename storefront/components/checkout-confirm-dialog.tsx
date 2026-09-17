"use client";

import { useEffect, useState } from "react";
import { useCart } from "@/lib/cart";

// Shown once the tab regains focus after a checkout hand-off to WhatsApp
// (see CheckoutButton.beginCheckout / lib/cart.tsx's checkoutPending) — we
// can't know whether the order was actually sent, so we ask instead of
// silently clearing (or silently keeping) the basket.
export default function CheckoutConfirmDialog() {
  const { checkoutPending, resolveCheckout } = useCart();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!checkoutPending) return;
    const onVisible = () => {
      if (document.visibilityState === "visible") setOpen(true);
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [checkoutPending]);

  if (!open) return null;

  const answer = (placedOrder: boolean) => {
    resolveCheckout(placedOrder);
    setOpen(false);
  };

  return (
    <div
      className="fixed inset-0 z-[70] animate-fade"
      role="alertdialog"
      aria-modal="true"
      aria-label="Confirm your order"
    >
      <div
        className="absolute inset-0 bg-gradient-to-b from-ink/80 via-ink/70 to-accent-900/70 backdrop-blur-sm"
        aria-hidden
      />
      <div className="absolute inset-x-0 top-0 flex justify-center px-4 pt-[18vh]">
        <div className="w-full max-w-sm animate-rise rounded-[24px] bg-bg p-6 text-center shadow-lg">
          <p className="font-heading text-[20px]">Did you place your order?</p>
          <p className="mt-2 text-[14px] text-neutral-600">
            Let us know if you sent your order over on WhatsApp.
          </p>
          <div className="mt-5 flex gap-3">
            <button
              type="button"
              onClick={() => answer(false)}
              className="flex-1 cursor-pointer rounded-full border border-line px-5 py-3 text-[14px] font-bold text-accent-700 transition-colors hover:bg-accent-100"
            >
              No
            </button>
            <button
              type="button"
              onClick={() => answer(true)}
              className="flex-1 cursor-pointer rounded-full bg-sage px-5 py-3 text-[14px] font-bold text-bg transition-colors hover:bg-sage-600 active:bg-sage-700"
            >
              Yes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
