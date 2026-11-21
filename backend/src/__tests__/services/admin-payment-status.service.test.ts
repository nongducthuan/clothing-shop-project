import { HttpException } from '@nestjs/common';
import { AdminOrderService } from '../../admin/services/admin-order.service';
import { PrismaService } from '../../prisma/prisma.service';
import { SocketService } from '../../socket/socket.service';

const prismaMock = {
  $transaction: jest.fn(),
  order: { findUnique: jest.fn(), update: jest.fn() },
  paymentStatusLog: { create: jest.fn() },
};

const socketMock = {
  sendNotification: jest.fn(),
};

const service = new AdminOrderService(
  prismaMock as unknown as PrismaService,
  socketMock as unknown as SocketService,
);

beforeEach(() => {
  jest.clearAllMocks();
  prismaMock.$transaction.mockImplementation(async (arg: unknown) => {
    if (Array.isArray(arg)) return Promise.all(arg);
    if (typeof arg === 'function') return arg({});
    return undefined;
  });
});

describe('AdminOrderService.confirmPayment – hoàn tác bấm nhầm trạng thái thanh toán', () => {
  it('Paid → Unpaid: cho phép (lỡ bấm Paid nhầm, tiền chưa thu), ghi audit log', async () => {
    prismaMock.order.findUnique.mockResolvedValue({ id: 326, status: 'Delivered', payment_status: 'Paid' });

    const result = await service.confirmPayment('326', 'Unpaid', 9);

    expect(result).toEqual({ message: 'Payment status updated to Unpaid' });
    expect(prismaMock.order.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 326 }, data: { payment_status: 'Unpaid' } })
    );
    expect(prismaMock.paymentStatusLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ from_status: 'Paid', to_status: 'Unpaid' }),
      })
    );
  });

  it('Unpaid → Paid: luồng thu tiền bình thường vẫn chạy', async () => {
    prismaMock.order.findUnique.mockResolvedValue({ id: 326, status: 'Pending', payment_status: 'Unpaid' });

    const result = await service.confirmPayment('326', 'Paid', 9);

    expect(result).toEqual({ message: 'Payment status updated to Paid' });
    expect(prismaMock.order.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { payment_status: 'Paid' } })
    );
  });

  it('Refunded → Paid: hoàn tác "hoàn nhầm" (có sẵn trước đó) vẫn giữ nguyên', async () => {
    prismaMock.order.findUnique.mockResolvedValue({ id: 326, status: 'Return_Rejected', payment_status: 'Refunded' });

    const result = await service.confirmPayment('326', 'Paid', 9);

    expect(result).toEqual({ message: 'Payment status updated to Paid' });
    expect(prismaMock.paymentStatusLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ from_status: 'Refunded', to_status: 'Paid' }),
      })
    );
  });

  it('Paid → Refunded trên đơn chưa đóng (Delivered): vẫn bị chặn 400', async () => {
    prismaMock.order.findUnique.mockResolvedValue({ id: 326, status: 'Delivered', payment_status: 'Paid' });

    await expect(service.confirmPayment('326', 'Refunded', 9))
      .rejects.toThrow(HttpException);

    expect(prismaMock.order.update).not.toHaveBeenCalled();
  });
});
