import { StorefrontPaymentService } from '../../storefront/services/storefront-payment.service';
import { PrismaService } from '../../prisma/prisma.service';
import { SocketService } from '../../socket/socket.service';

jest.mock('../../services/orderStatusService', () => ({
  changeOrderStatusLogicTx: jest.fn().mockResolvedValue(undefined),
}));
jest.mock('../../payment/momo', () => ({
  getMomoPayUrl: jest.fn(),
  verifyMomoSignature: jest.fn().mockReturnValue(true),
}));

const prismaMock = { $transaction: jest.fn(), order: { findUnique: jest.fn() } };
const socketMock = { sendNotification: jest.fn().mockResolvedValue(undefined) };
const service = new StorefrontPaymentService(prismaMock as unknown as PrismaService, socketMock as unknown as SocketService);

function useTx(order: Record<string, unknown>, confirmations: { note: string }[]) {
  const tx = {
    order: {
      findUnique: jest.fn().mockResolvedValue({ id: 326, status: 'Confirmed', payment_status: 'Paid', payment_method: 'momo', total_price: 420000, ...order }),
      updateMany: jest.fn().mockResolvedValue({ count: 1 }),
    },
    paymentStatusLog: { findMany: jest.fn().mockResolvedValue(confirmations), create: jest.fn().mockResolvedValue({}) },
  };
  prismaMock.$transaction.mockImplementation((cb: (c: typeof tx) => unknown) => cb(tx));
  return tx;
}

beforeEach(() => {
  jest.clearAllMocks();
  prismaMock.order.findUnique.mockResolvedValue({ id: 326, payment_method: 'momo', total_price: 420000 });
});

describe('payment confirmation records', () => {
  it('logs the transaction reference when an unpaid order is settled', async () => {
    const tx = useTx({ status: 'Pending', payment_status: 'Unpaid' }, []);
    tx.order.findUnique.mockResolvedValueOnce({ id: 326, status: 'Pending', payment_status: 'Unpaid', payment_method: 'momo', total_price: 420000 });
    await service.momoCallback({ orderId: '326_111', resultCode: 0, amount: '420000' });
    expect(tx.paymentStatusLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ order_id: 326, to_status: 'Paid', note: 'Payment confirmed via momo (326_111)' }),
    });
  });
});

describe('repeated success callbacks for an already-paid order', () => {
  it('treats a retry of the SAME transaction as a normal paid result', async () => {
    const tx = useTx({}, [{ note: 'Payment confirmed via momo (326_111)' }]);
    await service.momoCallback({ orderId: '326_111', resultCode: 0, amount: '420000' });
    expect(tx.paymentStatusLog.create).not.toHaveBeenCalled();
    expect(socketMock.sendNotification).toHaveBeenCalledTimes(1);
  });

  it('records a duplicate payment when a DIFFERENT transaction is reported', async () => {
    const tx = useTx({}, [{ note: 'Payment confirmed via momo (326_111)' }]);
    await service.momoCallback({ orderId: '326_222', resultCode: 0, amount: '420000' });
    expect(tx.paymentStatusLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ order_id: 326, note: expect.stringContaining('Duplicate momo payment (326_222)') }),
    });
    expect(socketMock.sendNotification).not.toHaveBeenCalled();
  });

  it('does not flag orders paid before confirmations were recorded', async () => {
    const tx = useTx({}, []);
    await service.momoCallback({ orderId: '326_999', resultCode: 0, amount: '420000' });
    expect(tx.paymentStatusLog.create).not.toHaveBeenCalled();
  });

  it('tells the customer on the return page that the extra payment will be refunded', async () => {
    useTx({}, [{ note: 'Payment confirmed via momo (326_111)' }]);
    const result = await service.momoReturn({ orderId: '326_222', resultCode: '0', amount: '420000' });
    expect(result).toMatchObject({ success: true, orderId: 326, message: expect.stringContaining('refund') });
  });
});
