import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client';
import { SizeEnum } from '../../generated/prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { getErrorMessage } from '../../utils/errorMessage';
import { appCache } from '../../utils/cacheService';

export interface BannerPayload {
  image_url?: string;
  title?: string | null;
  title_vi?: string | null;
  title_en?: string | null;
  subtitle?: string | null;
  subtitle_vi?: string | null;
  subtitle_en?: string | null;
}

export interface ColorPayload {
  color_name?: string | null;
  color_name_vi?: string | null;
  color_name_en?: string | null;
  color_code?: string | null;
  image_url?: string | null;
}

export interface SizePayload {
  size?: string;
  stock?: number | string;
  increment?: boolean;
}

export interface CategoryPayload {
  name?: string;
  name_vi?: string | null;
  name_en?: string | null;
  gender?: string;
  image_url?: string | null;
}

export interface MembershipPayload {
  name?: string;
  min_spending?: string | number;
  discount_percent?: string | number;
}

@Injectable()
export class AdminCatalogService {
  constructor(private readonly prisma: PrismaService) {}

  async getBanners() {
    try {
      return await this.prisma.banner.findMany({ orderBy: { id: 'desc' } });
    } catch (error) {
      console.error(error);
      throw new InternalServerErrorException({ message: 'Server error' });
    }
  }

  async addBanner(payload: BannerPayload) {
    try {
      const { image_url, title, title_vi, title_en, subtitle, subtitle_vi, subtitle_en } = payload;
      const baseTitle = title || title_vi || title_en;
      const banner = await this.prisma.banner.create({
        data: {
          image_url: image_url as string,
          title: baseTitle as string,
          title_vi: title_vi || baseTitle || null,
          title_en: title_en || baseTitle || null,
          subtitle: (subtitle || null) as string,
          subtitle_vi: subtitle_vi || subtitle || null,
          subtitle_en: subtitle_en || subtitle || null,
        },
      });
      return { id: banner.id, message: 'Banner added successfully' };
    } catch (error) {
      console.error(error);
      throw new InternalServerErrorException({ message: 'Server error' });
    }
  }

  async editBanner(id: string, payload: BannerPayload) {
    try {
      const { image_url, title, title_vi, title_en, subtitle, subtitle_vi, subtitle_en } = payload;
      const baseTitle = title || title_vi || title_en;
      await this.prisma.banner.update({
        where: { id: Number(id) },
        data: {
          image_url,
          title: baseTitle || undefined,
          title_vi: title_vi !== undefined ? (title_vi || baseTitle || null) : undefined,
          title_en: title_en !== undefined ? (title_en || baseTitle || null) : undefined,
          subtitle: subtitle !== undefined ? (subtitle || null) : undefined,
          subtitle_vi: subtitle_vi !== undefined ? (subtitle_vi || null) : undefined,
          subtitle_en: subtitle_en !== undefined ? (subtitle_en || null) : undefined,
        },
      });
      return { message: 'Banner updated successfully' };
    } catch (error) {
      console.error(error);
      throw new InternalServerErrorException({ message: 'Server error' });
    }
  }

  async removeBanner(id: string) {
    try {
      await this.prisma.banner.delete({ where: { id: Number(id) } });
      return { message: 'Banner deleted successfully' };
    } catch (error) {
      console.error(error);
      throw new InternalServerErrorException({ message: 'Server error' });
    }
  }

  async addColor(productId: string, payload: ColorPayload) {
    try {
      const { color_name, color_name_vi, color_name_en, color_code, image_url } = payload;
      const baseName = color_name || color_name_vi || color_name_en;
      const color = await this.prisma.productColor.create({
        data: {
          product_id: Number(productId),
          color_name: baseName as string,
          color_name_vi: color_name_vi || baseName || null,
          color_name_en: color_name_en || baseName || null,
          color_code,
          image_url: image_url as string,
        },
      });
      return { id: color.id };
    } catch (error) {
      console.error(error);
      throw new InternalServerErrorException({ message: 'Server error' });
    }
  }

  async removeColor(id: string) {
    try {
      await this.prisma.productColor.delete({ where: { id: Number(id) } });
      return { message: 'Color deleted successfully' };
    } catch (error) {
      console.error(error);
      throw new InternalServerErrorException({ message: 'Server error' });
    }
  }

  async addSize(colorId: string, payload: SizePayload) {
    try {
      const { size, stock, increment } = payload;
      const stockNumber = Number(stock);
      if (!size || typeof size !== 'string') {
        throw new BadRequestException({ message: 'Size is required' });
      }
      if (!Number.isInteger(stockNumber) || stockNumber < 0) {
        throw new BadRequestException({ message: 'Stock must be a non-negative integer' });
      }

      const existing = await this.prisma.productSize.findFirst({
        where: {
          color_id: Number(colorId),
          size: size as Prisma.ProductSizeWhereInput['size'],
        },
      });

      if (existing) {
        if (increment) {
          await this.prisma.productSize.update({
            where: { id: existing.id },
            data: { stock: { increment: stockNumber } },
          });
          return { id: existing.id };
        }
        throw new BadRequestException({ message: 'Size already exists' });
      }

      const newSize = await this.prisma.productSize.create({
        data: {
          color_id: Number(colorId),
          size: size as Prisma.ProductSizeUncheckedCreateInput['size'],
          stock: stockNumber,
        },
      });
      return { id: newSize.id };
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      console.error(error);
      throw new InternalServerErrorException({ message: getErrorMessage(error, 'Server error') });
    }
  }

