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
    throw new BadRequestException({ success: false, message: 'Invalid apply scope' });
  }

  private validateScopeTargets(applyScope: ApplyScope, payload: SalePayload) {
    if (applyScope === ApplyScope.category && (!Array.isArray(payload.categoryIds) || payload.categoryIds.length === 0)) {
      throw new BadRequestException({ success: false, message: 'Vui lòng chọn ít nhất một danh mục!' });
    }
    if (applyScope === ApplyScope.product && (!Array.isArray(payload.productIds) || payload.productIds.length === 0)) {
      throw new BadRequestException({ success: false, message: 'Vui lòng chọn ít nhất một sản phẩm!' });
    }
  }

  private validateSalePayload(payload: SalePayload): { applyScope: ApplyScope; discountPercent: number; startDate: Date; endDate: Date } {
    const applyScope = this.parseApplyScope(payload.apply_scope);
    this.validateScopeTargets(applyScope, payload);

    const discountPercent = Number(payload.discount_percent);
    if (!Number.isFinite(discountPercent) || discountPercent <= 0 || discountPercent > 100) {
      throw new BadRequestException({ success: false, message: 'Phần trăm giảm giá phải từ 1 đến 100%!' });
    }

    const startDate = new Date(payload.start_date as string | Date);
    const endDate = new Date(payload.end_date as string | Date);
    if (!payload.start_date || Number.isNaN(startDate.getTime()) || !payload.end_date || Number.isNaN(endDate.getTime())) {
      throw new BadRequestException({ success: false, message: 'Invalid start_date or end_date' });
    }
    if (startDate >= endDate) {
      throw new BadRequestException({ success: false, message: 'Thời gian bắt đầu phải trước thời gian kết thúc!' });
    }

    return { applyScope, discountPercent, startDate, endDate };
  }

  async create(payload: SalePayload) {
    try {
      const baseName = payload.name || payload.name_vi || payload.name_en;
      if (!baseName) throw new BadRequestException({ success: false, message: 'Sale name is required' });
      const { applyScope, discountPercent, startDate, endDate } = this.validateSalePayload(payload);
      await this.prisma.$transaction(async (tx) => {
        const sale = await tx.sale.create({
          data: {
            name: baseName,
            name_vi: payload.name_vi || baseName || null,
            name_en: payload.name_en || baseName || null,
            discount_percent: discountPercent,
            apply_scope: applyScope,
            start_date: startDate,
            end_date: endDate,
            status: true,
          },
        });
        if (applyScope === 'category' && payload.categoryIds?.length) {
          await tx.saleCategory.createMany({ data: payload.categoryIds.map((id) => ({ sale_id: sale.id, category_id: Number(id) })) });
        }
        if (applyScope === 'product' && payload.productIds?.length) {
          await tx.productSale.createMany({ data: payload.productIds.map((id) => ({ sale_id: sale.id, product_id: Number(id) })) });
        }
      });
      return { success: true, message: 'Created Successfully!' };
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      console.error(error);
      throw new InternalServerErrorException({ success: false, message: getErrorMessage(error) });
    }
  }

  async update(id: string, payload: SalePayload) {
    try {
      const baseName = payload.name || payload.name_vi || payload.name_en;
      const { applyScope, discountPercent, startDate, endDate } = this.validateSalePayload(payload);
      await this.prisma.$transaction(async (tx) => {
        await tx.sale.update({
          where: { id: Number(id) },
          data: {
            name: baseName || undefined,
            name_vi: payload.name_vi !== undefined ? (payload.name_vi || baseName || null) : undefined,
            name_en: payload.name_en !== undefined ? (payload.name_en || baseName || null) : undefined,
            discount_percent: discountPercent,
            apply_scope: applyScope,
            start_date: startDate,
            end_date: endDate,
          },
        });
        await tx.saleCategory.deleteMany({ where: { sale_id: Number(id) } });
        await tx.productSale.deleteMany({ where: { sale_id: Number(id) } });
        if (applyScope === 'category' && payload.categoryIds?.length) {
          await tx.saleCategory.createMany({ data: payload.categoryIds.map((categoryId) => ({ sale_id: Number(id), category_id: Number(categoryId) })) });
        }
        if (applyScope === 'product' && payload.productIds?.length) {
          await tx.productSale.createMany({ data: payload.productIds.map((productId) => ({ sale_id: Number(id), product_id: Number(productId) })) });
        }
      });
      return { success: true, message: 'Sale updated successfully!' };
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      console.error('UPDATE SALE ERROR:', getErrorMessage(error));
      throw new InternalServerErrorException({ success: false, message: getErrorMessage(error) });
    }
  }

  async findAll() {
    try {
      const sales = await this.prisma.sale.findMany({
        where: { status: true },
        orderBy: { created_at: 'desc' },
        include: {
          product_sales: { select: { product_id: true } },
          sale_categories: { select: { category_id: true } },
        },
      });
      const data = sales.map(({ product_sales, sale_categories, ...sale }) => ({
        ...sale,
        productIds: product_sales.map((entry) => entry.product_id),
        categoryIds: sale_categories.map((entry) => entry.category_id),
      }));
      return { success: true, data };
    } catch (error) {
      throw new InternalServerErrorException({ success: false, message: getErrorMessage(error) });
    }
  }

  async toggleStatus(id: string, status: unknown) {
    try {
      let boolStatus: boolean;
      if (typeof status === 'boolean') {
        boolStatus = status;
      } else if (status === 'true' || status === '1' || status === 1) {
        boolStatus = true;
      } else if (status === 'false' || status === '0' || status === 0) {
        boolStatus = false;
      } else {
        throw new BadRequestException({ success: false, message: 'Invalid status value. Use true or false.' });
      }
      await this.prisma.sale.update({ where: { id: Number(id) }, data: { status: boolStatus } });
      return { success: true, message: 'Update status successfully!' };
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
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
