"use client";

import { useSyncExternalStore } from "react";
import { useCart } from "@/lib/cart";

// Never changes, so the subscription is a permanent no-op — this is only
// here to give useSyncExternalStore something to call.
const subscribe = () => () => {};

// Cart-count badge. `count` is client-only (localStorage), so it must not appear
// in the server HTML. It gates on a LOCAL mount flag rather than the cart
// context's shared `hydrated`: Header/BottomNav sit behind Suspense boundaries
// (Cache Components / PPR) and can hydrate *after* CartProvider has already set
// `hydrated` true, so the shared flag rendered the badge on the client's first
// pass while the server HTML had none — a hydration mismatch.
// useSyncExternalStore's server snapshot (false) is guaranteed to match the
// first client render, then it flips to the client snapshot (true) on the
// post-mount re-render — the same effect as a mount-flag useState, but
// without setState-in-effect.
export default function CartCountBadge({ className }: { className: string }) {
  const { count } = useCart();
  const mounted = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
  if (!mounted || count <= 0) return null;
  return <span className={className}>{count}</span>;
}
