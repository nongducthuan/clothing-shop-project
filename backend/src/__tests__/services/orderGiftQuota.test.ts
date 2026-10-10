jest.mock('../../../prisma/client', () => ({
  __esModule: true,
  default: { $transaction: jest.fn() },
}));

import type { TxClient } from '../../types/orderTypes';
import { updateGiftPromotionQuota } from '../../services/orderStatusService';

function makeTx(issued: number, limit: number | null) {
  return {
    buyXGetYPromotion: {
      findUnique: jest.fn().mockResolvedValue({ total_gifts_issued: issued, total_gift_limit: limit }),
      updateMany: jest.fn().mockResolvedValue({ count: 1 }),
    },
  } as unknown as TxClient & {
    buyXGetYPromotion: {
      findUnique: jest.Mock;
      updateMany: jest.Mock;
    };
  };
}

const giftItems = [
  { is_gift: true, promotion_id: 7, quantity: 2 },
  { is_gift: true, promotion_id: 7, quantity: 1 },
  { is_gift: false, promotion_id: null, quantity: 4 },
];

describe('gift promotion quota on order status changes', () => {
  it('releases a cancelled order gift allowance once per promotion', async () => {
    const tx = makeTx(8, 10);
    await updateGiftPromotionQuota(tx, giftItems, 'release');

    expect(tx.buyXGetYPromotion.updateMany).toHaveBeenCalledWith({
      where: { id: 7, total_gifts_issued: 8, total_gift_limit: 10 },
      data: { total_gifts_issued: { decrement: 3 } },
    });
  });

  it('reserves the quota again when a cancelled order is restored', async () => {
    const tx = makeTx(7, 10);
    await updateGiftPromotionQuota(tx, giftItems, 'reserve');

    expect(tx.buyXGetYPromotion.updateMany).toHaveBeenCalledWith({
      where: { id: 7, total_gifts_issued: 7, total_gift_limit: 10 },
      data: { total_gifts_issued: { increment: 3 } },
    });
  });

  it('rejects restoring the order when other orders have consumed the quota', async () => {
    const tx = makeTx(9, 10);
    await expect(updateGiftPromotionQuota(tx, giftItems, 'reserve')).rejects.toMatchObject({
      httpStatus: 409,
      name: 'OrderServiceError',
    });
    expect(tx.buyXGetYPromotion.updateMany).not.toHaveBeenCalled();
  });
});
