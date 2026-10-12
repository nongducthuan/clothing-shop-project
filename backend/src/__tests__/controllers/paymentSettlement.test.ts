import { Request, Response } from 'express';

jest.mock('../../../prisma/client', () => ({
  __esModule: true,
  default: {
    $transaction: jest.fn(),
    order: { findUnique: jest.fn(), updateMany: jest.fn(), update: jest.fn() },
    paymentStatusLog: { create: jest.fn().mockResolvedValue({}) },
  },
}));

jest.mock('../../services/orderStatusService', () => ({
  changeOrderStatusLogicTx: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('../../utils/momoService', () => ({
  getMomoPayUrl: jest.fn(),
  verifyMomoSignature: jest.fn().mockReturnValue(true),
}));

jest.mock('../../utils/socket', () => ({
  sendNotification: jest.fn().mockResolvedValue(undefined),
}));

import prisma from '../../../prisma/client';
import { momoCallback } from '../../controllers/customer/paymentController';

function mockRes() {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    send: jest.fn().mockReturnThis(),
  } as unknown as Response;
}

beforeEach(() => {
  jest.clearAllMocks();
  const tx = {
    order: {
      findUnique: jest.fn()
        .mockResolvedValueOnce({
          id: 326,
          status: 'Pending',
          payment_status: 'Unpaid',
          payment_method: 'vnpay',
          total_price: 420000,
        })
        .mockResolvedValueOnce({
          id: 326,
          status: 'Pending',
          payment_status: 'Paid',
          payment_method: 'momo',
          total_price: 420000,
        }),
      updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      update: jest.fn().mockResolvedValue({}),
    },
    paymentStatusLog: { create: jest.fn().mockResolvedValue({}) },
  };
  (prisma.$transaction as jest.Mock).mockImplementation((callback: (client: typeof tx) => unknown) => callback(tx));
  (prisma.order.findUnique as jest.Mock).mockResolvedValue({
    id: 326,
    status: 'Pending',
    payment_status: 'Paid',
    payment_method: 'momo',
    total_price: 420000,
  });
  (prisma.order.updateMany as jest.Mock).mockResolvedValue({ count: 1 });
});

describe('momoCallback payment settlement', () => {
  it('accepts a valid MoMo payment after the order payment method was changed to VNPay', async () => {
    const req = {
      body: { orderId: '326', resultCode: 0, amount: '420000' },
    } as unknown as Request;
    const res = mockRes();

    await momoCallback(req, res);

    expect(prisma.$transaction).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(204);
  });
});


describe('late MoMo callback', () => {
  it('does not mark a Shipping order Paid and records reconciliation required', async () => {
    const tx = {
      order: {
        findUnique: jest.fn().mockResolvedValue({
          id: 326,
          status: 'Shipping',
          payment_status: 'Unpaid',
          payment_method: 'cod',
          total_price: 420000,
        }),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        update: jest.fn().mockResolvedValue({}),
      },
      paymentStatusLog: { create: jest.fn().mockResolvedValue({}) },
    };
    (prisma.$transaction as jest.Mock).mockImplementation((callback: (client: typeof tx) => unknown) => callback(tx));
    const req = {
      body: { orderId: '326_1720000000000', resultCode: 0, amount: '420000' },
    } as unknown as Request;
    const res = mockRes();

    await momoCallback(req, res);

    expect(tx.order.updateMany).not.toHaveBeenCalled();
    expect(tx.paymentStatusLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        order_id: 326,
        from_status: 'Unpaid',
        to_status: 'Unpaid',
        note: expect.stringContaining('manual reconciliation required'),
      }),
    });
    expect(res.status).toHaveBeenCalledWith(204);
  });
});
