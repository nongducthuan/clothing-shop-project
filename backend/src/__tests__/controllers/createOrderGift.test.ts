import { Request, Response } from 'express';

jest.mock('../../../prisma/client', () => ({
  __esModule: true,
  default: { $transaction: jest.fn() },
}));

jest.mock('../../utils/emailService', () => ({
  __esModule: true,
  sendEmail: jest.fn().mockResolvedValue({ success: true }),
}));

jest.mock('../../utils/socket', () => ({
  __esModule: true,
  sendNotification: jest.fn().mockResolvedValue(undefined),
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
  color_id?: number;
  size_id?: number;
  is_gift?: boolean;
  promotion_id?: number | null;
};

function mockReq(items: OrderItemInput[]): Request {
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

const buyProduct = { id: 25, name: 'Heavyweight Tee', price: 200000, import_price: 80000, category_id: 10, colors: [{ id: 1, sizes: [] }] };
const secondBuyProduct = { id: 26, name: 'Cotton Trousers', price: 300000, import_price: 120000, category_id: 10, colors: [{ id: 3, sizes: [] }] };
const giftProduct: {
  id: number;
  name: string;
  price: number;
  import_price: number;
  category_id: number;
  colors: { id: number; sizes: { id: number; color_id: number; stock: number }[] }[];
} = { id: 33, name: 'Sweat Shorts', price: 250000, import_price: 100000, category_id: 10, colors: [{ id: 2, sizes: [] }] };

function createTransactionMock() {
  return {
    product: {
      findUnique: jest.fn().mockImplementation(({ where }: { where: { id: number } }) =>
        Promise.resolve(where.id === 33 ? giftProduct : where.id === 26 ? secondBuyProduct : buyProduct)
      ),
      findMany: jest.fn().mockResolvedValue([buyProduct, secondBuyProduct, giftProduct]),
    },
    buyXGetYPromotion: {
      findUnique: jest.fn(),
      findMany: jest.fn().mockResolvedValue([{
        id: 5,
        gift_product_id: 33,
        buy_product_id: 25,
        buy_quantity: 1,
        gift_quantity: 1,
        max_gift_per_order: null,
        total_gift_limit: null,
        total_gifts_issued: 0,
        start_date: new Date(Date.now() - 60_000),
        end_date: new Date(Date.now() + 60_000),
        status: 'active',
        is_active: true,
        is_stackable: true,
        priority: 1,
      }]),
      updateMany: jest.fn().mockResolvedValue({ count: 1 }),
    },
    sale: { findMany: jest.fn().mockResolvedValue([]) },
    productSize: {
      findUnique: jest.fn(),
      findMany: jest.fn().mockResolvedValue([]),
      updateMany: jest.fn().mockResolvedValue({ count: 1 }),
    },
    user: { findUnique: jest.fn() },
    order: { create: jest.fn().mockResolvedValue({ id: 777 }) },
  };
}

type TransactionMock = ReturnType<typeof createTransactionMock>;
let tx: TransactionMock;

beforeEach(() => {
  jest.clearAllMocks();

  giftProduct.colors[0].sizes = [];
  tx = createTransactionMock();

  (prisma.$transaction as jest.Mock).mockImplementation(async (cb: unknown) => {
    if (typeof cb !== 'function') throw new TypeError('Expected transaction callback');
    return (cb as (transaction: TransactionMock) => unknown)(tx);
  });
});

describe('createOrderController – ràng buộc Buy X Get Y cho quà tặng', () => {
  it('từ chối quà tặng không có promotion_id', async () => {
    const req = mockReq([{ product_id: 33, quantity: 1, is_gift: true }]);
    const res = mockRes();

    await createOrderController(req, res);

    expect(tx.order.create).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    const payload = (res.json as jest.Mock).mock.calls[0][0];
    expect(payload.message).toContain('missing promotion reference');
  });

  it('từ chối khi promotion không tặng đúng sản phẩm quà', async () => {
    tx.buyXGetYPromotion.findMany.mockResolvedValue([{ id: 5, gift_product_id: 999 }]);

    const req = mockReq([{ product_id: 33, quantity: 1, is_gift: true, promotion_id: 5 }]);
    const res = mockRes();

    await createOrderController(req, res);

    expect(tx.order.create).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    const payload = (res.json as jest.Mock).mock.calls[0][0];
    expect(payload.message).toContain('promotion is invalid');
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
    expect(buyItem.import_price_snapshot).toBe(80000);
    expect(giftItem).toMatchObject({
      product_id: 33, quantity: 1, price: 0, import_price_snapshot: 100000,
      is_gift: true, promotion_id: 5, discount_amount: 0, payable_amount: 0,
    });
    expect(tx.order.create.mock.calls[0][0].data.shipping_fee).toBe(20000);
    expect(tx.order.create.mock.calls[0][0].data.total_price).toBe(420000);
  });

  it('phân bổ tồn kho chung khi hai khuyến mãi tặng cùng một sản phẩm', async () => {
    giftProduct.colors[0].sizes = [
      { id: 8, color_id: 2, stock: 1 },
      { id: 9, color_id: 2, stock: 1 },
    ];
    tx.productSize.findMany.mockResolvedValue([
      { id: 8, stock: 1 },
      { id: 9, stock: 1 },
    ]);
    tx.buyXGetYPromotion.findMany.mockResolvedValue([
      {
        id: 5, gift_product_id: 33, buy_product_id: 25, buy_quantity: 1, gift_quantity: 1,
        max_gift_per_order: null, total_gift_limit: null, total_gifts_issued: 0,
        start_date: new Date(Date.now() - 60_000), end_date: new Date(Date.now() + 60_000),
        status: 'active', is_active: true, is_stackable: true, priority: 1,
      },
      {
        id: 6, gift_product_id: 33, buy_product_id: 26, buy_quantity: 1, gift_quantity: 1,
        max_gift_per_order: null, total_gift_limit: null, total_gifts_issued: 0,
        start_date: new Date(Date.now() - 60_000), end_date: new Date(Date.now() + 60_000),
        status: 'active', is_active: true, is_stackable: true, priority: 1,
      },
    ] as never);

    const req = mockReq([
      { product_id: 25, quantity: 1 },
      { product_id: 26, quantity: 1 },
      { product_id: 33, quantity: 1, is_gift: true, promotion_id: 5, color_id: 2, size_id: 8 },
      { product_id: 33, quantity: 1, is_gift: true, promotion_id: 6, color_id: 2, size_id: 8 },
    ]);
    const res = mockRes();

    await createOrderController(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    const createdItems = tx.order.create.mock.calls[0][0].data.items.create;
    const giftItems = createdItems.filter((item: { is_gift: boolean }) => item.is_gift);
    expect(giftItems.reduce((sum: number, item: { quantity: number }) => sum + item.quantity, 0)).toBe(2);
    expect(giftItems.map((item: { size_id: number; quantity: number }) => [item.size_id, item.quantity])).toEqual([[8, 1], [9, 1]]);
  });

  it('từ chối quà từ khuyến mãi ưu tiên thấp khi khuyến mãi không cộng dồn ưu tiên cao hơn đã áp dụng', async () => {
    const highPriorityPromotion = {
      id: 5, gift_product_id: 33, buy_product_id: 25, buy_quantity: 1, gift_quantity: 1,
      max_gift_per_order: null, total_gift_limit: null, total_gifts_issued: 0,
      start_date: new Date(Date.now() - 60_000), end_date: new Date(Date.now() + 60_000),
      status: 'active', is_active: true, is_stackable: false, priority: 10,
    };
    const lowerPriorityPromotion = {
      ...highPriorityPromotion, id: 6, is_stackable: true, priority: 1,
    };
    tx.buyXGetYPromotion.findMany.mockImplementation(async ({ where }: { where: { id?: { in: number[] } } }) =>
      where.id ? [highPriorityPromotion, lowerPriorityPromotion] : [highPriorityPromotion, lowerPriorityPromotion]
    );

    const req = mockReq([
      { product_id: 25, quantity: 1 },
      { product_id: 33, quantity: 1, is_gift: true, promotion_id: 5 },
      { product_id: 33, quantity: 1, is_gift: true, promotion_id: 6 },
    ]);
    const res = mockRes();

    await createOrderController(req, res);

    expect(tx.order.create).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      message: expect.stringContaining('promotion is invalid for gift item'),
    }));
  });


  it('rejects checkout rather than silently reducing a gift when stock is no longer enough', async () => {
    giftProduct.colors[0].sizes = [
      { id: 8, color_id: 2, stock: 1 },
      { id: 9, color_id: 2, stock: 2 },
    ];
    tx.productSize.findMany.mockResolvedValue([
      { id: 8, stock: 1 },
      { id: 9, stock: 2 },
    ]);
    tx.buyXGetYPromotion.findMany.mockResolvedValue([{
      id: 5, gift_product_id: 33, buy_product_id: 25, buy_quantity: 1, gift_quantity: 5,
      max_gift_per_order: null, total_gift_limit: null, total_gifts_issued: 0,
      start_date: new Date(Date.now() - 60_000), end_date: new Date(Date.now() + 60_000),
      status: 'active', is_active: true, is_stackable: true, priority: 1,
    }] as never);

    const req = mockReq([
      { product_id: 25, quantity: 1 },
      { product_id: 33, quantity: 5, is_gift: true, promotion_id: 5, color_id: 2, size_id: 8 },
    ]);
    const res = mockRes();
    await createOrderController(req, res);

    expect(tx.order.create).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      message: expect.stringContaining('Gift stock changed while checking out'),
    }));
  });

  it('chia số quà qua các size còn hàng thay vì từ chối khi size đã chọn không đủ', async () => {
    giftProduct.colors[0].sizes = [
      { id: 8, color_id: 2, stock: 1 },
      { id: 9, color_id: 2, stock: 2 },
    ];
    const req = mockReq([
      { product_id: 25, quantity: 3 },
      { product_id: 33, quantity: 3, is_gift: true, promotion_id: 5, color_id: 2, size_id: 8 },
    ]);
    const res = mockRes();

    await createOrderController(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    const createdOrder = tx.order.create.mock.calls[0][0].data;
    const createdGiftItems = createdOrder.items.create.filter((item: { is_gift: boolean }) => item.is_gift);
    expect(createdGiftItems).toEqual([
      expect.objectContaining({ product_id: 33, color_id: 2, size_id: 8, quantity: 1, promotion_id: 5 }),
      expect.objectContaining({ product_id: 33, color_id: 2, size_id: 9, quantity: 2, promotion_id: 5 }),
    ]);
    expect(tx.buyXGetYPromotion.updateMany).toHaveBeenCalledWith(expect.objectContaining({
      data: { total_gifts_issued: { increment: 3 } },
    }));
  });
});
