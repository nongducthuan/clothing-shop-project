import { Request, Response } from 'express';

// ─── Mock Prisma before importing the controller ──────────────────────────────
jest.mock('../../../prisma/client', () => ({
  __esModule: true,
  default: {
    $transaction: jest.fn(),
    order: { findUnique: jest.fn(), update: jest.fn() },
    paymentStatusLog: { create: jest.fn() },
  },
}));

import prisma from '../../../prisma/client';
import { confirmPayment } from '../../controllers/admin/orderController';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function mockRes() {
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  } as unknown as Response;
  return res;
}

function mockReq(payment_status: string, user: any = { id: 9, role: 'admin' }): Request {
  return { params: { id: '326' }, body: { payment_status }, user } as unknown as Request;
}

beforeEach(() => {
  jest.clearAllMocks();
  // confirmPayment dùng $transaction dạng MẢNG [order.update, paymentStatusLog.create]
  (prisma.$transaction as jest.Mock).mockImplementation(async (arg: any) =>
    Array.isArray(arg) ? Promise.all(arg) : arg({})
  );
});

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('confirmPayment – hoàn tác bấm nhầm trạng thái thanh toán', () => {
  it('Paid → Unpaid: cho phép (lỡ bấm Paid nhầm, tiền chưa thu), ghi audit log', async () => {
    (prisma.order.findUnique as jest.Mock).mockResolvedValue({ id: 326, status: 'Delivered', payment_status: 'Paid' });

    const res = mockRes();
    await confirmPayment(mockReq('Unpaid'), res);

    expect(res.json).toHaveBeenCalledWith({ message: 'Payment status updated to Unpaid' });
    expect(prisma.order.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 326 }, data: { payment_status: 'Unpaid' } })
    );
    expect(prisma.paymentStatusLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ from_status: 'Paid', to_status: 'Unpaid' }),
      })
    );
  });

  it('Unpaid → Paid: luồng thu tiền bình thường vẫn chạy', async () => {
    (prisma.order.findUnique as jest.Mock).mockResolvedValue({ id: 326, status: 'Pending', payment_status: 'Unpaid' });

    const res = mockRes();
    await confirmPayment(mockReq('Paid'), res);

    expect(res.json).toHaveBeenCalledWith({ message: 'Payment status updated to Paid' });
    expect(prisma.order.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { payment_status: 'Paid' } })
    );
  });

  it('Refunded → Paid: hoàn tác "hoàn nhầm" (có sẵn trước đó) vẫn giữ nguyên', async () => {
    (prisma.order.findUnique as jest.Mock).mockResolvedValue({ id: 326, status: 'Return_Rejected', payment_status: 'Refunded' });

    const res = mockRes();
    await confirmPayment(mockReq('Paid'), res);

    expect(res.json).toHaveBeenCalledWith({ message: 'Payment status updated to Paid' });
    expect(prisma.paymentStatusLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ from_status: 'Refunded', to_status: 'Paid' }),
      })
    );
  });

  it('Paid → Refunded trên đơn chưa đóng (Delivered): vẫn bị chặn 400', async () => {
    (prisma.order.findUnique as jest.Mock).mockResolvedValue({ id: 326, status: 'Delivered', payment_status: 'Paid' });

    const res = mockRes();
    await confirmPayment(mockReq('Refunded'), res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(prisma.order.update).not.toHaveBeenCalled();
  });
});