import { changeOrderStatusLogicTx, isOrderServiceError } from '../../services/orderStatusService';
import type { TxClient } from '../../types/orderTypes';

function buildTx(overrides: { updateCount?: number; voucher?: Record<string, unknown> | null; order?: Record<string, unknown> } = {}) {
  const order = {
    id: 10,
    status: 'Pending',
    payment_status: 'Unpaid',
    total_price: 100000,
    user_id: null,
    voucher_id: 9,
    delivered_at: null,
    items: [],
    ...overrides.order,
  };
  const tx = {
    order: {
      findUnique: jest.fn().mockResolvedValue(order),
      updateMany: jest.fn().mockResolvedValue({ count: overrides.updateCount ?? 1 }),
    },
    voucher: {
      findUnique: jest.fn().mockResolvedValue(overrides.voucher === undefined ? { id: 9, usage_limit: 3, used_count: 1 } : overrides.voucher),
      update: jest.fn().mockResolvedValue({}),
      updateMany: jest.fn().mockResolvedValue({ count: 1 }),
    },
    productSize: { findUnique: jest.fn(), update: jest.fn(), updateMany: jest.fn() },
    buyXGetYPromotion: { updateMany: jest.fn().mockResolvedValue({ count: 1 }) },
    paymentStatusLog: { create: jest.fn().mockResolvedValue({}) },
    revenue: { findUnique: jest.fn(), update: jest.fn(), create: jest.fn() },
    user: { findUnique: jest.fn(), update: jest.fn() },
    membership: { findFirst: jest.fn() },
  };
  return tx;
}

describe('changeOrderStatusLogicTx concurrency guard', () => {
  it('compares-and-swaps on the status and payment status it read', async () => {
    const tx = buildTx();
    await changeOrderStatusLogicTx(tx as unknown as TxClient, 10, 'Confirmed');
    expect(tx.order.updateMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 10, status: 'Pending', payment_status: 'Unpaid' },
    }));
  });

  it('aborts with a 409 when another request already changed the order (so the transaction rolls back)', async () => {
    const tx = buildTx({ updateCount: 0 });
    const error = await changeOrderStatusLogicTx(tx as unknown as TxClient, 10, 'Cancelled').catch((e: unknown) => e);
    expect(isOrderServiceError(error)).toBe(true);
    expect((error as { httpStatus: number }).httpStatus).toBe(409);
  });
});

describe('undoing a cancellation', () => {
  it('consumes the voucher use again', async () => {
    const tx = buildTx({ order: { status: 'Cancelled' } });
    await changeOrderStatusLogicTx(tx as unknown as TxClient, 10, 'Pending', { isUndo: true });
    expect(tx.voucher.updateMany).toHaveBeenCalledWith({
      where: { id: 9, usage_limit: { gte: 1 } },
      data: { usage_limit: { decrement: 1 }, used_count: { increment: 1 } },
    });
  });

  it('refuses to restore the order when the voucher has run out meanwhile', async () => {
    const tx = buildTx({ order: { status: 'Cancelled' } });
    tx.voucher.updateMany.mockResolvedValue({ count: 0 });
    const error = await changeOrderStatusLogicTx(tx as unknown as TxClient, 10, 'Pending', { isUndo: true }).catch((e: unknown) => e);
    expect((error as { httpStatus: number }).httpStatus).toBe(409);
    expect(tx.order.updateMany).not.toHaveBeenCalled();
  });

  it('only bumps the counter for unlimited vouchers', async () => {
    const tx = buildTx({ order: { status: 'Cancelled' }, voucher: { id: 9, usage_limit: null, used_count: 4 } });
    await changeOrderStatusLogicTx(tx as unknown as TxClient, 10, 'Pending', { isUndo: true });
    expect(tx.voucher.update).toHaveBeenCalledWith({ where: { id: 9 }, data: { used_count: { increment: 1 } } });
    expect(tx.voucher.updateMany).not.toHaveBeenCalled();
  });
});
