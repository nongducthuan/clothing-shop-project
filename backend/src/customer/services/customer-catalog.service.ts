import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { appCache } from '../../utils/cacheService';
import { getErrorMessage } from '../../utils/errorMessage';

@Injectable()
export class CustomerCatalogService {
  constructor(private readonly prisma: PrismaService) {}

  async getBanners() {
    try {
      return await this.prisma.banner.findMany({ orderBy: { id: 'desc' } });
    } catch (error) {
      console.error(error);
      throw new InternalServerErrorException({ message: 'Server error' });
    }
  }

  async getMemberships() {
    try {
      return await this.prisma.membership.findMany({
        where: { is_active: true },
        orderBy: { min_spending: 'asc' },
        select: {
          id: true,
          name: true,
          min_spending: true,
          discount_percent: true,
        },
      });
    } catch (error) {
      console.error('Error fetching memberships:', error);
      throw new InternalServerErrorException({
        message: 'Error fetching membership tiers',
      });
    }
  }

  async getCategories() {
    const categories = await this.prisma.category.findMany({
      where: { is_active: true },
      orderBy: { id: 'asc' },
    });
    return { data: categories };
  }

  async getRecommendCategories(gender?: string) {
    if (!gender) {
      throw new BadRequestException({ status: 'fail', message: 'Missing gender' });
    }

    const validGender = gender as 'male' | 'female' | 'unisex';
    const categoriesOfTarget = await this.prisma.category.findMany({
      where: { gender: validGender, is_active: true },
      select: { name: true },
    });
    const targetNames = categoriesOfTarget.map((category) => category.name);

    const recommendCategories = await this.prisma.category.findMany({
      where: {
        gender: { not: validGender },
        name: { notIn: targetNames },
        is_active: true,
      },
      select: { name: true },
      distinct: ['name'],
      orderBy: { name: 'asc' },
    });

    return { data: recommendCategories };
  }

  async getCategoriesWithPreview() {
    const cacheKey = 'categories-preview';
    const cachedData = appCache.get(cacheKey);
    if (cachedData !== undefined) {
      return { data: cachedData };
    }

    const categories = await this.prisma.category.findMany({
      where: {
        is_active: true,
        products: { some: { is_active: true } },
      },
      orderBy: { id: 'asc' },
      include: {
        products: {
          take: 1,
          orderBy: { id: 'asc' },
          include: {
            colors: {
              where: { image_url: { not: '' } },
              take: 1,
            },
          },
        },
      },
    });

    const rows = categories.map((category) => {
      let previewImage: string | null = null;
      if (category.image_url) {
        previewImage = category.image_url;
      } else if (category.products.length > 0) {
        const product = category.products[0];
        if (product.colors.length > 0 && product.colors[0].image_url) {
          previewImage = product.colors[0].image_url;
        } else if (product.image_url) {
          previewImage = product.image_url;
        }
      }

      return {
        id: category.id,
        name: category.name,
        name_vi: category.name_vi,
        name_en: category.name_en,
        gender: category.gender,
        image_url: category.image_url,
        preview_image: previewImage,
      };
    });

    appCache.set(cacheKey, rows);
    return { data: rows };
  }

  async getProductDetail(id: string) {
    const productId = Number(id);
    if (Number.isNaN(productId)) {
      throw new BadRequestException({ message: 'Invalid product ID' });
    }

    try {
      const product = await this.prisma.product.findFirst({
        where: { id: productId, is_active: true },
        include: {
          category: true,
          colors: { include: { sizes: true } },
        },
      });

      if (!product) {
        throw new NotFoundException({ message: 'Product not found' });
      }

      const sales = await this.prisma.sale.findMany({
        where: {
          status: true,
          start_date: { lte: new Date() },
          end_date: { gte: new Date() },
          OR: [
            { apply_scope: 'all' },
            { product_sales: { some: { product_id: productId } } },
            { sale_categories: { some: { category_id: product.category_id } } },
          ],
        },
        select: { discount_percent: true },
        orderBy: { discount_percent: 'desc' },
        take: 1,
      });

      const salePercent = sales.length > 0 ? Number(sales[0].discount_percent) : 0;
      const totalStock = product.colors.reduce(
        (colorTotal, color) =>
          colorTotal + color.sizes.reduce((sizeTotal, size) => sizeTotal + size.stock, 0),
        0,
      );

      return {
        id: product.id,
        name: product.name,
        name_vi: product.name_vi,
        name_en: product.name_en,
        description: product.description,
        description_vi: product.description_vi,
        description_en: product.description_en,
        price: product.price,
        image_url: product.image_url,
        gender: product.gender,
        category_name: product.category?.name,
        category_name_vi: product.category?.name_vi,
        category_name_en: product.category?.name_en,
        sale_percent: salePercent,
        total_stock: totalStock,
        colors: product.colors.map((color) => ({
          color_id: color.id,
          color_name: color.color_name,
          color_name_vi: color.color_name_vi,
          color_name_en: color.color_name_en,
          color_code: color.color_code,
          image_url: color.image_url,
          sizes: color.sizes.map((size) => ({
            size_id: size.id,
            size: size.size,
            stock: size.stock,
          })),
        })),
      };
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }
      console.error('Error in getProductDetail:', error);
      throw new InternalServerErrorException({ message: 'Server error' });
    }
  }

  async getCustomerSales() {
    try {
      const now = new Date();
      const sales = await this.prisma.sale.findMany({
        where: {
          status: true,
          start_date: { lte: now },
          end_date: { gte: now },
        },
      });
      return { success: true, data: sales };
    } catch (error) {
      console.error('Error fetching customer sales:', error);
      throw new InternalServerErrorException({ success: false, message: getErrorMessage(error) });
    }
  }
}
