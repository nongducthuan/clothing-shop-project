// @vitest-environment jsdom
import { render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import API from '../../services/apiClient';
import { AuthProvider } from '../../context/AuthProvider';
import { CartProvider } from '../../context/CartProvider';
import { LanguageProvider } from '../../context/LanguageProvider';
import { useCartPage } from './useCartPage';

vi.mock('../../services/apiClient', () => ({ default: { get: vi.fn(), post: vi.fn() } }));

const getMock = API.get as unknown as ReturnType<typeof vi.fn>;
const postMock = API.post as unknown as ReturnType<typeof vi.fn>;

function CartHarness() {
  const { state } = useCartPage();
  return <span data-testid="gift-promotions">{state.earnedGifts.map(gift => `${gift.promoId}:${gift.quantity}`).join(',')}</span>;
}

const firstPromotion = {
  id: 10, name: 'High priority non-stackable', buy_product_id: 25, buy_quantity: 1,
  gift_product_id: 33, gift_quantity: 1, max_gift_per_order: null,
  total_gift_limit: null, total_gifts_issued: 0, is_stackable: false, priority: 10,
};
const lowerPromotion = {
  id: 11, name: 'Lower priority stackable', buy_product_id: 25, buy_quantity: 1,
  gift_product_id: 34, gift_quantity: 1, max_gift_per_order: null,
  total_gift_limit: null, total_gifts_issued: 0, is_stackable: true, priority: 1,
};

let promotions = [firstPromotion, lowerPromotion];

beforeEach(() => {
  promotions = [firstPromotion, lowerPromotion];
  localStorage.setItem('clothing-cart', JSON.stringify([{
    cartItemId: 'cart-line-1', id: 25, name: 'Bought product', price: 100000,
    quantity: 1, size_id: 1, color_id: 1, stock: 10,
  }]));
  getMock.mockImplementation(async (url: string) => {
    if (url === '/promotions') return { data: promotions };
    if (url === '/products/25/options') {
      return { data: { colors: [{ id: 1, sizes: [{ id: 1, size: 'M', stock: 10 }] }] } };
    }
    if (url === '/products/33/options') {
      return { data: { colors: [{ id: 1, sizes: [{ id: 1, size: 'M', stock: 5 }] }] } };
    }
    if (url === '/products/34/options') {
      return { data: { colors: [{ id: 1, sizes: [{ id: 1, size: 'M', stock: 5 }] }] } };
    }
    if (url === '/products/33' || url === '/products/34') {
      const id = Number(url.split('/').pop());
      return { data: { id, name: `Gift ${id}`, colors: [{ id: 1, sizes: [{ id: 1, size: 'M', stock: 5 }] }] } };
    }
    return { data: [] };
  });
  postMock.mockImplementation(async (url: string) => {
    if (url === '/products/prices') return { data: { data: { 25: 100000, 33: 250000 } } };
    return { data: { success: true, data: [] } };
  });
});

afterEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
});

describe('useCartPage promotion stacking and gift inventory', () => {
  it('does not display lower-priority gifts after a qualifying non-stackable promotion', async () => {
    render(
      <LanguageProvider>
        <AuthProvider>
          <CartProvider>
            <CartHarness />
          </CartProvider>
        </AuthProvider>
      </LanguageProvider>,
    );

    await waitFor(() => expect(screen.getByTestId('gift-promotions').textContent).toBe('10:1'));
    expect(screen.getByTestId('gift-promotions').textContent).not.toContain('11');
  });

  it('subtracts gift-product units already being purchased from the shared gift stock budget', async () => {
    promotions = [
      { ...firstPromotion, gift_quantity: 3, is_stackable: true },
      { ...lowerPromotion, gift_product_id: 33, gift_quantity: 3 },
    ];
    localStorage.setItem('clothing-cart', JSON.stringify([
      { cartItemId: 'buy-line', id: 25, name: 'Bought product', price: 100000, quantity: 1, size_id: 1, color_id: 1, stock: 10 },
      { cartItemId: 'gift-product-line', id: 33, name: 'Gift product also purchased', price: 250000, quantity: 1, size_id: 1, color_id: 1, stock: 5 },
    ]));

    render(
      <LanguageProvider>
        <AuthProvider>
          <CartProvider>
            <CartHarness />
          </CartProvider>
        </AuthProvider>
      </LanguageProvider>,
    );

    await waitFor(() => expect(screen.getByTestId('gift-promotions').textContent).toBe('10:3,11:1'));
  });
});
