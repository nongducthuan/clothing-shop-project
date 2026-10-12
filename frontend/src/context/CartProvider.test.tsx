// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { useContext } from 'react';
import { CartContext } from './CartContext';
import { CartProvider } from './CartProvider';
import type { CartItem } from '../types';

const makeCartItem = (overrides: Partial<CartItem> = {}): CartItem => ({
  cartItemId: 'line-1',
  id: 7,
  name: 'Cotton shirt',
  price: 100_000,
  quantity: 1,
  size_id: 2,
  color_id: 3,
  stock: 5,
  ...overrides,
});

function useCartContext() {
  const context = useContext(CartContext);
  if (!context) throw new Error('CartContext provider missing');
  return context;
}

afterEach(() => {
  localStorage.clear();
});

describe('CartProvider regression tests', () => {
  it('does not add a new item whose known stock is zero', () => {
    const { result } = renderHook(() => useCartContext(), { wrapper: CartProvider });

    act(() => result.current.addToCart(makeCartItem({ stock: 0 })));

    expect(result.current.cart).toEqual([]);
  });

  it('caps newly added and existing quantities at the known stock', () => {
    const { result } = renderHook(() => useCartContext(), { wrapper: CartProvider });

    act(() => result.current.addToCart(makeCartItem({ quantity: 9, stock: 2 })));
    expect(result.current.cart[0]?.quantity).toBe(2);

    act(() => result.current.addToCart(makeCartItem({ quantity: 2, stock: 2 })));
    expect(result.current.cart[0]?.quantity).toBe(2);
  });

  it('does not increase the quantity of a saved line that has become out of stock', () => {
    localStorage.setItem('clothing-cart', JSON.stringify([makeCartItem({ stock: 0, quantity: 2 })]));
    const { result } = renderHook(() => useCartContext(), { wrapper: CartProvider });

    act(() => result.current.updateQuantity('line-1', 1));

    expect(result.current.cart).toHaveLength(1);
    expect(result.current.cart[0]?.quantity).toBe(2);
    expect(result.current.cart[0]?.stock).toBe(0);
  });

  it('recovers from malformed localStorage JSON without crashing', () => {
    localStorage.setItem('clothing-cart', '{not-json');

    const { result } = renderHook(() => useCartContext(), { wrapper: CartProvider });

    expect(result.current.cart).toEqual([]);
  });
});