  async removeSize(id: string) {
    try {
      await this.prisma.productSize.delete({ where: { id: Number(id) } });
      return { message: 'Size deleted successfully' };
    } catch (error) {
      console.error(error);
      throw new InternalServerErrorException({ message: 'Server error' });
    }
  }

  async updateSize(id: string, stock: number | string) {
    const stockValue = Number(stock);
    if (!Number.isInteger(stockValue) || stockValue < 0) {
      throw new BadRequestException({ message: 'Stock must be a non-negative integer' });
    }

    try {
      const existing = await this.prisma.productSize.findUnique({ where: { id: Number(id) } });
      if (!existing) {
        throw new NotFoundException({ message: 'Size not found' });
      }
      return await this.prisma.productSize.update({
        where: { id: Number(id) },
        data: { stock: stockValue },
      });
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      console.error(error);
      throw new InternalServerErrorException({ message: 'Server error' });
    }
  }

  async getInventory() {
    try {
      const inventory = await this.prisma.product.findMany({
        select: {
          id: true,
          name: true,
          colors: {
            select: {
              color_name: true,
              sizes: { select: { size: true, stock: true } },
            },
          },
        },
      });

      const flattenedInventory: Array<{
        product_id: number;
        product_name: string;
        color_name: string;
        size: SizeEnum;
        stock: number;
      }> = [];

      for (const product of inventory) {
        for (const color of product.colors) {
          for (const size of color.sizes) {
            flattenedInventory.push({
              product_id: product.id,
              product_name: product.name,
              color_name: color.color_name,
              size: size.size,
              stock: size.stock,
            });
          }
        }
      }
      return { success: true, inventory: flattenedInventory };
    } catch (error) {
      console.error('Error fetching inventory:', error);
      throw new InternalServerErrorException({
        success: false,
        message: 'Failed to fetch inventory',
      });
    }
  }

  async getCategories() {
    try {
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
    } catch (error) {
      throw error;
    }
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

    try {
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
    } catch (error) {
      throw error;
    }
  }

  async updateCategory(id: string, payload: CategoryPayload) {
    const { name, name_vi, name_en, gender, image_url } = payload;
    const baseName = name || name_vi || name_en;
    try {
      const existing = await this.prisma.category.findUnique({ where: { id: Number(id) } });
      if (!existing) throw new NotFoundException({ status: 'fail', message: 'Category not found' });

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
    } catch (error) {
      throw error;
    }
  }

  async deleteCategory(id: string) {
    try {
      const existing = await this.prisma.category.findUnique({ where: { id: Number(id) } });
      if (!existing) throw new NotFoundException({ status: 'fail', message: 'Category not found' });
      await this.prisma.category.update({
        where: { id: Number(id) },
        data: { is_active: false },
      });
      appCache.del('categories-preview');
      return { message: 'Successfully deleted' };
    } catch (error) {
      throw error;
    }
  }

  async getCategoryImages(id: string) {
    try {
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
    } catch (error) {
      throw error;
    }
  }

  async getMemberships() {
    try {
      return await this.prisma.membership.findMany({
        where: { is_active: true },
        orderBy: { min_spending: 'asc' },
      });
    } catch (error) {
      console.error('Error fetching memberships:', error);
      throw new InternalServerErrorException({ message: 'Error fetching membership tiers' });
    }
  }

  async createMembership(payload: MembershipPayload) {
    try {
      await this.prisma.membership.create({
        data: {
          name: payload.name as string,
          min_spending: payload.min_spending as string | number,
          discount_percent: payload.discount_percent as string | number,
        },
      });
      return { message: 'New membership tier added successfully' };
    } catch (error) {
      console.error('Error adding membership:', error);
      throw new InternalServerErrorException({ message: getErrorMessage(error) });
    }
  }

  async updateMembership(id: string, payload: MembershipPayload) {
    try {
      await this.prisma.membership.update({
        where: { id: Number(id) },
        data: {
          name: payload.name,
          min_spending: payload.min_spending,
          discount_percent: payload.discount_percent,
        },
      });
      return { message: 'Membership tier updated successfully' };
    } catch (error) {
      console.error('Error updating membership:', error);
      throw new InternalServerErrorException({ message: getErrorMessage(error) });
    }
  }

  async deleteMembership(id: string) {
    try {
      await this.prisma.membership.update({
        where: { id: Number(id) },
        data: { is_active: false },
      });
      return { message: 'Membership tier deleted successfully' };
    } catch (error) {
      console.error('Error deleting membership:', error);
      throw new InternalServerErrorException({ message: getErrorMessage(error) });
    }
  }

}
