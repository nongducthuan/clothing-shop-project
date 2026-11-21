import { CustomerPaymentService } from '../../customer/services/customer-payment.service';
import { PrismaService } from '../../prisma/prisma.service';
import { SocketService } from '../../socket/socket.service';

jest.mock('../../services/orderStatusService', () => ({
  changeOrderStatusLogicTx: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('../../utils/momoService', () => ({
  getMomoPayUrl: jest.fn(),
  verifyMomoSignature: jest.fn().mockReturnValue(true),
}));

const prismaMock = {
  $transaction: jest.fn(),
  order: { findUnique: jest.fn(), updateMany: jest.fn(), update: jest.fn() },
  paymentStatusLog: { create: jest.fn().mockResolvedValue({}) },
};

const socketMock = {
  sendNotification: jest.fn().mockResolvedValue(undefined),
};

const service = new CustomerPaymentService(
  prismaMock as unknown as PrismaService,
  socketMock as unknown as SocketService,
);

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
  prismaMock.$transaction.mockImplementation((callback: (client: typeof tx) => unknown) => callback(tx));
  prismaMock.order.findUnique.mockResolvedValue({
    id: 326,
    status: 'Pending',
    payment_status: 'Paid',
    payment_method: 'momo',
    total_price: 420000,
  });
  prismaMock.order.updateMany.mockResolvedValue({ count: 1 });
});

describe('CustomerPaymentService.momoCallback payment settlement', () => {
  it('accepts a valid MoMo payment after the order payment method was changed to VNPay', async () => {
    const result = await service.momoCallback({ orderId: '326', resultCode: 0, amount: '420000' });

    expect(prismaMock.$transaction).toHaveBeenCalled();
    expect(result).toBeUndefined();
  });
});

describe('CustomerPaymentService.momoCallback late callback', () => {
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
    prismaMock.$transaction.mockImplementation((callback: (client: typeof tx) => unknown) => callback(tx));

    const result = await service.momoCallback({ orderId: '326_1720000000000', resultCode: 0, amount: '420000' });

    expect(tx.order.updateMany).not.toHaveBeenCalled();
    expect(tx.paymentStatusLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        order_id: 326,
        from_status: 'Unpaid',
        to_status: 'Unpaid',
        note: expect.stringContaining('manual reconciliation required'),
      }),
    });
    expect(result).toBeUndefined();
  });
});
