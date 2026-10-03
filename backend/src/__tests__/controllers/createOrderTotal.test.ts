import { Request, Response } from 'express';

jest.mock('../../../prisma/client', () => ({
  __esModule: true,
  default: { $transaction: jest.fn() },
}));

jest.mock('../../utils/emailService', () => ({
  __esModule: true,
  sendEmail: jest.fn().mockResolvedValue({ success: true }),
}));

jest.mock('../../utils/emailQueue', () => ({
  __esModule: true,
  queueEmail: jest.fn(),
}));

jest.mock('../../utils/socket', () => ({
  __esModule: true,
  getIO: jest.fn(),
  sendNotification: jest.fn().mockResolvedValue(true),
}));

jest.mock('../../services/interactionService', () => ({
  __esModule: true,
  recordInteraction: jest.fn(),
}));

import prisma from '../../../prisma/client';
import { createOrderController } from '../../controllers/customer/orderController';

function mockRes() {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  } as unknown as Response;
}

function mockReq(items: any[], voucher_id?: number, shipping_fee: number = 0, user?: any): Request {
  return {
    user,
    body: {
      address: 'Ha Noi',
      name: 'Khach',
      email: 'customer@example.com',
      phone: '0900000000',
      payment_method: 'cod',
      items,
      voucher_id,
      shipping_fee,
    },
    headers: {},
    socket: {},
  } as unknown as Request;
}

const p1 = { id: 1, name: 'Product 1', price: 120000, category_id: 1, colors: [{ id: 1, sizes: [{ id: 1, stock: 100 }] }] };
const p2 = { id: 2, name: 'Product 2', price: 120000, category_id: 1, colors: [{ id: 1, sizes: [{ id: 2, stock: 100 }] }] };

let tx: any;

beforeEach(() => {
  jest.clearAllMocks();

  tx = {
    product: {
      findUnique: jest.fn().mockImplementation(({ where }: any) =>
        Promise.resolve(where.id === 1 ? p1 : p2)
      ),
      findMany: jest.fn().mockImplementation(() => Promise.resolve([p1, p2])),
    },
    sale: { findMany: jest.fn().mockResolvedValue([]) },
    productSize: { 
      findUnique: jest.fn().mockResolvedValue({ stock: 100 }), 
      findMany: jest.fn().mockImplementation(() => Promise.resolve([{ id: 1, stock: 100 }, { id: 2, stock: 100 }])),
      updateMany: jest.fn().mockResolvedValue({ count: 1 }) 
    },
    user: { 
      findUnique: jest.fn().mockImplementation(({ where }: any) => {
        if (where.id === 99) {
          return Promise.resolve({ id: 99, membership: { discount_percent: 20 } });
        }
        return Promise.resolve(null);
      })
    },
    voucher: { 
      findUnique: jest.fn().mockImplementation(({ where }: any) => {
        if (where.id === 10) {
          return Promise.resolve({
            id: 10,
            status: true,
            min_order_value: 300000,
            discount_percent: 10,
            max_discount_amount: 50000,
            apply_scope: 'all',
            product_vouchers: [],
            voucher_categories: []
          });
        }
        return Promise.resolve(null);
      }),
      updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      update: jest.fn().mockResolvedValue({}),
    },
    order: { create: jest.fn().mockImplementation((args) => Promise.resolve({ id: 777, ...args.data })) },
    // Trừ kho gộp bằng 1 câu raw SQL: trả về số dòng bị ảnh hưởng = số size (2).
    $executeRawUnsafe: jest.fn().mockResolvedValue(2),
  };

  (prisma.$transaction as jest.Mock).mockImplementation(async (cb: any) => cb(tx));
});

describe('createOrderController – calculate total_price and payable_amount properly', () => {
  it('should correctly apply both membership and voucher discounts and calculate exact sums', async () => {
    // 60 items * 120000 = 7,200,000 VND
    const req = mockReq([
      { product_id: 1, quantity: 30, size_id: 1 },
      { product_id: 2, quantity: 30, size_id: 2 },
    ], 10, 0, { id: 99 });
    
    const res = mockRes();

    await createOrderController(req, res);

    expect(res.status).toHaveBeenCalledWith(201);

    const createdOrder = tx.order.create.mock.calls[0][0].data;
    
    // Subtotal = 7,200,000
    // Membership (20%) = 1,440,000 => After mem = 5,760,000
    // Voucher (10% of 5,760,000 is 576,000, but max is 50,000) => Discount = 50,000
    // Final total = 5,760,000 - 50,000 = 5,710,000
    // Shipping = 0
    // Total Price should be 5,710,000
    
    expect(createdOrder.total_price).toBe(5710000);

    const items = createdOrder.items.create;
    
    // Sum of all payable_amount from items should exactly equal total_price (minus shipping)
    const sumPayable = items.reduce((sum: number, item: any) => sum + item.payable_amount, 0);
    
    expect(sumPayable).toBe(createdOrder.total_price - createdOrder.shipping_fee);
  });
});
