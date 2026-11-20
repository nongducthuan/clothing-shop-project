import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { ApplyScope, Gender } from '../../generated/prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { getErrorMessage } from '../../utils/errorMessage';

export interface SalePayload {
  name?: string;
  name_vi?: string | null;
  name_en?: string | null;
  discount_percent?: string | number;
  productIds?: number[];
  categoryIds?: number[];
  start_date?: string | Date;
  end_date?: string | Date;
  apply_scope?: string;
}

@Injectable()
export class AdminSaleService {
  constructor(private readonly prisma: PrismaService) {}

  private parseApplyScope(value: unknown): ApplyScope {
    if (value === ApplyScope.all || value === ApplyScope.category || value === ApplyScope.product) return value;
    throw new Error('Invalid apply scope');
  }

  async create(payload: SalePayload) {
    try {
      const baseName = payload.name || payload.name_vi || payload.name_en;
      if (!baseName) throw new BadRequestException({ message: 'Sale name is required' });
      await this.prisma.$transaction(async (tx) => {
        const sale = await tx.sale.create({
          data: {
            name: baseName,
            name_vi: payload.name_vi || baseName || null,
            name_en: payload.name_en || baseName || null,
            discount_percent: Number(payload.discount_percent),
            apply_scope: this.parseApplyScope(payload.apply_scope),
            start_date: new Date(payload.start_date as string),
            end_date: new Date(payload.end_date as string),
            status: true,
          },
        });
        if (payload.apply_scope === 'category' && payload.categoryIds?.length) {
          await tx.saleCategory.createMany({ data: payload.categoryIds.map((id) => ({ sale_id: sale.id, category_id: Number(id) })) });
        }
        if (payload.apply_scope === 'product' && payload.productIds?.length) {
          await tx.productSale.createMany({ data: payload.productIds.map((id) => ({ sale_id: sale.id, product_id: Number(id) })) });
        }
      });
      return { success: true, message: 'Created Successfully!' };
    } catch (error) {
      console.error(error);
      throw new InternalServerErrorException({ success: false, message: getErrorMessage(error) });
    }
  }

  async update(id: string, payload: SalePayload) {
    try {
      const baseName = payload.name || payload.name_vi || payload.name_en;
      await this.prisma.$transaction(async (tx) => {
        await tx.sale.update({
          where: { id: Number(id) },
          data: {
            name: baseName || undefined,
            name_vi: payload.name_vi !== undefined ? (payload.name_vi || baseName || null) : undefined,
            name_en: payload.name_en !== undefined ? (payload.name_en || baseName || null) : undefined,
            discount_percent: Number(payload.discount_percent),
            apply_scope: this.parseApplyScope(payload.apply_scope),
            start_date: new Date(payload.start_date as string),
            end_date: new Date(payload.end_date as string),
          },
        });
        await tx.saleCategory.deleteMany({ where: { sale_id: Number(id) } });
        await tx.productSale.deleteMany({ where: { sale_id: Number(id) } });
        if (payload.apply_scope === 'category' && payload.categoryIds?.length) {
          await tx.saleCategory.createMany({ data: payload.categoryIds.map((categoryId) => ({ sale_id: Number(id), category_id: Number(categoryId) })) });
        }
        if (payload.apply_scope === 'product' && payload.productIds?.length) {
          await tx.productSale.createMany({ data: payload.productIds.map((productId) => ({ sale_id: Number(id), product_id: Number(productId) })) });
        }
      });
      return { success: true, message: 'Sale updated successfully!' };
    } catch (error) {
      console.error('UPDATE SALE ERROR:', getErrorMessage(error));
      throw new InternalServerErrorException({ success: false, message: getErrorMessage(error) });
    }
  }

  async findAll() {
    try {
      const sales = await this.prisma.sale.findMany({ where: { status: true }, orderBy: { created_at: 'desc' } });
      return { success: true, data: sales };
    } catch (error) {
      throw new InternalServerErrorException({ success: false, message: getErrorMessage(error) });
    }
  }

  async toggleStatus(id: string, status: unknown) {
    try {
      await this.prisma.sale.update({ where: { id: Number(id) }, data: { status: Boolean(Number(status)) } });
      return { success: true, message: 'Update status successfully!' };
    } catch (error) {
      throw new InternalServerErrorException({ success: false, message: getErrorMessage(error) });
    }
  }

  async remove(id: string) {
    try {
      await this.prisma.sale.update({ where: { id: Number(id) }, data: { status: false } });
      return { success: true, message: 'Promotion deleted successfully (Moved to archives)!' };
    } catch (error) {
      console.error('Remove Sale Error:', error);
      throw new InternalServerErrorException({ success: false, message: 'System error while deleting promotion: ' + getErrorMessage(error) });
    }
  }

  async getDetails(id: string, type: string | undefined) {
    try {
      if (!id || !type) throw new BadRequestException({ success: false, message: 'Missing id or type' });
      let details: Array<{ name: string; name_vi: string | null; name_en: string | null; gender: Gender }> = [];
      if (type === 'product') {
        const productSales = await this.prisma.productSale.findMany({ where: { sale_id: Number(id) }, include: { product: true } });
        details = productSales.map((entry) => ({ name: entry.product.name, name_vi: entry.product.name_vi, name_en: entry.product.name_en, gender: entry.product.gender }));
      } else if (type === 'category') {
        const categorySales = await this.prisma.saleCategory.findMany({ where: { sale_id: Number(id) }, include: { category: true } });
        details = categorySales.map((entry) => ({ name: entry.category.name, name_vi: entry.category.name_vi, name_en: entry.category.name_en, gender: entry.category.gender }));
      }
      return { success: true, details };
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      throw new InternalServerErrorException({ success: false, message: getErrorMessage(error) });
    }
  }
}
