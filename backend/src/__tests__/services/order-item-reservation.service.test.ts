import type { TxClient } from '../../types/orderTypes';
import { validateAndReserveItems } from '../../services/orderCreationService';

function createTx() {
  return {
    product: { findMany: jest.fn() },
    buyXGetYPromotion: {
      findMany: jest.fn(),
      updateMany: jest.fn().mockResolvedValue({ count: 1 }),
    },
    sale: { findMany: jest.fn().mockResolvedValue([]) },
    productSize: {
      findMany: jest.fn(),
      updateMany: jest.fn().mockResolvedValue({ count: 1 }),
    },
  } as unknown as TxClient & {
    product: { findMany: jest.Mock };
    buyXGetYPromotion: { findMany: jest.Mock; updateMany: jest.Mock };
    sale: { findMany: jest.Mock };
    productSize: { findMany: jest.Mock; updateMany: jest.Mock };
  };
}

describe('validateAndReserveItems', () => {
  it('uses the best applicable sale price and conditionally decrements the selected size stock', async () => {
    const product = {
      id: 1,
      name: 'T-shirt',
      price: 120001,
      import_price: 65000,
      category_id: 10,
      colors: [{ id: 2, sizes: [{ id: 8, color_id: 2, stock: 10 }] }],
    };
    const tx = createTx();
    tx.product.findMany.mockResolvedValue([product]);
    tx.buyXGetYPromotion.findMany.mockResolvedValue([]);
    tx.sale.findMany.mockResolvedValue([{
      apply_scope: 'product',
      discount_percent: 12.5,
      product_sales: [{ product_id: 1 }],
      sale_categories: [],
    }]);
    tx.productSize.findMany.mockResolvedValue([{ id: 8, stock: 10 }]);

    const result = await validateAndReserveItems(tx, [
      { product_id: 1, color_id: 2, size_id: 8, quantity: 2 },
    ]);

    expect(result.serverCalculatedTotal).toBe(210002);
    expect(result.itemsToSave).toEqual([expect.objectContaining({
      product_id: 1,
      color_id: 2,
      size_id: 8,
      quantity: 2,
      price: 105001,
      import_price_snapshot: 65000,
      is_gift: false,
      promotion_id: null,
    })]);
    expect(tx.productSize.updateMany).toHaveBeenCalledWith({
      where: { id: 8, stock: { gte: 2 } },
      data: { stock: { decrement: 2 } },
    });
  });

  it('allocates a sized gift across available variants and reserves the promotion quota', async () => {
    const purchasedProduct = {
      id: 25,
      name: 'Basic tee',
      price: 200000,
      import_price: 80000,
      category_id: 10,
      colors: [],
    };
    const giftProduct = {
      id: 33,
      name: 'Gift shorts',
      price: 250000,
      import_price: 100000,
      category_id: 10,
      colors: [{ id: 2, sizes: [
        { id: 8, color_id: 2, stock: 1 },
        { id: 9, color_id: 2, stock: 1 },
      ] }],
    };
    const promotion = {
      id: 5,
      gift_product_id: 33,
      buy_product_id: 25,
      buy_quantity: 1,
      gift_quantity: 2,
      max_gift_per_order: null,
      total_gift_limit: 10,
      total_gifts_issued: 0,
      start_date: new Date(Date.now() - 60_000),
      end_date: new Date(Date.now() + 60_000),
      status: 'active',
      is_active: true,
      is_stackable: true,
      priority: 1,
    };
    const tx = createTx();
    tx.product.findMany.mockImplementation(async ({ where }: { where: { id: { in: number[] } } }) =>
      where.id.in.length === 1 ? [giftProduct] : [purchasedProduct, giftProduct]);
    tx.buyXGetYPromotion.findMany.mockResolvedValue([promotion]);
    tx.productSize.findMany.mockResolvedValue([{ id: 8, stock: 1 }]);

    const result = await validateAndReserveItems(tx, [
      { product_id: 25, quantity: 1 },
      { product_id: 33, color_id: 2, size_id: 8, quantity: 2, is_gift: true, promotion_id: 5 },
    ]);

    expect(result.serverCalculatedTotal).toBe(200000);
    expect(result.itemsToSave).toEqual([
      expect.objectContaining({ product_id: 25, quantity: 1, price: 200000, is_gift: false }),
      expect.objectContaining({
        product_id: 33,
        color_id: 2,
        size_id: 8,
        quantity: 1,
        price: 0,
        is_gift: true,
        promotion_id: 5,
      }),
      expect.objectContaining({
        product_id: 33,
        color_id: 2,
        size_id: 9,
        quantity: 1,
        price: 0,
        is_gift: true,
        promotion_id: 5,
      }),
    ]);
    expect(tx.buyXGetYPromotion.updateMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({
        id: 5,
        total_gifts_issued: 0,
        total_gift_limit: 10,
      }),
      data: { total_gifts_issued: { increment: 2 } },
    }));
    expect(tx.productSize.updateMany).toHaveBeenCalledTimes(2);
  });
});
