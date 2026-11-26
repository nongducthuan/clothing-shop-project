import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { appCache } from '../../utils/cacheService';
import type { CategoryPayload } from './admin-catalog.types';

@Injectable()
export class AdminCategoryService {
  constructor(private readonly prisma: PrismaService) {}

  async getCategories() {
    const categories = await this.prisma.category.findMany({
      where: { is_active: true },
      orderBy: { id: 'asc' },
    });

    const enhancedCategories = await Promise.all(categories.map(async (category) => {
      let previewImage: string | null = null;
      if (!category.image_url) {
        const productWithColor = await this.prisma.product.findFirst({
          where: { category_id: category.id },
          include: {
            colors: {
              where: { image_url: { not: '' } },
              take: 1,
            },
          },
        });
        if (productWithColor?.colors?.[0]?.image_url) {
          previewImage = productWithColor.colors[0].image_url;
        }
      }
      return { ...category, preview_image: previewImage };
    }));

    return { data: enhancedCategories };
  }

  getCategoryRecommendations(gender?: string) {
    let recommendations: Array<{ name: string; name_vi: string }> = [];
    if (gender === 'male') {
      recommendations = [
        { name: 'T-Shirts', name_vi: 'Áo Phông' },
        { name: 'Shirts', name_vi: 'Áo Sơ Mi' },
        { name: 'Polo Shirts', name_vi: 'Áo Polo' },
        { name: 'Jeans', name_vi: 'Quần Jeans' },
        { name: 'Trousers/Pants', name_vi: 'Quần Dài' },
        { name: 'Shorts', name_vi: 'Quần Short' },
        { name: 'Hoodies', name_vi: 'Áo Hoodie' },
        { name: 'Jackets', name_vi: 'Áo Khoác' },
        { name: 'Shoes', name_vi: 'Giày Dép' },
      ];
    } else if (gender === 'female') {
      recommendations = [
        { name: 'Dresses', name_vi: 'Đầm / Váy' },
        { name: 'Tops', name_vi: 'Áo Kiểu' },
        { name: 'T-Shirts', name_vi: 'Áo Phông' },
        { name: 'Skirts', name_vi: 'Chân Váy' },
        { name: 'Jeans', name_vi: 'Quần Jeans' },
        { name: 'Trousers/Pants', name_vi: 'Quần Dài' },
        { name: 'Leggings', name_vi: 'Quần Leggings' },
        { name: 'Hoodies', name_vi: 'Áo Hoodie' },
        { name: 'Jackets', name_vi: 'Áo Khoác' },
        { name: 'Shoes', name_vi: 'Giày Dép' },
      ];
    } else {
      recommendations = [
        { name: 'T-Shirts', name_vi: 'Áo Phông' },
        { name: 'Hoodies', name_vi: 'Áo Hoodie' },
        { name: 'Sweaters', name_vi: 'Áo Len' },
        { name: 'Jeans', name_vi: 'Quần Jeans' },
        { name: 'Trousers/Pants', name_vi: 'Quần Dài' },
        { name: 'Jackets', name_vi: 'Áo Khoác' },
        { name: 'Accessories', name_vi: 'Phụ Kiện' },
        { name: 'Shoes', name_vi: 'Giày Dép' },
      ];
    }
    return { data: recommendations };
  }

  async createCategory(payload: CategoryPayload) {
    const { name, name_vi, name_en, gender, image_url } = payload;
    const baseName = name || name_vi || name_en;
    if (!baseName) {
      throw new BadRequestException({ status: 'fail', message: 'Category name is required' });
    }

    const category = await this.prisma.category.create({
      data: {
        name: baseName,
        name_vi: name_vi || baseName || null,
        name_en: name_en || baseName || null,
        gender: (gender || 'unisex') as Prisma.CategoryUncheckedCreateInput['gender'],
        image_url: image_url || null,
      },
    });
    appCache.del('categories-preview');
    return { message: 'Successfully created', id: category.id };
  }

  async updateCategory(id: string, payload: CategoryPayload) {
    const { name, name_vi, name_en, gender, image_url } = payload;
    const baseName = name || name_vi || name_en;
    const existing = await this.prisma.category.findUnique({ where: { id: Number(id) } });
    if (!existing) throw new NotFoundException({ status: 'fail', message: 'Category not found' });

    if (gender && gender !== existing.gender) {
      const mismatchedCount = await this.prisma.product.count({
        where: {
          category_id: Number(id),
          gender: { not: gender as 'male' | 'female' | 'unisex' },
        },
      });
      if (mismatchedCount > 0) {
        throw new BadRequestException({
          status: 'fail',
          message: 'Cannot change category gender while it still contains products with a different gender',
        });
      }
    }

    await this.prisma.category.update({
      where: { id: Number(id) },
      data: {
        name: baseName || undefined,
        name_vi: name_vi !== undefined ? (name_vi || baseName || null) : undefined,
        name_en: name_en !== undefined ? (name_en || baseName || null) : undefined,
        gender: gender as Prisma.CategoryUncheckedUpdateInput['gender'],
        image_url,
      },
    });
    appCache.del('categories-preview');
    return { message: 'Successfully updated' };
  }

  async deleteCategory(id: string) {
    const existing = await this.prisma.category.findUnique({ where: { id: Number(id) } });
    if (!existing) throw new NotFoundException({ status: 'fail', message: 'Category not found' });
    await this.prisma.category.update({
      where: { id: Number(id) },
      data: { is_active: false },
    });
    appCache.del('categories-preview');
    return { message: 'Successfully deleted' };
  }

  async getCategoryImages(id: string) {
    const existing = await this.prisma.category.findUnique({ where: { id: Number(id) } });
    if (!existing) throw new NotFoundException({ status: 'fail', message: 'Category not found' });

    const colors = await this.prisma.productColor.findMany({
      where: {
        product: { category_id: Number(id) },
        image_url: { not: '' },
      },
      select: { image_url: true },
      distinct: ['image_url'],
    });
    return { data: colors };
  }
}
