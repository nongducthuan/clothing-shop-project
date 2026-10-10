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

type OrderItemInput = {
  product_id: number;
  quantity: number;
  size_id?: number;
  is_gift?: boolean;
  promotion_id?: number | null;
};

type MockUser = NonNullable<Request['user']>;

function mockReq(
  items: OrderItemInput[],
  voucher_id?: number,
  shipping_fee: number = 0,
  user?: MockUser
): Request {
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

const p1 = { id: 1, name: 'Product 1', price: 120000, import_price: 65000, category_id: 1, colors: [{ id: 1, sizes: [{ id: 1, stock: 100 }] }] };
const p2 = { id: 2, name: 'Product 2', price: 120000, import_price: 70000, category_id: 1, colors: [{ id: 1, sizes: [{ id: 2, stock: 100 }] }] };

function createTransactionMock() {
  return {
    product: {
      findUnique: jest.fn().mockImplementation(({ where }: { where: { id: number } }) =>
        Promise.resolve(where.id === 1 ? p1 : p2)
      ),
      findMany: jest.fn().mockImplementation(() => Promise.resolve([p1, p2])),
    },
    buyXGetYPromotion: { findMany: jest.fn().mockResolvedValue([]) },
    sale: { findMany: jest.fn().mockResolvedValue([]) },
    productSize: {
      findUnique: jest.fn().mockResolvedValue({ stock: 100 }),
      findMany: jest.fn().mockImplementation(() =>
        Promise.resolve([{ id: 1, stock: 100 }, { id: 2, stock: 100 }])
      ),
      updateMany: jest.fn().mockResolvedValue({ count: 1 }),
    },
    user: {
      findUnique: jest.fn().mockImplementation(({ where }: { where: { id: number } }) => {
        if (where.id === 99) {
          return Promise.resolve({ id: 99, membership: { discount_percent: 20, is_active: true } });
        }
        return Promise.resolve(null);
      })
    },
    voucher: {
      findUnique: jest.fn().mockImplementation(({ where }: { where: { id: number } }) => {
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
    order: { create: jest.fn().mockImplementation((args: { data: Record<string, unknown> }) => Promise.resolve({ id: 777, ...args.data })) },
    $executeRawUnsafe: jest.fn().mockResolvedValue(2),
  };
}

type TransactionMock = ReturnType<typeof createTransactionMock>;
let tx: TransactionMock;

beforeEach(() => {
  jest.clearAllMocks();
  p1.price = 120000;
  p2.price = 120000;

  tx = createTransactionMock();

  (prisma.$transaction as jest.Mock).mockImplementation(async (cb: unknown) => {
    if (typeof cb !== 'function') throw new TypeError('Expected transaction callback');
    return (cb as (transaction: TransactionMock) => unknown)(tx);
  });
});

describe('createOrderController – calculate total_price and payable_amount properly', () => {
  it('should correctly apply both membership and voucher discounts and calculate exact sums', async () => {
    const req = mockReq([
      { product_id: 1, quantity: 30, size_id: 1 },
      { product_id: 2, quantity: 30, size_id: 2 },
    ], 10, 0, { id: 99, name: 'Test User', email: 'test@example.com', role: 'customer' });

    const res = mockRes();

    await createOrderController(req, res);

    expect(res.status).toHaveBeenCalledWith(201);

    const createdOrder = tx.order.create.mock.calls[0][0].data;

    expect(createdOrder.total_price).toBe(5710000);

    const items = createdOrder.items.create;

    const sumPayable = items.reduce((sum: number, item: { payable_amount: number }) => sum + item.payable_amount, 0);

    expect(sumPayable).toBe(createdOrder.total_price - createdOrder.shipping_fee);
    expect(items).toEqual(expect.arrayContaining([
      expect.objectContaining({ product_id: 1, import_price_snapshot: 65000 }),
      expect.objectContaining({ product_id: 2, import_price_snapshot: 70000 }),
    ]));
  });
  it('should calculate shipping on the server instead of trusting a tampered client fee', async () => {
    const req = mockReq([
      { product_id: 1, quantity: 1, size_id: 1 },
      { product_id: 2, quantity: 1, size_id: 2 },
    ], undefined, 0);

    const res = mockRes();
    await createOrderController(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    const createdOrder = tx.order.create.mock.calls[0][0].data;

    expect(createdOrder.shipping_fee).toBe(20_000);
    expect(createdOrder.total_price).toBe(260_000);
  });

  it('rounds the sale unit price and snapshots the product cost when creating an order', async () => {
    p1.price = 120001;
    tx.sale.findMany.mockResolvedValue([{
      id: 9,
      status: true,
      start_date: new Date(Date.now() - 60_000),
      end_date: new Date(Date.now() + 60_000),
      apply_scope: 'product',
      discount_percent: 12.5,
      product_sales: [{ product_id: 1 }],
      sale_categories: [],
    }] as never);

    const req = mockReq([{ product_id: 1, quantity: 1, size_id: 1 }]);
    const res = mockRes();
    await createOrderController(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    const createdOrder = tx.order.create.mock.calls[0][0].data;
    expect(createdOrder.items.create[0]).toMatchObject({
      product_id: 1,
      price: 105001,
      import_price_snapshot: 65000,
    });
    expect(createdOrder.total_price).toBe(125001); // rounded product price + server-calculated shipping
  });


  it('keeps all persisted amounts as integer VND and allocates discounts to the exact merchandise total', async () => {
    p1.price = 100001;
    p2.price = 100003;
    tx.voucher.findUnique.mockResolvedValue({
      id: 10,
      status: true,
      min_order_value: 0,
      discount_percent: 12.5,
      max_discount_amount: 50000,
      apply_scope: 'all',
      product_vouchers: [],
      voucher_categories: [],
    } as never);
    tx.user.findUnique.mockResolvedValue({
      id: 99,
      membership: { discount_percent: 7.5, is_active: true },
    } as never);

    const req = mockReq([
      { product_id: 1, quantity: 1, size_id: 1 },
      { product_id: 2, quantity: 1, size_id: 2 },
    ], 10, 0, { id: 99, name: 'Test User', email: 'test@example.com', role: 'customer' });
    const res = mockRes();
    await createOrderController(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    const createdOrder = tx.order.create.mock.calls[0][0].data;
    const items = createdOrder.items.create as { price: number; quantity: number; discount_amount: number; payable_amount: number }[];
    expect(createdOrder.total_price % 1).toBe(0);
    expect(createdOrder.shipping_fee % 1).toBe(0);
    expect(items.every(item => Number.isInteger(item.price) && Number.isInteger(item.discount_amount) && Number.isInteger(item.payable_amount))).toBe(true);
    expect(items.reduce((sum, item) => sum + item.payable_amount, 0)).toBe(createdOrder.total_price - createdOrder.shipping_fee);
    expect(items.every(item => item.discount_amount + item.payable_amount === item.price * item.quantity)).toBe(true);
  });

  it('should reject unsupported payment methods before creating an order', async () => {
    const req = mockReq([
      { product_id: 1, quantity: 1, size_id: 1 },
    ]);
    (req.body as { payment_method: string }).payment_method = 'bitcoin';

    const res = mockRes();
    await createOrderController(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Invalid payment method. Allowed values: cod, momo, vnpay.',
    });
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

});
