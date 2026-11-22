// @vitest-environment jsdom
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useNavigate } from '@/lib/router';
import { setMockLocation } from '@/test/nextNavigationMock';
import API from "@shop/shared/services/apiClient";
import { LanguageProvider } from "@shop/shared/context/LanguageProvider";
import { useCategoryPage } from './useCategoryPage';

vi.mock('next/navigation', () => import('@/test/nextNavigationMock'));
vi.mock('@shop/shared/services/apiClient', () => ({ default: { get: vi.fn(), post: vi.fn() } }));

const getMock = API.get as unknown as ReturnType<typeof vi.fn>;

function CategoryHarness() {
  const { state, actions } = useCategoryPage();
  const navigate = useNavigate();
  return (
    <>
      <span data-testid="page">{state.currentPage}</span>
      <button onClick={actions.handleNextPage}>next-page</button>
      <button onClick={() => navigate('/category/2')}>change-category</button>
    </>
  );
}

beforeEach(() => {
  setMockLocation('/category/1', '/category/:id');
});

afterEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
});

describe('useCategoryPage pagination regression', () => {
  it('returns to page 1 and requests page 1 when category changes from page 2', async () => {
    Object.defineProperty(window, 'scrollTo', { configurable: true, value: vi.fn() });
    getMock.mockImplementation(async (url: string) => {
      if (url === '/products') {
        return { data: { data: [{ id: 1, name: 'Product' }], totalPages: 3, totalProducts: 24 } };
      }
      if (url === '/categories') {
        return { data: [{ id: 1, name: 'Category 1' }, { id: 2, name: 'Category 2' }] };
      }
      return { data: [] };
    });

    render(
      <LanguageProvider>
        <CategoryHarness />
      </LanguageProvider>,
    );

    await waitFor(() => expect(getMock.mock.calls.some(([url, config]) =>
      url === '/products' && config?.params?.category_id === '1' && config?.params?.page === 1
    )).toBe(true));

    fireEvent.click(screen.getByText('next-page'));
    await waitFor(() => expect(screen.getByTestId('page').textContent).toBe('2'));
    await waitFor(() => expect(getMock.mock.calls.some(([url, config]) =>
      url === '/products' && config?.params?.category_id === '1' && config?.params?.page === 2
    )).toBe(true));

    fireEvent.click(screen.getByText('change-category'));
    await waitFor(() => expect(screen.getByTestId('page').textContent).toBe('1'));
    await waitFor(() => expect(getMock.mock.calls.some(([url, config]) =>
      url === '/products' && config?.params?.category_id === '2' && config?.params?.page === 1
    )).toBe(true));
  });
});
