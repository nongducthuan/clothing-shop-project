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
    sale: {
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

function mockReq(body: Record<string, unknown>): Request {
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
  beforeEach(() => {
    jest.clearAllMocks();
    (prisma.sale.findMany as jest.Mock).mockResolvedValue([]);
  });

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

  it('không áp voucher hoặc giảm thành viên lên sản phẩm Buy X Get Y không cộng dồn', async () => {
    (prisma.voucher.findUnique as jest.Mock).mockResolvedValueOnce(baseVoucher);
    (prisma.product.findMany as jest.Mock).mockResolvedValueOnce(dbProducts);

    const req = mockReq({
      code: 'SAVE10',
      subtotal: 550000,
      orderTotal: 520000,
      membershipDiscountableSubtotal: 150000,
      cartItems: [
        { product_id: 1, quantity: 2, block_other_discounts: true },
        { product_id: 2, quantity: 1, block_other_discounts: false },
      ],
    });
    const res = mockRes();

    await applyVoucherCustomer(req, res);

    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: true,
      data: expect.objectContaining({
        applied_to_total: 120000,
        discount_amount: 12000,
        final_total: 508000,
      }),
    }));
  });

  it('rounds sale price and voucher amount to the same whole-VND values as checkout', async () => {
    (prisma.voucher.findUnique as jest.Mock).mockResolvedValueOnce({
      ...baseVoucher,
      discount_percent: 50,
      max_discount_amount: null,
    });
    (prisma.product.findMany as jest.Mock).mockResolvedValueOnce([
      { id: 3, price: 999, category_id: 10 },
    ]);
    (prisma.sale.findMany as jest.Mock).mockResolvedValueOnce([{
      id: 20,
      status: true,
      start_date: new Date(Date.now() - 60_000),
      end_date: new Date(Date.now() + 60_000),
      apply_scope: 'all',
      discount_percent: 10,
      product_sales: [],
      sale_categories: [],
    }] as never);

    const req = mockReq({
      code: 'SAVE10', orderTotal: 899,
      cartItems: [{ product_id: 3, quantity: 1 }],
    });
    const res = mockRes();
    await applyVoucherCustomer(req, res);

    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: true,
      data: expect.objectContaining({
        applied_to_total: 899,
        discount_amount: 450,
        final_total: 449,
      }),
    }));
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

  it('kiểm tra "đơn tối thiểu" theo TIỀN HÀNG gốc — tiền hàng đủ thì vẫn áp dụng dù tiền sau giảm hạng thấp hơn', async () => {
    (prisma.voucher.findUnique as jest.Mock).mockResolvedValueOnce({
      ...baseVoucher,
      min_order_value: 300000,
    });
    (prisma.product.findMany as jest.Mock).mockResolvedValueOnce(dbProducts);

    // Tiền hàng gốc 480.000 (ĐẠT 300.000) nhưng orderTotal sau giảm hạng chỉ còn 200.000
    const req = mockReq({ code: 'SAVE10', orderTotal: 200000, subtotal: 480000, cartItems });
    const res = mockRes();

    await applyVoucherCustomer(req, res);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: true })
    );
  });

  it('vẫn báo lỗi "đơn tối thiểu" khi TIỀN HÀNG gốc chưa đạt (subtotal < min_order_value)', async () => {
    (prisma.voucher.findUnique as jest.Mock).mockResolvedValueOnce({
      ...baseVoucher,
      min_order_value: 500000,
    });
    (prisma.product.findMany as jest.Mock).mockResolvedValueOnce(dbProducts);

    const req = mockReq({
      code: 'SAVE10',
      orderTotal: 200000,
      subtotal: 250000,
      // Re-fetched DB price for this cart is 200k, still below the 500k minimum.
      cartItems: [{ product_id: 1, quantity: 1 }],
    });
    const res = mockRes();

    await applyVoucherCustomer(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: expect.stringContaining('Minimum order value') })
    );
  });
});
