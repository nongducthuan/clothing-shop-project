import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

const DEFAULT_PAGE_SIZE = 50;
const MAX_PAGE_SIZE = 100;
const GENDERS = ['male', 'female', 'unisex'] as const;

export interface AdminProductQuery {
  search?: string;
  gender?: string;
  category_ids?: string;
  category_id?: string;
  page?: string;
  limit?: string;
}

export interface AdminProductPayload {
  name?: string;
  name_vi?: string | null;
  name_en?: string | null;
  description?: string | null;
  description_vi?: string | null;
  description_en?: string | null;
  price?: string | number;
  import_price?: string | number;
  image_url?: string | null;
  gender?: string;
  category_id?: string | number;
}

@Injectable()
export class AdminProductService {
  constructor(private readonly prisma: PrismaService) {}

  private buildWhere(query: AdminProductQuery): Prisma.ProductWhereInput {
    const where: Prisma.ProductWhereInput = { is_active: true };
    const search = typeof query.search === 'string' ? query.search.trim() : '';
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { name_vi: { contains: search } },
        { name_en: { contains: search } },
      ];
    }

    const gender = typeof query.gender === 'string' ? query.gender.trim().toLowerCase() : '';
    if (GENDERS.includes(gender as (typeof GENDERS)[number])) {
      where.gender = gender as Prisma.ProductWhereInput['gender'];
    }

    const categoryIdsRaw = [query.category_ids, query.category_id]
      .filter((value): value is string => typeof value === 'string' && value.trim() !== '' && value !== 'all')
      .join(',');
    const categoryIds = Array.from(new Set(categoryIdsRaw.split(',')
      .map((value) => Number(value.trim()))
      .filter((value) => Number.isInteger(value) && value > 0)));
    if (categoryIds.length) where.category_id = { in: categoryIds };
    return where;
  }

  private async validateGenderAndCategory(gender: unknown, categoryId: unknown) {
    if (typeof gender !== 'string' || !GENDERS.includes(gender as (typeof GENDERS)[number])) {
      throw new BadRequestException({ message: 'Invalid gender. Must be one of: male, female, unisex' });
    }
    const id = Number(categoryId);
    if (!Number.isInteger(id) || id <= 0) throw new BadRequestException({ message: 'Invalid category id' });
    const category = await this.prisma.category.findUnique({ where: { id }, select: { gender: true } });
    if (!category) throw new BadRequestException({ message: 'Category not found' });
    if (category.gender !== gender) throw new BadRequestException({ message: 'Product gender must match category gender' });
  }

  async getProducts(query: AdminProductQuery) {
    try {
      const isPaginated = query.page !== undefined;
      const where = this.buildWhere(query);
      const page = Math.max(1, Number(query.page) || 1);
      const limit = Math.min(MAX_PAGE_SIZE, Math.max(1, Number(query.limit) || DEFAULT_PAGE_SIZE));
      const products = await this.prisma.product.findMany({
        where,
        include: { category: true, colors: { include: { sizes: true } } },
        orderBy: [{ gender: 'asc' }, { id: 'desc' }],
        ...(isPaginated ? { skip: (page - 1) * limit, take: limit } : {}),
      });
      const formattedProducts = products.map((product) => {
        const totalStock = product.colors.reduce((acc, color) => acc + color.sizes.reduce((sum, size) => sum + size.stock, 0), 0);
        return {
          ...product,
          category_name: product.category?.name,
          category_name_vi: product.category?.name_vi,
          category_name_en: product.category?.name_en,
          total_stock: totalStock,
          unit_profit: Number(product.price) - Number(product.import_price),
        };
      });
      if (!isPaginated) return formattedProducts;
      const totalProducts = await this.prisma.product.count({ where });
      return { data: formattedProducts, currentPage: page, totalPages: Math.max(1, Math.ceil(totalProducts / limit)), totalProducts };
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      console.error(error);
      throw new InternalServerErrorException({ message: 'Server error fetching products' });
    }
  }

  async addProduct(payload: AdminProductPayload) {
    try {
      await this.validateGenderAndCategory(payload.gender, payload.category_id);
      const baseName = payload.name || payload.name_vi || payload.name_en;
      if (!baseName) throw new BadRequestException({ message: 'Product name is required' });
      const baseDescription = payload.description || payload.description_vi || payload.description_en || '';
      const product = await this.prisma.product.create({
        data: {
          name: baseName,
          name_vi: payload.name_vi || baseName || null,
          name_en: payload.name_en || baseName || null,
          description: baseDescription,
          description_vi: payload.description_vi || baseDescription || null,
          description_en: payload.description_en || baseDescription || null,
          price: payload.price as never,
          import_price: (payload.import_price || 0) as never,
          image_url: payload.image_url || null,
          gender: payload.gender as never,
          category_id: Number(payload.category_id),
        },
      });
      return { id: product.id, message: 'Product added successfully' };
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      console.error(error);
      throw new InternalServerErrorException({ message: 'Server error adding product' });
    }
  }

  async editProduct(id: string, payload: AdminProductPayload) {
    try {
      await this.validateGenderAndCategory(payload.gender, payload.category_id);
      const baseName = payload.name || payload.name_vi || payload.name_en;
      const baseDescription = payload.description !== undefined ? payload.description : (payload.description_vi || payload.description_en);
      await this.prisma.product.update({
        where: { id: Number(id) },
        data: {
          name: baseName || undefined,
          name_vi: payload.name_vi !== undefined ? (payload.name_vi || baseName || null) : undefined,
          name_en: payload.name_en !== undefined ? (payload.name_en || baseName || null) : undefined,
          description: baseDescription !== undefined ? (baseDescription || '') : undefined,
          description_vi: payload.description_vi !== undefined ? (payload.description_vi || baseDescription || null) : undefined,
          description_en: payload.description_en !== undefined ? (payload.description_en || baseDescription || null) : undefined,
          price: payload.price as never,
          import_price: (payload.import_price || 0) as never,
          image_url: payload.image_url || null,
          gender: payload.gender as never,
          category_id: Number(payload.category_id),
        },
      });
      return { affected: 1 };
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      console.error(error);
      throw new InternalServerErrorException({ message: 'Server error editing product' });
    }
  }

  async removeProduct(id: string) {
    try {
      await this.prisma.product.update({ where: { id: Number(id) }, data: { is_active: false } });
      return { affected: 1 };
    } catch (error) {
      console.error(error);
      throw new InternalServerErrorException({ message: 'Server error deleting product' });
    }
  }

  async getProductDetail(id: string) {
    try {
      const product = await this.prisma.product.findUnique({
        where: { id: Number(id) }, include: { colors: { include: { sizes: true } } },
      });
      if (!product) throw new NotFoundException({ message: 'Not found' });
      return product;
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      console.error(error);
      throw new InternalServerErrorException({ message: 'Server error' });
    }
  }
}
