import { BadRequestException } from '@nestjs/common';
import { CustomerPromotionService } from '../../customer/services/customer-promotion.service';
import { PrismaService } from '../../prisma/prisma.service';

const prismaMock = {
  buyXGetYPromotion: { findMany: jest.fn() },
  productColor: { findMany: jest.fn() },
};

const service = new CustomerPromotionService(prismaMock as unknown as PrismaService);

const activePromotion = (overrides: Record<string, unknown> = {}) => ({
  id: 5,
  buy_product_id: 25,
  gift_product_id: 33,
  buy_quantity: 1,
  gift_quantity: 2,
  max_gift_per_order: null,
  total_gift_limit: null,
  total_gifts_issued: 0,
  is_active: true,
  status: 'active',
  start_date: new Date(Date.now() - 60_000),
  end_date: new Date(Date.now() + 60_000),
  is_stackable: true,
  priority: 10,
  ...overrides,
});

describe('CustomerPromotionService.calculateCart – shared stock for gift products', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    prismaMock.buyXGetYPromotion.findMany.mockResolvedValue([
      activePromotion({ id: 5, buy_product_id: 25, priority: 10 }),
      activePromotion({ id: 6, buy_product_id: 26, priority: 5 }),
    ]);
    prismaMock.productColor.findMany.mockResolvedValue([{
      id: 2,
      color_name: 'Blue',
      image_url: null,
      sizes: [
        { id: 8, size: 'M', stock: 2 },
        { id: 9, size: 'L', stock: 1 },
      ],
    }]);
  });

  it('does not allocate more gifts across multiple promotions than the gift product stock', async () => {
    const payload = await service.calculateCart({
      cartItems: [
        { product_id: 26, quantity: 1 },
        { product_id: 25, quantity: 1 },
      ],
    });

    const gifts = (payload.data as Record<string, unknown>).giftItems as Array<{
      actual_quantity: number; expected_quantity: number; is_partial_gift: boolean;
    }>;

    expect(gifts).toHaveLength(2);
    expect(gifts.map((gift) => gift.actual_quantity)).toEqual([2, 1]);
    expect(gifts.reduce((sum, gift) => sum + gift.actual_quantity, 0)).toBe(3);
    expect(gifts[1]).toMatchObject({ expected_quantity: 2, actual_quantity: 1, is_partial_gift: true });
    expect(prismaMock.productColor.findMany).toHaveBeenCalledTimes(1);
    expect(prismaMock.buyXGetYPromotion.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ is_active: true, status: 'active' }),
    }));
  });

  it('subtracts units already purchased from stock available for gifts', async () => {
    const payload = await service.calculateCart({
      cartItems: [
        { product_id: 25, quantity: 1 },
        { product_id: 26, quantity: 1 },
        { product_id: 33, quantity: 1 },
      ],
    });

    const gifts = (payload.data as Record<string, unknown>).giftItems;
    expect(gifts).toEqual([{
      promotion_id: 5,
      gift_product_id: 33,
      expected_quantity: 2,
      actual_quantity: 2,
      is_partial_gift: false,
      status: 'FULL',
      is_stackable: true,
      variants: [
        { size_id: 8, color_id: 2, color: 'Blue', size: 'M', stock: 2, image: null },
        { size_id: 9, color_id: 2, color: 'Blue', size: 'L', stock: 1, image: null },
      ],
      message: 'You received 2 free item(s). Please choose color and size.',
    }]);
  });

  it('rejects an empty cart before querying promotions', async () => {
    await expect(service.calculateCart({ cartItems: [] }))
      .rejects.toThrow(BadRequestException);

    expect(prismaMock.buyXGetYPromotion.findMany).not.toHaveBeenCalled();
  });
});
