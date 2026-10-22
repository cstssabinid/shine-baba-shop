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
import type { Product } from "@/lib/catalog";
import type { CatalogCategory } from "@/lib/catalog-data";

export type CartLine = {
  slug: string;
  option?: string;
  quantity: number;
};

type CartContextValue = {
  products: Product[];
  categories: CatalogCategory[];
  items: CartLine[];
  itemCount: number;
  subtotal: number;
  ready: boolean;
  addItem: (slug: string, option?: string) => boolean;
  setQuantity: (slug: string, option: string | undefined, quantity: number) => void;
  removeItem: (slug: string, option?: string) => void;
  clearCart: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);
const storageKey = "shine-baba-shop-cart-v1";

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartLine[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<CatalogCategory[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let mounted = true;
    const refreshCatalog = async () => {
      try {
        const response = await fetch("/api/catalog", { cache: "no-store" });
        if (!response.ok) return;
        const catalog = await response.json() as { products?: Product[]; categories?: CatalogCategory[] };
        if (mounted) {
          setProducts(Array.isArray(catalog.products) ? catalog.products : []);
          setCategories(Array.isArray(catalog.categories) ? catalog.categories : []);
        }
      } catch {
        // Keep the last known catalog. Order submission checks stock on the server.
      }
    };
    const load = async () => {
      await refreshCatalog();
      try {
        const saved = window.localStorage.getItem(storageKey);
        if (saved) {
          const parsed = JSON.parse(saved) as CartLine[];
          if (mounted && Array.isArray(parsed)) {
            setItems(parsed.filter((line) => typeof line.slug === "string" && (line.option === undefined || typeof line.option === "string") && Number.isInteger(line.quantity) && line.quantity > 0));
          }
        }
      } catch {
        if (mounted) setItems([]);
      } finally {
        if (mounted) setReady(true);
      }
    };
    void load();
    const refreshInterval = window.setInterval(() => { void refreshCatalog(); }, 30_000);
    const onFocus = () => { void refreshCatalog(); };
    const onVisibilityChange = () => { if (document.visibilityState === "visible") void refreshCatalog(); };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      mounted = false;
      window.clearInterval(refreshInterval);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
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
    const product = products.find((entry) => entry.slug === slug);
    const variant = product?.variants?.find((entry) => entry.label === (option ?? "Default")) ?? product?.variants?.[0];
    if (!product || !variant || variant.stockQuantity === null) return false;
    const quantityInCart = items.find((item) => item.slug === slug && item.option === option)?.quantity ?? 0;
    if (quantityInCart >= variant.stockQuantity) return false;
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
    return true;
  }, [items, products]);

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
      const variant = product?.variants?.find((entry) => entry.label === (item.option ?? "Default")) ?? product?.variants?.[0];
      return sum + (variant?.price ?? product?.price ?? 0) * item.quantity;
    }, 0);

    return { items, products, categories, itemCount, subtotal, ready, addItem, setQuantity, removeItem, clearCart };
  }, [items, products, categories, ready, addItem, setQuantity, removeItem, clearCart]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used inside CartProvider");
  return context;
}
