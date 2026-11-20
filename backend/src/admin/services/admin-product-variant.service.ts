import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, SizeEnum } from '../../generated/prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { getErrorMessage } from '../../utils/errorMessage';
import type { ColorPayload, SizePayload } from './admin-catalog.types';

@Injectable()
export class AdminProductVariantService {
  constructor(private readonly prisma: PrismaService) {}

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
}
