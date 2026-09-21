import { Request, Response } from 'express';

jest.mock('../../../prisma/client', () => ({
  __esModule: true,
  default: {
    voucher: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
    product: {
      findMany: jest.fn(),
    },
  },
}));

import prisma from '../../../prisma/client';
import { applyVoucherCustomer } from '../../controllers/customer/voucherController';

function mockRes() {
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  } as unknown as Response;
  return res;
}

function mockReq(body: Record<string, any>): Request {
  return { body } as unknown as Request;
}

/** A base valid voucher object returned by Prisma mock */
const baseVoucher = {
  id: 1,
  code: 'SAVE10',
  status: true,
  usage_limit: 100,
  start_date: null,
  end_date: null,
  apply_scope: 'all',
  min_order_value: 0,
  discount_percent: 10,
  max_discount_amount: null,
  product_vouchers: [],
  voucher_categories: [],
};

/** Cart items passed in the request body */
const cartItems = [
  { product_id: 1, quantity: 2 },
  { product_id: 2, quantity: 1 },
];

/** Products returned by Prisma when re-fetching prices from DB */
const dbProducts = [
  { id: 1, price: 200000, category_id: 10 },
  { id: 2, price: 150000, category_id: 20 },
];

describe('applyVoucherCustomer', () => {
  beforeEach(() => jest.clearAllMocks());

  it('should return 404 when voucher does not exist', async () => {
    (prisma.voucher.findUnique as jest.Mock).mockResolvedValueOnce(null);

    const req = mockReq({ code: 'INVALID', orderTotal: 500000, cartItems });
    const res = mockRes();

    await applyVoucherCustomer(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: false, message: 'Voucher does not exist or has expired!' })
    );
  });

  it('should return 404 when voucher status is false (inactive)', async () => {
    (prisma.voucher.findUnique as jest.Mock).mockResolvedValueOnce({
      ...baseVoucher,
      status: false,
    });

    const req = mockReq({ code: 'INACTIVE', orderTotal: 500000, cartItems });
    const res = mockRes();

    await applyVoucherCustomer(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('should return 400 when usage_limit is exhausted (= 0)', async () => {
    (prisma.voucher.findUnique as jest.Mock).mockResolvedValueOnce({
      ...baseVoucher,
      usage_limit: 0,
    });

    const req = mockReq({ code: 'SAVE10', orderTotal: 500000, cartItems });
    const res = mockRes();

    await applyVoucherCustomer(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Voucher usage limit reached!' })
    );
  });

  it('should return 400 when voucher start_date is in the future', async () => {
    const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days ahead
    (prisma.voucher.findUnique as jest.Mock).mockResolvedValueOnce({
      ...baseVoucher,
      start_date: futureDate,
    });

    const req = mockReq({ code: 'SAVE10', orderTotal: 500000, cartItems });
    const res = mockRes();

    await applyVoucherCustomer(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Voucher is not active yet!' })
    );
  });

  it('should return 400 when voucher end_date is in the past', async () => {
    const pastDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // 7 days ago
    (prisma.voucher.findUnique as jest.Mock).mockResolvedValueOnce({
      ...baseVoucher,
      end_date: pastDate,
    });

    const req = mockReq({ code: 'SAVE10', orderTotal: 500000, cartItems });
    const res = mockRes();

    await applyVoucherCustomer(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Voucher has expired!' })
    );
  });

  it('should apply 10% discount on full order total for scope=all', async () => {
    (prisma.voucher.findUnique as jest.Mock).mockResolvedValueOnce(baseVoucher);
    (prisma.product.findMany as jest.Mock).mockResolvedValueOnce(dbProducts);

    const orderTotal = 550000;
    const req = mockReq({ code: 'SAVE10', orderTotal, cartItems });
    const res = mockRes();

    await applyVoucherCustomer(req, res);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        data: expect.objectContaining({
          discount_amount: orderTotal * 0.1, // 55000
          final_total: orderTotal - orderTotal * 0.1, // 495000
        }),
      })
    );
  });

  it('should cap discount at max_discount_amount', async () => {
    (prisma.voucher.findUnique as jest.Mock).mockResolvedValueOnce({
      ...baseVoucher,
      discount_percent: 50,
      max_discount_amount: 30000, // cap at 30k
    });
    (prisma.product.findMany as jest.Mock).mockResolvedValueOnce(dbProducts);

    const orderTotal = 550000; // 50% would be 275000 — exceeds cap
    const req = mockReq({ code: 'SAVE10', orderTotal, cartItems });
    const res = mockRes();

    await applyVoucherCustomer(req, res);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        data: expect.objectContaining({
          discount_amount: 30000, // capped
          final_total: orderTotal - 30000,
        }),
      })
    );
  });

  it('should return 400 when order total is below min_order_value', async () => {
    (prisma.voucher.findUnique as jest.Mock).mockResolvedValueOnce({
      ...baseVoucher,
      min_order_value: 1000000, // requires 1M order
    });
    (prisma.product.findMany as jest.Mock).mockResolvedValueOnce(dbProducts);

    const req = mockReq({ code: 'SAVE10', orderTotal: 200000, cartItems });
    const res = mockRes();

    await applyVoucherCustomer(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: expect.stringContaining('Minimum order value') })
    );
  });
});
