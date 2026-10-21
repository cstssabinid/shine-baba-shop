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
import { products } from "@/lib/catalog";

export type CartLine = {
  slug: string;
  option?: string;
  quantity: number;
};

type CartContextValue = {
  items: CartLine[];
  itemCount: number;
  subtotal: number;
  ready: boolean;
  addItem: (slug: string, option?: string) => void;
  setQuantity: (slug: string, option: string | undefined, quantity: number) => void;
  removeItem: (slug: string, option?: string) => void;
  clearCart: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);
const storageKey = "shine-baba-shop-cart-v1";

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartLine[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved) as CartLine[];
        if (Array.isArray(parsed)) {
          setItems(parsed.filter((line) =>
            typeof line.slug === "string" &&
            (line.option === undefined || typeof line.option === "string") &&
            Number.isInteger(line.quantity) &&
            line.quantity > 0 &&
            products.some((product) => product.slug === line.slug),
          ));
        }
      }
    } catch {
      setItems([]);
    } finally {
      setReady(true);
    }
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(items));
    } catch {
      // Keep the in-memory cart usable if browser storage is unavailable.
    }
  }, [items, ready]);

  const addItem = useCallback((slug: string, option?: string) => {
    setItems((current) => {
      const existing = current.find((item) => item.slug === slug && item.option === option);
      if (existing) {
        return current.map((item) =>
          item.slug === slug && item.option === option
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        );
      }
      return [...current, { slug, option, quantity: 1 }];
    });
  }, []);

  const setQuantity = useCallback((slug: string, option: string | undefined, quantity: number) => {
    const safeQuantity = Math.max(1, Math.min(99, Math.floor(quantity) || 1));
    setItems((current) => current.map((item) =>
      item.slug === slug && item.option === option
        ? { ...item, quantity: safeQuantity }
        : item,
    ));
  }, []);

  const removeItem = useCallback((slug: string, option?: string) => {
    setItems((current) => current.filter((item) => !(item.slug === slug && item.option === option)));
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  const value = useMemo(() => {
    const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
    const subtotal = items.reduce((sum, item) => {
      const product = products.find((entry) => entry.slug === item.slug);
      return sum + (product?.price ?? 0) * item.quantity;
    }, 0);

    return { items, itemCount, subtotal, ready, addItem, setQuantity, removeItem, clearCart };
  }, [items, ready, addItem, setQuantity, removeItem, clearCart]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used inside CartProvider");
  return context;
}
