// @vitest-environment jsdom
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useNavigate } from '@/lib/router';
import { setMockLocation } from '@/test/nextNavigationMock';
import API from "@shop/shared/services/apiClient";
import { LanguageProvider } from "@shop/shared/context/LanguageProvider";
import { CartProvider } from '@/context/CartProvider';
import { useProductDetail } from './useProductDetail';

vi.mock('next/navigation', () => import('@/test/nextNavigationMock'));
vi.mock('@shop/shared/services/apiClient', () => ({ default: { get: vi.fn(), post: vi.fn() } }));

const getMock = API.get as unknown as ReturnType<typeof vi.fn>;

function ProductHarness() {
  const { state } = useProductDetail();
  const navigate = useNavigate();
  return (
    <>
      <span data-testid="product">{state.product?.name ?? 'loading'}</span>
      <span data-testid="voucher">{state.activeVoucher?.code ?? 'none'}</span>
      <span data-testid="promotion">{state.activePromotion?.id ?? 'none'}</span>
      <span data-testid="gift">{state.giftProduct?.id ?? 'none'}</span>
      <button onClick={() => navigate('/product/2')}>change-product</button>
    </>
  );
}

beforeEach(() => {
  setMockLocation('/product/1', '/product/:id');
});

afterEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
});

describe('useProductDetail benefit state regression', () => {
  it('clears a previous product voucher and promotion when the next product has none', async () => {
    getMock.mockImplementation(async (url: string, config?: { params?: { product_id?: number } }) => {
      if (url.startsWith('/products/')) {
        const id = Number(url.split('/').pop());
        return { data: { id, name: `Product ${id}`, price: 100_000, category_id: id, colors: [] } };
      }
      if (url === '/vouchers') {
        return { data: config?.params?.product_id === 1 ? [{ id: 4, code: 'FIRST10', discount_percent: 10 }] : [] };
      }
      if (url === '/promotions') {
        return { data: [{ id: 7, buy_product_id: 1, gift_product_id: 33, buy_quantity: 1, gift_quantity: 1 }] };
      }
      return { data: [] };
    });

    render(
      <LanguageProvider>
        <CartProvider>
          <ProductHarness />
        </CartProvider>
      </LanguageProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('product').textContent).toBe('Product 1');
      expect(screen.getByTestId('voucher').textContent).toBe('FIRST10');
      expect(screen.getByTestId('promotion').textContent).toBe('7');
      expect(screen.getByTestId('gift').textContent).toBe('33');
    });

    fireEvent.click(screen.getByText('change-product'));

    await waitFor(() => {
      expect(screen.getByTestId('product').textContent).toBe('Product 2');
      expect(screen.getByTestId('voucher').textContent).toBe('none');
      expect(screen.getByTestId('promotion').textContent).toBe('none');
      expect(screen.getByTestId('gift').textContent).toBe('none');
    });
  });
});
