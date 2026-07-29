import { createContext, useState, useEffect } from "react";

export const CartContext = createContext();

export function CartProvider({ children }) {
  const [cart, setCart] = useState(() => {
    const savedCart = localStorage.getItem("clothing-cart");
    return savedCart ? JSON.parse(savedCart) : [];
  });

  useEffect(() => {
    localStorage.setItem("clothing-cart", JSON.stringify(cart));
  }, [cart]);

  // Check if item exists (match ID + size + color)
  const isMatch = (p1, p2) =>
    p1.id === p2.id &&
    p1.size_id === p2.size_id &&
    p1.color_id === p2.color_id;

  // Add item to cart or increment quantity
  const addToCart = (product) => {
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
      const newItem = {
        ...product,
        cartItemId: crypto.randomUUID(),
        quantity: product.quantity || 1,
        image_url: product.image_url || "/public/placeholder.jpg",
      };
      setCart([...cart, newItem]);
    }
  };

  // Update item quantity
  const updateQuantity = (cartItemId, delta) => {
    setCart(
      cart.map((p) =>
        p.cartItemId === cartItemId
          ? { ...p, quantity: Math.max(1, p.quantity + delta) }
          : p
      )
    );
  };

  // Remove item
  const removeFromCart = (cartItemId) => {
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
