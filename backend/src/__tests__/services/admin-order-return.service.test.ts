import { HttpException } from '@nestjs/common';
import { AdminOrderService } from '../../admin/services/admin-order.service';
import { AdminReturnService } from '../../admin/services/admin-return.service';
import { PrismaService } from '../../prisma/prisma.service';
import { SocketService } from '../../socket/socket.service';

const deliveredOrder = {
  id: 326,
  status: 'Delivered',
  total_price: 500000,
  user_id: 1,
  voucher_id: null,
  delivered_at: new Date('2026-01-10T00:00:00Z'),
  payment_status: 'Paid',
  items: [],
};

function createTransactionMock() {
  return {
    order: {
      findUnique: jest.fn().mockResolvedValue(deliveredOrder),
      update: jest.fn().mockResolvedValue({}),
    },
    productSize: { findUnique: jest.fn(), update: jest.fn() },
    revenue: { findUnique: jest.fn(), update: jest.fn(), create: jest.fn() },
    user: { findUnique: jest.fn(), update: jest.fn() },
    membership: { findFirst: jest.fn() },
    returnRequest: {
      findUnique: jest.fn(),
      update: jest.fn().mockResolvedValue({}),
      updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      create: jest.fn().mockResolvedValue({}),
    },
    paymentStatusLog: { create: jest.fn() },
    voucher: { findUnique: jest.fn(), update: jest.fn() },
  };
}

type TransactionMock = ReturnType<typeof createTransactionMock>;
let tx: TransactionMock;

const prismaMock = {
  $transaction: jest.fn(),
  order: { findUnique: jest.fn() },
};

const socketMock = {
  sendNotification: jest.fn(),
};

const orderService = new AdminOrderService(
  prismaMock as unknown as PrismaService,
  socketMock as unknown as SocketService,
);

const returnService = new AdminReturnService(
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

describe('AdminOrderService.updateOrderStatus – hoàn tác duyệt nhầm Reject (LEGACY: Return_Rejected → Delivered)', () => {
  it('[legacy] trả ReturnRequest về Pending + xóa lý do trong cùng transaction, KHÔNG đụng doanh thu', async () => {
    prismaMock.order.findUnique.mockResolvedValue({ status: 'Return_Rejected' });
    tx.order.findUnique.mockResolvedValue({ ...deliveredOrder, status: 'Return_Rejected' });

    await expect(orderService.updateOrderStatus('326', 'Delivered'))
      .rejects.toThrow(HttpException);

    expect(prismaMock.$transaction).not.toHaveBeenCalled();
    expect(tx.order.update).not.toHaveBeenCalled();
    expect(tx.returnRequest.updateMany).not.toHaveBeenCalled();
    expect(tx.revenue.update).not.toHaveBeenCalled();
    expect(tx.revenue.create).not.toHaveBeenCalled();
  });
});

describe('AdminOrderService.updateOrderStatus – hoàn tác từ chối nhầm (Return_Rejected → Return_Requested)', () => {
  it('đơn về Return_Requested + ReturnRequest về Pending, KHÔNG đụng kho/doanh thu', async () => {
    prismaMock.order.findUnique.mockResolvedValue({ status: 'Return_Rejected' });
    tx.order.findUnique.mockResolvedValue({ ...deliveredOrder, status: 'Return_Rejected' });

    const result = await orderService.updateOrderStatus('326', 'Return Requested');

    expect(tx.order.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: 'Return_Requested' }) })
    );
    expect(tx.returnRequest.updateMany).toHaveBeenCalledWith({
      where: { order_id: 326 },
      data: { status: 'Pending', admin_response: null },
    });
    expect(tx.productSize.update).not.toHaveBeenCalled();
    expect(tx.revenue.update).not.toHaveBeenCalled();
    expect(tx.revenue.create).not.toHaveBeenCalled();
    expect(result).toMatchObject({ message: 'Order status updated successfully' });
  });
});

describe('AdminReturnService.rejectReturn – từ chối đổi trả', () => {
  it('từ Delivered (sau hoàn tác duyệt nhầm): chỉ đổi nhãn, KHÔNG trừ doanh thu', async () => {
    prismaMock.order.findUnique.mockResolvedValue({ status: 'Delivered' });
    tx.order.findUnique.mockResolvedValue({ ...deliveredOrder, status: 'Delivered' });
    tx.returnRequest.findUnique.mockResolvedValue({ id: 55, order_id: 326, status: 'Pending' });

    const result = await returnService.rejectReturn('326', 'Không đủ bằng chứng');

    expect(tx.returnRequest.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: 'Rejected' }) })
    );
    expect(tx.order.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: 'Return_Rejected' }) })
    );
    expect(tx.revenue.update).not.toHaveBeenCalled();
    expect(tx.revenue.create).not.toHaveBeenCalled();
    expect(result).toEqual({ message: 'Return request rejected successfully.' });
  });

  it('từ Return_Requested (luồng thường): vẫn không đụng doanh thu', async () => {
    prismaMock.order.findUnique.mockResolvedValue({ status: 'Return_Requested' });
    tx.order.findUnique.mockResolvedValue({ ...deliveredOrder, status: 'Return_Requested' });
    tx.returnRequest.findUnique.mockResolvedValue({ id: 55, order_id: 326, status: 'Pending' });

    const result = await returnService.rejectReturn('326', 'Đơn còn cần');

    expect(tx.order.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: 'Return_Rejected' }) })
    );
    expect(tx.revenue.update).not.toHaveBeenCalled();
    expect(tx.revenue.create).not.toHaveBeenCalled();
    expect(result).toEqual({ message: 'Return request rejected successfully.' });
  });
});
