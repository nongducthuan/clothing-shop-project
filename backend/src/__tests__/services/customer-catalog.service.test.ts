import { BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CustomerCatalogService } from '../../customer/services/customer-catalog.service';
import { appCache } from '../../utils/cacheService';

const prismaMock = {
  banner: { findMany: jest.fn() },
  membership: { findMany: jest.fn() },
  category: { findMany: jest.fn() },
  product: { findFirst: jest.fn() },
  sale: { findMany: jest.fn() },
};
const service = new CustomerCatalogService(prismaMock as unknown as PrismaService);

beforeEach(() => {
  jest.clearAllMocks();
  appCache.del('categories-preview');
});

describe('CustomerCatalogService', () => {
  it('returns banners in descending id order', async () => {
    prismaMock.banner.findMany.mockResolvedValue([{ id: 3 }, { id: 2 }]);
    await expect(service.getBanners()).resolves.toEqual([{ id: 3 }, { id: 2 }]);
    expect(prismaMock.banner.findMany).toHaveBeenCalledWith({ orderBy: { id: 'desc' } });
  });

  it('returns active membership tiers with the public field selection', async () => {
    prismaMock.membership.findMany.mockResolvedValue([]);
    await service.getMemberships();
    expect(prismaMock.membership.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { is_active: true },
      orderBy: { min_spending: 'asc' },
      select: { id: true, name: true, min_spending: true, discount_percent: true },
    }));
  });

  it('requires gender for category recommendations', async () => {
    await expect(service.getRecommendCategories()).rejects.toBeInstanceOf(BadRequestException);
    expect(prismaMock.category.findMany).not.toHaveBeenCalled();
  });

  it('caches category previews and returns the same cached payload', async () => {
    prismaMock.category.findMany.mockResolvedValue([]);
    await expect(service.getCategoriesWithPreview()).resolves.toEqual({ data: [] });
    await expect(service.getCategoriesWithPreview()).resolves.toEqual({ data: [] });
    expect(prismaMock.category.findMany).toHaveBeenCalledTimes(1);
  });

  it('rejects malformed product ids and missing products with the expected HTTP errors', async () => {
    await expect(service.getProductDetail('not-a-number')).rejects.toBeInstanceOf(BadRequestException);
    prismaMock.product.findFirst.mockResolvedValue(null);
    await expect(service.getProductDetail('12')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('returns active customer sales in the existing response envelope', async () => {
    prismaMock.sale.findMany.mockResolvedValue([{ id: 9 }]);
    await expect(service.getActiveSales()).resolves.toEqual({
      success: true,
      data: [{ id: 9 }],
    });
    expect(prismaMock.sale.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ status: true }),
    }));
  });
});
