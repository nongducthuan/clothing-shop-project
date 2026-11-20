import { BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AdminCatalogService } from '../../admin/services/admin-catalog.service';

const prismaMock = {
  banner: { findMany: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn() },
  productColor: { create: jest.fn(), delete: jest.fn() },
  productSize: { findFirst: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn(), findUnique: jest.fn() },
  product: { findMany: jest.fn() },
};
const service = new AdminCatalogService(prismaMock as unknown as PrismaService);

beforeEach(() => jest.clearAllMocks());

describe('AdminCatalogService', () => {
  it('creates banners with canonical/localized title fallbacks', async () => {
    prismaMock.banner.create.mockResolvedValue({ id: 14 });
    await expect(service.addBanner({
      image_url: '/banner.jpg',
      title_vi: 'Khuyến mãi',
      subtitle: 'Sale',
    })).resolves.toEqual({ id: 14, message: 'Banner added successfully' });
    expect(prismaMock.banner.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        title: 'Khuyến mãi',
        title_vi: 'Khuyến mãi',
        title_en: 'Khuyến mãi',
      }),
    }));
  });

  it('returns the prior validation errors for invalid size input', async () => {
    await expect(service.addSize('2', { size: '', stock: 3 })).rejects.toBeInstanceOf(BadRequestException);
    await expect(service.addSize('2', { size: 'M', stock: -1 })).rejects.toBeInstanceOf(BadRequestException);
    expect(prismaMock.productSize.findFirst).not.toHaveBeenCalled();
  });

  it('prevents duplicate size creation unless increment was requested', async () => {
    prismaMock.productSize.findFirst.mockResolvedValue({ id: 4, stock: 7 });
    await expect(service.addSize('2', { size: 'M', stock: 2 })).rejects.toBeInstanceOf(BadRequestException);
    prismaMock.productSize.update.mockResolvedValue({ id: 4, stock: 9 });
    await expect(service.addSize('2', { size: 'M', stock: 2, increment: true })).resolves.toEqual({ id: 4 });
    expect(prismaMock.productSize.update).toHaveBeenCalledWith({
      where: { id: 4 },
      data: { stock: { increment: 2 } },
    });
  });

  it('returns 404 when updating a size that does not exist', async () => {
    prismaMock.productSize.findUnique.mockResolvedValue(null);
    await expect(service.updateSize('404', 10)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('sets stock to an absolute non-negative integer', async () => {
    prismaMock.productSize.findUnique.mockResolvedValue({ id: 3 });
    prismaMock.productSize.update.mockResolvedValue({ id: 3, stock: 11 });
    await expect(service.updateSize('3', 11)).resolves.toEqual({ id: 3, stock: 11 });
    expect(prismaMock.productSize.update).toHaveBeenCalledWith({
      where: { id: 3 },
      data: { stock: 11 },
    });
  });

  it('flattens nested products, colors and sizes for the inventory response', async () => {
    prismaMock.product.findMany.mockResolvedValue([{
      id: 7,
      name: 'T-shirt',
      colors: [{ color_name: 'Black', sizes: [{ size: 'M', stock: 5 }] }],
    }]);
    await expect(service.getInventory()).resolves.toEqual({
      success: true,
      inventory: [{
        product_id: 7,
        product_name: 'T-shirt',
        color_name: 'Black',
        size: 'M',
        stock: 5,
      }],
    });
  });
});
