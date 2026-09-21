import { Request, Response } from 'express';

jest.mock('../../../prisma/client', () => ({
  __esModule: true,
  default: { $transaction: jest.fn() },
}));

jest.mock('../../utils/emailService', () => ({
  __esModule: true,
  sendEmail: jest.fn().mockResolvedValue({ success: true }),
}));

import prisma from '../../../prisma/client';
import { createOrderController } from '../../controllers/customer/orderController';

function mockRes() {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  } as unknown as Response;
}

function mockReq(items: any[]): Request {
  return {
    body: {
      address: 'Ha Noi',
      name: 'Khach',
      email: 'customer@example.com',
      phone: '0900000000',
      payment_method: 'cod',
      items,
    },
    headers: {},
  } as unknown as Request;
}

const buyProduct = { id: 25, name: 'Heavyweight Tee', price: 200000, category_id: 10, colors: [{ id: 1, sizes: [] }] };
const giftProduct = { id: 33, name: 'Sweat Shorts', price: 250000, category_id: 10, colors: [{ id: 2, sizes: [] }] };

let tx: any;

beforeEach(() => {
  jest.clearAllMocks();

  tx = {
    product: {
      findUnique: jest.fn().mockImplementation(({ where }: any) =>
        Promise.resolve(where.id === 33 ? giftProduct : buyProduct)
      ),
    },
    buyXGetYPromotion: { findUnique: jest.fn().mockResolvedValue({ id: 5, gift_product_id: 33 }) },
    sale: { findMany: jest.fn().mockResolvedValue([]) },
    productSize: { findUnique: jest.fn(), updateMany: jest.fn().mockResolvedValue({ count: 1 }) },
    user: { findUnique: jest.fn() },
    order: { create: jest.fn().mockResolvedValue({ id: 777 }) },
  };

  (prisma.$transaction as jest.Mock).mockImplementation(async (cb: any) => cb(tx));
});

describe('createOrderController – ràng buộc Buy X Get Y cho quà tặng', () => {
  it('từ chối quà tặng không có promotion_id', async () => {
    const req = mockReq([{ product_id: 33, quantity: 1, is_gift: true }]);
    const res = mockRes();

    await createOrderController(req, res);

    expect(tx.order.create).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(500);
    const payload = (res.json as jest.Mock).mock.calls[0][0];
    expect(payload.error).toContain('missing promotion reference');
  });

  it('từ chối khi promotion không tặng đúng sản phẩm quà', async () => {
    tx.buyXGetYPromotion.findUnique.mockResolvedValue({ id: 5, gift_product_id: 999 });

    const req = mockReq([{ product_id: 33, quantity: 1, is_gift: true, promotion_id: 5 }]);
    const res = mockRes();

    await createOrderController(req, res);

    expect(tx.order.create).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(500);
    const payload = (res.json as jest.Mock).mock.calls[0][0];
    expect(payload.error).toContain('promotion is invalid');
  });

  it('đơn hợp lệ: lưu promotion_id cho quà, payable_amount được phân bổ đúng', async () => {
    const req = mockReq([
      { product_id: 25, quantity: 2 },
      { product_id: 33, quantity: 1, is_gift: true, promotion_id: 5 },
    ]);
    const res = mockRes();

    await createOrderController(req, res);

    expect(res.status).toHaveBeenCalledWith(201);

    const createdItems = tx.order.create.mock.calls[0][0].data.items.create;
    expect(createdItems).toHaveLength(2);

    const [buyItem, giftItem] = createdItems;
    expect(buyItem).toMatchObject({
      product_id: 25, quantity: 2, price: 200000,
      is_gift: false, promotion_id: null, discount_amount: 0, payable_amount: 400000,
    });
    expect(giftItem).toMatchObject({
      product_id: 33, quantity: 1, price: 0,
      is_gift: true, promotion_id: 5, discount_amount: 0, payable_amount: 0,
    });
    expect(tx.order.create.mock.calls[0][0].data.total_price).toBe(400000);
  });
});
