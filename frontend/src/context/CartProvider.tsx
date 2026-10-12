import { useState, useEffect, type ReactNode } from "react";
import type { CartItem } from "../types";
import { CartContext } from "./CartContext";

interface CartProviderProps {
  children: ReactNode;
}

const readSavedCart = (): CartItem[] => {
  try {
    const savedCart = localStorage.getItem("clothing-cart");
    if (!savedCart) return [];
    const parsed: unknown = JSON.parse(savedCart);
    if (!Array.isArray(parsed)) return [];
    return parsed.flatMap((value): CartItem[] => {
      if (!value || typeof value !== "object") return [];
      const item = value as Partial<CartItem>;
      const id = Number(item.id);
      const quantity = Number(item.quantity);
      const price = Number(item.price);
      if (
        !Number.isInteger(id) || id <= 0 ||
        !Number.isInteger(quantity) || quantity <= 0 ||
        !Number.isFinite(price) || price < 0 ||
        typeof item.name !== "string"
      ) return [];
      return [{
        ...item,
        id,
        quantity,
        price,
        cartItemId: typeof item.cartItemId === "string" && item.cartItemId.trim()
          ? item.cartItemId
          : crypto.randomUUID(),
      } as CartItem];
    });
  } catch {
    // A malformed localStorage value must not break every page that uses the cart.
    try { localStorage.removeItem("clothing-cart"); } catch { /* Storage may be unavailable. */ }
    return [];
  }
};

const hasKnownStock = (stock: unknown): stock is number =>
  typeof stock === "number" && Number.isFinite(stock);

const stockLimit = (stock: unknown): number =>
  hasKnownStock(stock) ? Math.max(0, Math.floor(stock)) : 99;

const isMatch = (p1: CartItem, p2: CartItem) =>
  p1.id === p2.id &&
  p1.size_id === p2.size_id &&
  p1.color_id === p2.color_id;

export function CartProvider({ children }: CartProviderProps) {
  const [cart, setCart] = useState<CartItem[]>(readSavedCart);

  useEffect(() => {
    localStorage.setItem("clothing-cart", JSON.stringify(cart));
  }, [cart]);

  const addToCart = (product: CartItem) => {
    setCart((previousCart) => {
      const existing = previousCart.find((item) => isMatch(item, product));
      const effectiveStock = hasKnownStock(product.stock) ? product.stock : existing?.stock;
      const maxStock = stockLimit(effectiveStock);

      // Preserve an existing line so the customer can remove it, but never add
      // a new unavailable item or increase the quantity when stock is zero.
      if (hasKnownStock(effectiveStock) && effectiveStock <= 0) {
        return existing
          ? previousCart.map((item) => isMatch(item, product) ? { ...item, stock: 0 } : item)
          : previousCart;
      }

      if (existing) {
        return previousCart.map((item) => {
          if (!isMatch(item, product)) return item;
          const nextQuantity = item.quantity + (product.quantity || 1);
          return {
            ...item,
            stock: hasKnownStock(product.stock) ? product.stock : item.stock,
            quantity: Math.min(nextQuantity, maxStock),
          };
        });
      }

      if (maxStock <= 0) return previousCart;
      const newItem: CartItem = {
        ...product,
        cartItemId: product.cartItemId || crypto.randomUUID(),
        quantity: Math.min(product.quantity || 1, maxStock),
        image_url: product.image_url || "/public/placeholder.jpg",
      };
      return [...previousCart, newItem];
    });
  };

  const updateQuantity = (cartItemId: string, delta: number) => {
    setCart((previousCart) => previousCart.map((item) => {
      if (item.cartItemId !== cartItemId) return item;
      if (hasKnownStock(item.stock) && item.stock <= 0) return item;
      const maxStock = stockLimit(item.stock);
      return { ...item, quantity: Math.min(Math.max(1, item.quantity + delta), maxStock) };
    }));
  };

  const setItemQuantity = (cartItemId: string, quantity: number) => {
    setCart((previousCart) => previousCart.map((item) => {
      if (item.cartItemId !== cartItemId) return item;
      if (hasKnownStock(item.stock) && item.stock <= 0) return item;
      const maxStock = stockLimit(item.stock);
      const validQuantity = Number.isFinite(quantity) ? Math.floor(quantity) : 1;
      return { ...item, quantity: Math.min(Math.max(1, validQuantity), maxStock) };
    }));
  };

  const removeFromCart = (cartItemId: string) => {
    setCart((previousCart) => previousCart.filter((item) => item.cartItemId !== cartItemId));
  };

  const clearCart = () => {
    setCart([]);
    localStorage.removeItem("clothing-cart");
  };

  return (
    <CartContext.Provider
      value={{ cart, setCart, addToCart, updateQuantity, setItemQuantity, removeFromCart, clearCart }}
    >
      {children}
    </CartContext.Provider>
  );
}
