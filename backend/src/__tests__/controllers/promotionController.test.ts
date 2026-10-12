import type { Request, Response } from 'express';

jest.mock('../../../prisma/client', () => ({
  __esModule: true,
  default: {
    buyXGetYPromotion: { findMany: jest.fn() },
    productColor: { findMany: jest.fn() },
  },
}));

import prisma from '../../../prisma/client';
import { calculateCart } from '../../controllers/customer/promotionController';

const mockedPrisma = prisma as unknown as {
  buyXGetYPromotion: { findMany: jest.Mock };
  productColor: { findMany: jest.Mock };
};

function mockRes() {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  } as unknown as Response;
}

const activePromotion = (overrides: Record<string, unknown> = {}) => ({
  id: 5,
  buy_product_id: 25,
  gift_product_id: 33,
  buy_quantity: 1,
  gift_quantity: 2,
  max_gift_per_order: null,
  total_gift_limit: null,
  total_gifts_issued: 0,
  is_active: true,
  status: 'active',
  start_date: new Date(Date.now() - 60_000),
  end_date: new Date(Date.now() + 60_000),
  is_stackable: true,
  priority: 10,
  ...overrides,
});

beforeEach(() => {
  jest.clearAllMocks();
  mockedPrisma.buyXGetYPromotion.findMany.mockResolvedValue([
    activePromotion({ id: 5, buy_product_id: 25, priority: 10 }),
    activePromotion({ id: 6, buy_product_id: 26, priority: 5 }),
  ]);
  mockedPrisma.productColor.findMany.mockResolvedValue([{
    id: 2,
    color_name: 'Blue',
    image_url: null,
    sizes: [
      { id: 8, size: 'M', stock: 2 },
      { id: 9, size: 'L', stock: 1 },
    ],
  }]);
});

describe('calculateCart – shared stock for gift products', () => {
  it('does not allocate more gifts across multiple promotions than the gift product stock', async () => {
    const req = {
      body: {
        cartItems: [
          { product_id: 26, quantity: 1 },
          { product_id: 25, quantity: 1 },
        ],
      },
    } as Request;
    const res = mockRes();

    await calculateCart(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    const payload = (res.json as jest.Mock).mock.calls[0][0];
    const gifts = payload.data.giftItems as Array<{ actual_quantity: number; expected_quantity: number; is_partial_gift: boolean }>;

    expect(gifts).toHaveLength(2);
    expect(gifts.map((gift) => gift.actual_quantity)).toEqual([2, 1]);
    expect(gifts.reduce((sum, gift) => sum + gift.actual_quantity, 0)).toBe(3);
    expect(gifts[1]).toMatchObject({ expected_quantity: 2, actual_quantity: 1, is_partial_gift: true });
    expect(mockedPrisma.productColor.findMany).toHaveBeenCalledTimes(1);
    expect(mockedPrisma.buyXGetYPromotion.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ is_active: true, status: 'active' }),
    }));
  });

  it('subtracts units already purchased from stock available for gifts', async () => {
    const req = {
      body: {
        cartItems: [
          { product_id: 25, quantity: 1 },
          { product_id: 26, quantity: 1 },
          { product_id: 33, quantity: 1 },
        ],
      },
    } as Request;
    const res = mockRes();

    await calculateCart(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    const payload = (res.json as jest.Mock).mock.calls[0][0];
    const gifts = payload.data.giftItems as Array<{ promotion_id: number; actual_quantity: number }>;
    expect(gifts).toEqual([{ 
      promotion_id: 5,
      gift_product_id: 33,
      expected_quantity: 2,
      actual_quantity: 2,
      is_partial_gift: false,
      status: 'FULL',
      is_stackable: true,
      variants: [
        { size_id: 8, color_id: 2, color: 'Blue', size: 'M', stock: 2, image: null },
        { size_id: 9, color_id: 2, color: 'Blue', size: 'L', stock: 1, image: null },
      ],
      message: 'You received 2 free item(s). Please choose color and size.',
    }]);
  });

  it('rejects an empty cart before querying promotions', async () => {
    const res = mockRes();

    await calculateCart({ body: { cartItems: [] } } as Request, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(mockedPrisma.buyXGetYPromotion.findMany).not.toHaveBeenCalled();
  });
});
