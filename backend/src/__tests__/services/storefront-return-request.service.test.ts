import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { StorefrontReturnService } from '../../storefront/services/storefront-return.service';
import { PrismaService } from '../../prisma/prisma.service';
import { SocketService } from '../../socket/socket.service';

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
  delivered_at: new Date(Date.now() - 24 * 60 * 60 * 1000),
  updated_at: new Date(),
  items: [item118, item119, giftItem120],
};

function createTransactionMock() {
  return {
    order: {
      findFirst: jest.fn().mockResolvedValue(order),
      update: jest.fn().mockResolvedValue(order),
    },
    returnRequest: {
      findUnique: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockImplementation(({ data }: { data: Record<string, unknown> }) => Promise.resolve({ id: 999, ...data })),
    },
  };
}

type TransactionMock = ReturnType<typeof createTransactionMock>;
let tx: TransactionMock;

const prismaMock = {
  $transaction: jest.fn(),
};

const socketMock = {
  sendNotification: jest.fn(),
};

const service = new StorefrontReturnService(
  prismaMock as unknown as PrismaService,
  socketMock as unknown as SocketService,
);

beforeEach(() => {
  jest.clearAllMocks();
  tx = createTransactionMock();

  prismaMock.$transaction.mockImplementation(async (cb: unknown) => {
    if (typeof cb !== 'function') throw new TypeError('Expected transaction callback');
    return (cb as (transaction: TransactionMock) => unknown)(tx);
  });
});

function createdReturnItems() {
  expect(tx.returnRequest.create).toHaveBeenCalledTimes(1);
  return tx.returnRequest.create.mock.calls[0][0].data.items.create;
}

const customerUser = { id: 1, name: 'Test', email: 'customer@example.com', role: 'customer' };

describe('StorefrontReturnService.submitReturnRequest – Buy X Get Y chỉ ràng buộc đúng sản phẩm X', () => {
  it('trả 1 phần sản phẩm KHÔNG phải X (#119) → cho phép, không gom quà Y', async () => {
    const body = {
      reason_code: 'Change mind',
      returnItems: JSON.stringify([{ order_item_id: 119, return_quantity: 1 }]),
    };

    const result = await service.submitReturnRequest('326', body, [], customerUser);

    expect(result).toEqual({ message: 'Return request submitted successfully' });
    expect(createdReturnItems()).toEqual([
      { order_item_id: 119, return_quantity: 1, refund_amount: 147500 },
    ]);
    expect(tx.returnRequest.create.mock.calls[0][0].data.refund_amount).toBe(147500);
  });

  it('trả đủ sản phẩm X (#118) → tự động gom quà Y (#120) với refund = 0', async () => {
    const body = {
      reason_code: 'Change mind',
      returnItems: JSON.stringify([{ order_item_id: 118, return_quantity: 2 }]),
    };

    const result = await service.submitReturnRequest('326', body, [], customerUser);

    expect(result).toEqual({ message: 'Return request submitted successfully' });
    expect(createdReturnItems()).toEqual([
      { order_item_id: 118, return_quantity: 2, refund_amount: 295000 },
      { order_item_id: 120, return_quantity: 1, refund_amount: 0 },
    ]);
    expect(tx.returnRequest.create.mock.calls[0][0].data.refund_amount).toBe(295000);
  });

  it('trả 1 phần sản phẩm X (#118) → bị từ chối (phải hoàn toàn bộ)', async () => {
    const body = {
      reason_code: 'Change mind',
      returnItems: JSON.stringify([{ order_item_id: 118, return_quantity: 1 }]),
    };

    await expect(service.submitReturnRequest('326', body, [], customerUser))
      .rejects.toThrow(BadRequestException);

    expect(tx.returnRequest.create).not.toHaveBeenCalled();
  });

  it('trả cả 2 sản phẩm mua (X + không-X) → quà Y chỉ được gom 1 lần', async () => {
    const body = {
      reason_code: 'Change mind',
      returnItems: JSON.stringify([
        { order_item_id: 118, return_quantity: 2 },
        { order_item_id: 119, return_quantity: 2 },
      ]),
    };

    const result = await service.submitReturnRequest('326', body, [], customerUser);

    expect(result).toEqual({ message: 'Return request submitted successfully' });
    expect(createdReturnItems()).toEqual([
      { order_item_id: 118, return_quantity: 2, refund_amount: 295000 },
      { order_item_id: 119, return_quantity: 2, refund_amount: 295000 },
      { order_item_id: 120, return_quantity: 1, refund_amount: 0 },
    ]);
    expect(tx.returnRequest.create.mock.calls[0][0].data.refund_amount).toBe(590000);
  });

  it('không cho phép trả quà tặng độc lập', async () => {
    const body = {
      reason_code: 'Change mind',
      returnItems: JSON.stringify([{ order_item_id: 120, return_quantity: 1 }]),
    };

    await expect(service.submitReturnRequest('326', body, [], customerUser))
      .rejects.toThrow(BadRequestException);

    expect(tx.returnRequest.create).not.toHaveBeenCalled();
  });
});

describe('CustomerReturnService.submitReturnRequest – chính sách đổi trả 7 ngày', () => {
  const daysAgo = (n: number) => new Date(Date.now() - n * 24 * 60 * 60 * 1000);
  const body = { reason_code: 'Change mind', returnItems: JSON.stringify([{ order_item_id: 119, return_quantity: 1 }]) };

  it('giao 8 ngày trước → 400, không tạo ReturnRequest, không đổi trạng thái đơn', async () => {
    tx.order.findFirst.mockResolvedValue({ ...order, delivered_at: daysAgo(8) });

    await expect(service.submitReturnRequest('326', body, [], customerUser))
      .rejects.toThrow(BadRequestException);

    expect(tx.returnRequest.create).not.toHaveBeenCalled();
    expect(tx.order.update).not.toHaveBeenCalled();
  });

  it('giao 6 ngày trước → vẫn được trả', async () => {
    tx.order.findFirst.mockResolvedValue({ ...order, delivered_at: daysAgo(6) });

    const result = await service.submitReturnRequest('326', body, [], customerUser);

    expect(result).toEqual({ message: 'Return request submitted successfully' });
    expect(tx.returnRequest.create).toHaveBeenCalledTimes(1);
  });

  it('đơn cũ chưa có delivered_at → dùng updated_at làm mốc', async () => {
    tx.order.findFirst.mockResolvedValue({ ...order, delivered_at: null, updated_at: daysAgo(30) });

    await expect(service.submitReturnRequest('326', body, [], customerUser))
      .rejects.toThrow(BadRequestException);
  });

  it('admin được xử lý ngoại lệ ngoài hạn', async () => {
    tx.order.findFirst.mockResolvedValue({ ...order, delivered_at: daysAgo(30) });

    const adminUser = { id: 99, name: 'Admin', email: 'admin@example.com', role: 'admin' };
    const result = await service.submitReturnRequest('326', body, [], adminUser);

    expect(result).toEqual({ message: 'Return request submitted successfully' });
  });

  it('người không phải chủ đơn vẫn nhận 403 (không lộ việc đơn đã hết hạn)', async () => {
    tx.order.findFirst.mockResolvedValue({ ...order, delivered_at: daysAgo(30) });

    const otherUser = { id: 2, name: 'Other', email: 'other@example.com', role: 'customer' };

    await expect(service.submitReturnRequest('326', body, [], otherUser))
      .rejects.toThrow(ForbiddenException);
  });
});
