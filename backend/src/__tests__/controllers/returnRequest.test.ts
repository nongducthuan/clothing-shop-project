import { Request, Response } from 'express';

// ─── Mock Prisma before importing the controller ──────────────────────────────
jest.mock('../../../prisma/client', () => ({
  __esModule: true,
  default: {
    $transaction: jest.fn(),
  },
}));

import prisma from '../../../prisma/client';
import { submitReturnRequest } from '../../controllers/customer/orderController';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function mockRes() {
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  } as unknown as Response;
  return res;
}

function mockReq(body: Record<string, any>, user: any = { id: 1, role: 'customer' }): Request {
  return { params: { id: '326' }, body, user } as unknown as Request;
}

/**
 * Đơn hàng thật #326:
 * - #118  product 25 (Áo Thun Phổ Thị)   qty 2  => sản phẩm X của promotion 5
 * - #119  product 26 (Áo Thun Thế Thao)  qty 2  => KHÔNG phải X
 * - #120  product 33 (Quần Short)        qty 1  => quà tặng Y (promotion 5)
 */
const promo = { id: 5, buy_product_id: 25, gift_product_id: 33, buy_quantity: 2, gift_quantity: 1 };

const item118 = {
  id: 118, order_id: 326, product_id: 25, quantity: 2, price: 160000,
  payable_amount: 295000, discount_amount: 25000, is_gift: false, promotion_id: null, promotion: null,
};
const item119 = {
  id: 119, order_id: 326, product_id: 26, quantity: 2, price: 160000,
  payable_amount: 295000, discount_amount: 25000, is_gift: false, promotion_id: null, promotion: null,
};
const giftItem120 = {
  id: 120, order_id: 326, product_id: 33, quantity: 1, price: 0,
  payable_amount: 0, discount_amount: 0, is_gift: true, promotion_id: 5, promotion: promo,
};

const order = {
  id: 326,
  user_id: 1,
  email: 'customer@example.com',
  status: 'Delivered',
  payment_status: 'Paid',
  items: [item118, item119, giftItem120],
};

let tx: any;

beforeEach(() => {
  jest.clearAllMocks();

  tx = {
    order: {
      findFirst: jest.fn().mockResolvedValue(order),
      update: jest.fn().mockResolvedValue(order),
    },
    returnRequest: {
      findUnique: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockImplementation(({ data }) => Promise.resolve({ id: 999, ...data })),
    },
  };

  (prisma.$transaction as jest.Mock).mockImplementation(async (cb: any) => cb(tx));
});

/** Trả về danh sách items mà controller ghi vào ReturnRequest */
function createdReturnItems() {
  expect(tx.returnRequest.create).toHaveBeenCalledTimes(1);
  return tx.returnRequest.create.mock.calls[0][0].data.items.create;
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('submitReturnRequest – Buy X Get Y chỉ ràng buộc đúng sản phẩm X', () => {
  it('trả 1 phần sản phẩm KHÔNG phải X (#119) → cho phép, không gom quà Y', async () => {
    const req = mockReq({
      reason_code: 'Change mind',
      email: 'customer@example.com',
      returnItems: JSON.stringify([{ order_item_id: 119, return_quantity: 1 }]),
    });
    const res = mockRes();

    await submitReturnRequest(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(createdReturnItems()).toEqual([
      { order_item_id: 119, return_quantity: 1, refund_amount: 147500 },
    ]);
    expect(tx.returnRequest.create.mock.calls[0][0].data.refund_amount).toBe(147500);
  });

  it('trả đủ sản phẩm X (#118) → tự động gom quà Y (#120) với refund = 0', async () => {
    const req = mockReq({
      reason_code: 'Change mind',
      email: 'customer@example.com',
      returnItems: JSON.stringify([{ order_item_id: 118, return_quantity: 2 }]),
    });
    const res = mockRes();

    await submitReturnRequest(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(createdReturnItems()).toEqual([
      { order_item_id: 118, return_quantity: 2, refund_amount: 295000 },
      { order_item_id: 120, return_quantity: 1, refund_amount: 0 },
    ]);
    expect(tx.returnRequest.create.mock.calls[0][0].data.refund_amount).toBe(295000);
  });

  it('trả 1 phần sản phẩm X (#118) → bị từ chối (phải hoàn toàn bộ)', async () => {
    const req = mockReq({
      reason_code: 'Change mind',
      email: 'customer@example.com',
      returnItems: JSON.stringify([{ order_item_id: 118, return_quantity: 1 }]),
    });
    const res = mockRes();

    await submitReturnRequest(req, res);

    expect(tx.returnRequest.create).not.toHaveBeenCalled();
    const message = (res.json as jest.Mock).mock.calls[0][0].message;
    expect(message).toContain('full quantity');
  });

  it('trả cả 2 sản phẩm mua (X + không-X) → quà Y chỉ được gom 1 lần', async () => {
    const req = mockReq({
      reason_code: 'Change mind',
      email: 'customer@example.com',
      returnItems: JSON.stringify([
        { order_item_id: 118, return_quantity: 2 },
        { order_item_id: 119, return_quantity: 2 },
      ]),
    });
    const res = mockRes();

    await submitReturnRequest(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(createdReturnItems()).toEqual([
      { order_item_id: 118, return_quantity: 2, refund_amount: 295000 },
      { order_item_id: 119, return_quantity: 2, refund_amount: 295000 },
      { order_item_id: 120, return_quantity: 1, refund_amount: 0 },
    ]);
    expect(tx.returnRequest.create.mock.calls[0][0].data.refund_amount).toBe(590000);
  });

  it('không cho phép trả quà tặng độc lập', async () => {
    const req = mockReq({
      reason_code: 'Change mind',
      email: 'customer@example.com',
      returnItems: JSON.stringify([{ order_item_id: 120, return_quantity: 1 }]),
    });
    const res = mockRes();

    await submitReturnRequest(req, res);

    expect(tx.returnRequest.create).not.toHaveBeenCalled();
    const message = (res.json as jest.Mock).mock.calls[0][0].message;
    expect(message).toContain('Gift items cannot be returned independently');
  });
});
