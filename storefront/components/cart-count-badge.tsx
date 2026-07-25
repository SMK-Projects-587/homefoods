"use client";

import { useEffect, useState } from "react";
import { useCart } from "@/lib/cart";

// Cart-count badge. `count` is client-only (localStorage), so it must not appear
// in the server HTML. It gates on a LOCAL mount flag rather than the cart
// context's shared `hydrated`: Header/BottomNav sit behind Suspense boundaries
// (Cache Components / PPR) and can hydrate *after* CartProvider has already set
// `hydrated` true, so the shared flag rendered the badge on the client's first
// pass while the server HTML had none — a hydration mismatch. A local
// useState(false) guarantees the first client render matches the server (no
// badge); the badge then appears on the post-mount re-render.
export default function CartCountBadge({ className }: { className: string }) {
  const { count } = useCart();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted || count <= 0) return null;
  return <span className={className}>{count}</span>;
}
