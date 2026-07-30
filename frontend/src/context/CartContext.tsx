import { createContext, useState, useEffect, ReactNode } from "react";
import { CartItem } from "../types";

// --------------- Types ---------------

interface CartContextType {
  cart: CartItem[];
  setCart: React.Dispatch<React.SetStateAction<CartItem[]>>;
  addToCart: (product: CartItem) => void;
  updateQuantity: (cartItemId: string, delta: number) => void;
  removeFromCart: (cartItemId: string) => void;
  clearCart: () => void;
}

interface CartProviderProps {
  children: ReactNode;
}

// --------------- Context ---------------

export const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: CartProviderProps) {
  const [cart, setCart] = useState<CartItem[]>(() => {
    const savedCart = localStorage.getItem("clothing-cart");
    return savedCart ? JSON.parse(savedCart) : [];
  });

  useEffect(() => {
    localStorage.setItem("clothing-cart", JSON.stringify(cart));
  }, [cart]);

  // Check if item exists (match ID + size + color)
  const isMatch = (p1: CartItem, p2: CartItem) =>
    p1.id === p2.id &&
    p1.size_id === p2.size_id &&
    p1.color_id === p2.color_id;

  // Add item to cart or increment quantity
  const addToCart = (product: CartItem) => {
    const existing = cart.find((item) => isMatch(item, product));

    if (existing) {
      setCart(
        cart.map((item) =>
          isMatch(item, product)
            ? { ...item, quantity: item.quantity + (product.quantity || 1) }
            : item
        )
      );
    } else {
      const newItem: CartItem = {
        ...product,
        cartItemId: crypto.randomUUID(),
        quantity: product.quantity || 1,
        image_url: product.image_url || "/public/placeholder.jpg",
      };
      setCart([...cart, newItem]);
    }
  };

  // Update item quantity
  const updateQuantity = (cartItemId: string, delta: number) => {
    setCart(
      cart.map((p) =>
        p.cartItemId === cartItemId
          ? { ...p, quantity: Math.max(1, p.quantity + delta) }
          : p
      )
    );
  };

  // Remove item
  const removeFromCart = (cartItemId: string) => {
    setCart(cart.filter((p) => p.cartItemId !== cartItemId));
  };

  const clearCart = () => {
    setCart([]);
    localStorage.removeItem("clothing-cart");
  };

  return (
    <CartContext.Provider
      value={{ cart, setCart, addToCart, updateQuantity, removeFromCart, clearCart }}
    >
      {children}
    </CartContext.Provider>
  );
}
