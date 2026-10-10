// @vitest-environment jsdom
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter, Route, Routes, useNavigate } from 'react-router-dom';
import API from '../../services/apiClient.ts';
import { LanguageProvider } from '../../context/LanguageProvider';
import { CartProvider } from '../../context/CartProvider';
import { useProductDetail } from './useProductDetail';

vi.mock('../../services/apiClient.ts', () => ({ default: { get: vi.fn(), post: vi.fn() } }));

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
          <MemoryRouter initialEntries={['/product/1']}>
            <Routes>
              <Route path="/product/:id" element={<ProductHarness />} />
            </Routes>
          </MemoryRouter>
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
