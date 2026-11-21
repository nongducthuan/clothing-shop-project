import { BadRequestException } from '@nestjs/common';
import { CustomerPaymentService } from '../../customer/services/customer-payment.service';
import { PrismaService } from '../../prisma/prisma.service';
import { SocketService } from '../../socket/socket.service';

const prismaMock = {
  order: { findUnique: jest.fn(), update: jest.fn() },
};

const socketMock = {
  sendNotification: jest.fn(),
};

const service = new CustomerPaymentService(
  prismaMock as unknown as PrismaService,
  socketMock as unknown as SocketService,
);

beforeEach(() => {
  jest.clearAllMocks();
});

describe('CustomerPaymentService.repayMoMo', () => {
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
    prismaMock.order.update.mockResolvedValue({});

    const result = await service.repayMoMo('400', { new_payment_method: 'cod' }, customerUser);

    expect(prismaMock.order.update).toHaveBeenCalledWith({
      where: { id: 400 },
      data: { payment_method: 'cod' },
    });
    expect(result).toMatchObject({ payUrl: null, payment_method: 'cod' });
  });
});
