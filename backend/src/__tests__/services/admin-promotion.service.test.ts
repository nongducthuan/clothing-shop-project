import { PrismaService } from '../../prisma/prisma.service';
import { AdminPromotionService } from '../../admin/services/admin-promotion.service';

const prismaMock = {
  buyXGetYPromotion: {
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
};
const service = new AdminPromotionService(prismaMock as unknown as PrismaService);

beforeEach(() => jest.clearAllMocks());

describe('AdminPromotionService', () => {
  it('lists active promotions newest first', async () => {
    prismaMock.buyXGetYPromotion.findMany.mockResolvedValue([]);
    await expect(service.getAdminPromotions()).resolves.toEqual([]);
    expect(prismaMock.buyXGetYPromotion.findMany).toHaveBeenCalledWith({
      where: { is_active: true },
      orderBy: { created_at: 'desc' },
    });
  });

  it('creates a promotion and preserves the localized-name fallbacks', async () => {
    prismaMock.buyXGetYPromotion.create.mockResolvedValue({ id: 17 });
    await expect(service.createPromotion({
      name_vi: 'Mua hai tặng một',
      buy_product_id: '1',
      buy_quantity: '2',
      gift_product_id: '3',
      gift_quantity: '1',
      start_date: '2026-11-20T00:00:00.000Z',
      end_date: '2026-12-20T00:00:00.000Z',
    })).resolves.toEqual({ success: true, message: 'Created successfully', id: 17 });

    expect(prismaMock.buyXGetYPromotion.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        name: 'Mua hai tặng một',
        name_vi: 'Mua hai tặng một',
        name_en: 'Mua hai tặng một',
        buy_product_id: 1,
        buy_quantity: 2,
        gift_product_id: 3,
        gift_quantity: 1,
        status: 'active',
      }),
    }));
  });

  it('soft deletes a promotion', async () => {
    prismaMock.buyXGetYPromotion.update.mockResolvedValue({ id: 9, is_active: false });
    await expect(service.deletePromotion('9')).resolves.toEqual({
      success: true,
      message: 'Deleted successfully',
    });
    expect(prismaMock.buyXGetYPromotion.update).toHaveBeenCalledWith({
      where: { id: 9 },
      data: { is_active: false },
    });
  });
});
