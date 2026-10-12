import { Request, Response } from 'express';

jest.mock('../../../prisma/client', () => ({
  __esModule: true,
  default: {
    order: { findUnique: jest.fn(), update: jest.fn() },
  },
}));

import prisma from '../../../prisma/client';
import { repayMoMoController } from '../../controllers/customer/paymentController';

function mockRes() {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  } as unknown as Response;
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe('repayMoMoController', () => {
  it('blocks repayment for a Return_Approved order', async () => {
    (prisma.order.findUnique as jest.Mock).mockResolvedValue({
      id: 326,
      user_id: 9,
      email: 'customer@example.com',
      status: 'Return_Approved',
      payment_status: 'Refunded',
      payment_method: 'momo',
      total_price: 420000,
    });

    const req = {
      params: { id: '326' },
      body: { new_payment_method: 'momo' },
      user: { id: 9, role: 'customer' },
    } as unknown as Request;
    const res = mockRes();

    await repayMoMoController(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Cannot change payment method or pay for a closed order.',
    });
    expect(prisma.order.update).not.toHaveBeenCalled();
  });

  const baseOrder = {
    id: 400,
    user_id: 9,
    email: 'customer@example.com',
    payment_status: 'Unpaid',
    payment_method: 'momo',
    total_price: 420000,
  };

  function repayReq(newMethod: string) {
    return {
      params: { id: '400' },
      body: { new_payment_method: newMethod },
      user: { id: 9, role: 'customer' },
    } as unknown as Request;
  }

  it.each(['Shipping', 'Delivered', 'Return_Requested', 'Return_Rejected'])(
    'blocks repayment for a %s order',
    async (status) => {
      (prisma.order.findUnique as jest.Mock).mockResolvedValue({ ...baseOrder, status });
      const res = mockRes();

      await repayMoMoController(repayReq('cod'), res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Payment can only be changed or retried while the order is Pending or Confirmed.',
      });
      expect(prisma.order.update).not.toHaveBeenCalled();
    }
  );

  it.each(['Pending', 'Confirmed'])('still lets the customer switch to COD on a %s order', async (status) => {
    (prisma.order.findUnique as jest.Mock).mockResolvedValue({ ...baseOrder, status });
    (prisma.order.update as jest.Mock).mockResolvedValue({});
    const res = mockRes();

    await repayMoMoController(repayReq('cod'), res);

    expect(res.status).not.toHaveBeenCalled();
    expect(prisma.order.update).toHaveBeenCalledWith({
      where: { id: 400 },
      data: { payment_method: 'cod' },
    });
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ payUrl: null, payment_method: 'cod' }));
  });
});
