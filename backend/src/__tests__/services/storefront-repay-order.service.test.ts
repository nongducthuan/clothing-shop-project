import { BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { StorefrontPaymentService } from '../../storefront/services/storefront-payment.service';
import { PrismaService } from '../../prisma/prisma.service';
import { SocketService } from '../../socket/socket.service';
import * as paymentModule from '../../payment/momo';

jest.mock('../../payment/momo', () => ({
  ...jest.requireActual('../../payment/momo'),
  getMomoPayUrl: jest.fn(),
}));

const prismaMock = {
  order: { findUnique: jest.fn(), findFirst: jest.fn(), update: jest.fn(), updateMany: jest.fn() },
};

const socketMock = {
  sendNotification: jest.fn(),
};

const service = new StorefrontPaymentService(
  prismaMock as unknown as PrismaService,
  socketMock as unknown as SocketService,
);

beforeEach(() => {
  jest.clearAllMocks();
});

describe('StorefrontPaymentService.repayMoMo', () => {
  const customerUser = { id: 9, role: 'customer' as const };

  it('blocks repayment for a Return_Approved order', async () => {
    prismaMock.order.findUnique.mockResolvedValue({
      id: 326,
      user_id: 9,
      email: 'customer@example.com',
      status: 'Return_Approved',
      payment_status: 'Refunded',
      payment_method: 'momo',
      total_price: 420000,
    });

    await expect(service.repayMoMo('326', { new_payment_method: 'momo' }, customerUser))
      .rejects.toThrow(BadRequestException);

    expect(prismaMock.order.update).not.toHaveBeenCalled();
  });

  const baseOrder = {
    id: 400,
    user_id: 9,
    email: 'customer@example.com',
    payment_status: 'Unpaid',
    payment_method: 'momo',
    total_price: 420000,
  };

  it.each(['Shipping', 'Delivered', 'Return_Requested', 'Return_Rejected'])(
    'blocks repayment for a %s order',
    async (status) => {
      prismaMock.order.findUnique.mockResolvedValue({ ...baseOrder, status });

      await expect(service.repayMoMo('400', { new_payment_method: 'cod' }, customerUser))
        .rejects.toThrow(BadRequestException);

      expect(prismaMock.order.update).not.toHaveBeenCalled();
    }
  );

  it.each(['Pending', 'Confirmed'])('still lets the customer switch to COD on a %s order', async (status) => {
    prismaMock.order.findUnique.mockResolvedValue({ ...baseOrder, status });
    prismaMock.order.updateMany.mockResolvedValue({ count: 1 });

    const result = await service.repayMoMo('400', { new_payment_method: 'cod' }, customerUser);

    expect(prismaMock.order.updateMany).toHaveBeenCalledWith({
      where: {
        id: 400,
        payment_status: 'Unpaid',
        status: { in: ['Pending', 'Confirmed'] },
      },
      data: { payment_method: 'cod' },
    });
    expect(result).toMatchObject({ payUrl: null, payment_method: 'cod' });
  });

  it('rejects when order status/payment_status changes concurrently while MoMo request is in flight', async () => {
    prismaMock.order.findUnique.mockResolvedValue({
      ...baseOrder,
      status: 'Pending',
      payment_method: 'cod',
    });
    (paymentModule.getMomoPayUrl as jest.Mock).mockResolvedValue({ payUrl: 'https://momo.test/pay' });
    prismaMock.order.updateMany.mockResolvedValue({ count: 0 });

    await expect(service.repayMoMo('400', { new_payment_method: 'momo' }, customerUser))
      .rejects.toThrow(BadRequestException);
  });

  it('blocks repayment for a Pending order that is already Refunded', async () => {
    prismaMock.order.findUnique.mockResolvedValue({
      ...baseOrder,
      status: 'Pending',
      payment_status: 'Refunded',
    });

    await expect(service.repayMoMo('400', { new_payment_method: 'momo' }, customerUser))
      .rejects.toThrow(BadRequestException);

    expect(prismaMock.order.update).not.toHaveBeenCalled();
  });

  it('throws and does not mutate payment_method when MoMo returns no payUrl', async () => {
    prismaMock.order.findUnique.mockResolvedValue({
      ...baseOrder,
      status: 'Pending',
      payment_method: 'cod',
    });
    (paymentModule.getMomoPayUrl as jest.Mock).mockResolvedValue({ resultCode: 99, message: 'MoMo error' });

    await expect(service.repayMoMo('400', { new_payment_method: 'momo' }, customerUser))
      .rejects.toThrow(InternalServerErrorException);

    expect(prismaMock.order.update).not.toHaveBeenCalled();
  });
});
