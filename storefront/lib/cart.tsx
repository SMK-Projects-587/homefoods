"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type CartItem = {
  variantId: number;
  productId: number;
  productSlug: string;
  productName: string;
  variantTitle: string;
  sku: string;
  price: number;
  imagePath: string | null;
  qty: number;
};

type CartContextValue = {
  items: CartItem[];
  hydrated: boolean;
  count: number;
  subtotal: number;
  addItem: (item: Omit<CartItem, "qty">, qty?: number) => void;
  removeItem: (variantId: number) => void;
  setQty: (variantId: number, qty: number) => void;
  clear: () => void;
  checkoutPending: boolean;
  beginCheckout: () => void;
  resolveCheckout: (placedOrder: boolean) => void;
};

const CartContext = createContext<CartContextValue | null>(null);

// v2 adds `sku` to line items (used by the WhatsApp order message).
const STORAGE_KEY = "homefoods:cart:v2";
// Set right before we hand off to WhatsApp so it survives the tab losing
// focus (backgrounded app, real new tab, or a hard navigation on some
// mobile browsers) — read back once the tab is visible again to ask
// whether the order actually went through before clearing the basket.
const CHECKOUT_PENDING_KEY = "homefoods:checkout-pending";

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [checkoutPending, setCheckoutPending] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        // One-time hydration from localStorage after mount — the server
        // renders an empty cart, so this cannot run during render.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        if (Array.isArray(parsed)) setItems(parsed);
      }
      if (window.localStorage.getItem(CHECKOUT_PENDING_KEY) === "1") {
        setCheckoutPending(true);
      }
    } catch {
      // corrupt storage — start with an empty cart
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items, hydrated]);

  const addItem = useCallback(
    (item: Omit<CartItem, "qty">, qty = 1) => {
      setItems((prev) => {
        const existing = prev.find((i) => i.variantId === item.variantId);
        if (existing) {
          return prev.map((i) =>
            i.variantId === item.variantId ? { ...i, qty: i.qty + qty } : i,
          );
        }
        return [...prev, { ...item, qty }];
      });
    },
    [],
  );

  const removeItem = useCallback((variantId: number) => {
    setItems((prev) => prev.filter((i) => i.variantId !== variantId));
  }, []);

  const setQty = useCallback((variantId: number, qty: number) => {
    setItems((prev) =>
      qty <= 0
        ? prev.filter((i) => i.variantId !== variantId)
        : prev.map((i) => (i.variantId === variantId ? { ...i, qty } : i)),
    );
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const beginCheckout = useCallback(() => {
    window.localStorage.setItem(CHECKOUT_PENDING_KEY, "1");
    setCheckoutPending(true);
  }, []);

  const resolveCheckout = useCallback(
    (placedOrder: boolean) => {
      window.localStorage.removeItem(CHECKOUT_PENDING_KEY);
      setCheckoutPending(false);
      if (placedOrder) clear();
    },
    [clear],
  );

  const { count, subtotal } = useMemo(
    () => ({
      count: items.reduce((n, i) => n + i.qty, 0),
      subtotal: items.reduce((sum, i) => sum + i.price * i.qty, 0),
    }),
    [items],
  );

  const value = useMemo(
    () => ({
      items,
      hydrated,
      count,
      subtotal,
      addItem,
      removeItem,
      setQty,
      clear,
      checkoutPending,
      beginCheckout,
      resolveCheckout,
    }),
    [
      items,
      hydrated,
      count,
      subtotal,
      addItem,
      removeItem,
      setQty,
      clear,
      checkoutPending,
      beginCheckout,
      resolveCheckout,
    ],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside <CartProvider>");
  return ctx;
}
