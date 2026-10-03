import { useState, useEffect, ReactNode } from "react";
import { CartItem } from "../types";
import { CartContext } from "./CartContext";

interface CartProviderProps {
  children: ReactNode;
}

export function CartProvider({ children }: CartProviderProps) {
  const [cart, setCart] = useState<CartItem[]>(() => {
    const savedCart = localStorage.getItem("clothing-cart");
    return savedCart ? JSON.parse(savedCart) : [];
  });

  useEffect(() => {
    localStorage.setItem("clothing-cart", JSON.stringify(cart));
  }, [cart]);

  const isMatch = (p1: CartItem, p2: CartItem) =>
    p1.id === p2.id &&
    p1.size_id === p2.size_id &&
    p1.color_id === p2.color_id;

  const addToCart = (product: CartItem) => {
    const existing = cart.find((item) => isMatch(item, product));

    if (existing) {
      setCart(
        cart.map((item) => {
          if (isMatch(item, product)) {
            const maxStock = product.stock || item.stock || 99;
            return { ...item, quantity: Math.min(item.quantity + (product.quantity || 1), maxStock) };
          }
          return item;
        })
      );
    } else {
      const maxStock = product.stock || 99;
      const newItem: CartItem = {
        ...product,
        cartItemId: crypto.randomUUID(),
        quantity: Math.min(product.quantity || 1, maxStock),
        image_url: product.image_url || "/public/placeholder.jpg",
      };
      setCart([...cart, newItem]);
    }
  };

  const updateQuantity = (cartItemId: string, delta: number) => {
    setCart(
      cart.map((p) => {
        if (p.cartItemId === cartItemId) {
          const maxStock = p.stock || 99;
          return { ...p, quantity: Math.min(Math.max(1, p.quantity + delta), maxStock) };
        }
        return p;
      })
    );
  };

  const setItemQuantity = (cartItemId: string, quantity: number) => {
    setCart(
      cart.map((p) => {
        if (p.cartItemId === cartItemId) {
          const maxStock = p.stock || 99;
          return { ...p, quantity: Math.min(Math.max(1, quantity), maxStock) };
        }
        return p;
      })
    );
  };

  const removeFromCart = (cartItemId: string) => {
    setCart(cart.filter((p) => p.cartItemId !== cartItemId));
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
