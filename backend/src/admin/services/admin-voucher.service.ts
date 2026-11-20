import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { ApplyScope, Gender, Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { getErrorMessage } from '../../utils/errorMessage';

export interface VoucherPayload {
  code?: string;
  discount_percent?: string | number;
  max_discount_amount?: string | number;
  min_order_value?: string | number;
  usage_limit?: string | number;
  start_date?: string | Date | null;
  end_date?: string | Date | null;
  apply_scope?: string;
  productIds?: number[];
  categoryIds?: number[];
}

@Injectable()
export class AdminVoucherService {
  constructor(private readonly prisma: PrismaService) {}

  private parseApplyScope(value: unknown): ApplyScope {
    if (value === ApplyScope.all || value === ApplyScope.category || value === ApplyScope.product) return value;
    throw new Error('Invalid apply scope');
  }

  private relationData(payload: VoucherPayload, voucherId: number) {
    if (payload.apply_scope === 'category' && payload.categoryIds?.length) {
      return payload.categoryIds.map((id) => ({ voucher_id: voucherId, category_id: Number(id) }));
    }
    if (payload.apply_scope === 'product' && payload.productIds?.length) {
      return payload.productIds.map((id) => ({ voucher_id: voucherId, product_id: Number(id) }));
    }
    return [];
  }

  async create(payload: VoucherPayload) {
    try {
      await this.prisma.$transaction(async (tx) => {
        const voucher = await tx.voucher.create({
          data: {
            code: payload.code as string,
            discount_percent: payload.discount_percent ? Number(payload.discount_percent) : null,
            max_discount_amount: payload.max_discount_amount ? Number(payload.max_discount_amount) : null,
            min_order_value: Number(payload.min_order_value) || 0,
            usage_limit: payload.usage_limit ? Number(payload.usage_limit) : null,
            start_date: payload.start_date ? new Date(payload.start_date) : null,
            end_date: payload.end_date ? new Date(payload.end_date) : null,
            apply_scope: this.parseApplyScope(payload.apply_scope),
            status: true,
          },
        });
        const data = this.relationData(payload, voucher.id);
        if (payload.apply_scope === 'category' && data.length) await tx.voucherCategory.createMany({ data: data as never });
        if (payload.apply_scope === 'product' && data.length) await tx.productVoucher.createMany({ data: data as never });
      });
      return { success: true, message: 'Voucher Created Successfully!' };
    } catch (error) {
      console.error('BACKEND ERROR:', getErrorMessage(error));
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new BadRequestException({ success: false, message: 'Mã voucher này đã tồn tại. Vui lòng nhập mã khác!' });
      }
      throw new InternalServerErrorException({ success: false, message: 'Server error creating voucher' });
    }
  }

  async update(id: string, payload: VoucherPayload) {
    try {
      await this.prisma.$transaction(async (tx) => {
        await tx.voucher.update({
          where: { id: Number(id) },
          data: {
            code: payload.code,
            discount_percent: payload.discount_percent ? Number(payload.discount_percent) : null,
            max_discount_amount: payload.max_discount_amount ? Number(payload.max_discount_amount) : null,
            min_order_value: Number(payload.min_order_value) || 0,
            usage_limit: payload.usage_limit ? Number(payload.usage_limit) : null,
            start_date: payload.start_date ? new Date(payload.start_date) : null,
            end_date: payload.end_date ? new Date(payload.end_date) : null,
            apply_scope: this.parseApplyScope(payload.apply_scope),
          },
        });
        await tx.voucherCategory.deleteMany({ where: { voucher_id: Number(id) } });
        await tx.productVoucher.deleteMany({ where: { voucher_id: Number(id) } });
        const data = this.relationData(payload, Number(id));
        if (payload.apply_scope === 'category' && data.length) await tx.voucherCategory.createMany({ data: data as never });
        if (payload.apply_scope === 'product' && data.length) await tx.productVoucher.createMany({ data: data as never });
      });
      return { success: true, message: 'Voucher updated successfully!' };
    } catch (error) {
      console.error('UPDATE VOUCHER ERROR:', getErrorMessage(error));
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new BadRequestException({ success: false, message: 'Mã voucher (code) này đã tồn tại. Vui lòng nhập mã khác!' });
      }
      throw new InternalServerErrorException({ success: false, message: 'Server error updating voucher' });
    }
  }

  async findAll(includeDeleted: boolean) {
    try {
      const vouchers = await this.prisma.voucher.findMany({ where: includeDeleted ? undefined : { status: true }, orderBy: { created_at: 'desc' } });
      return { success: true, data: vouchers };
    } catch (error) {
      throw new InternalServerErrorException({ success: false, message: getErrorMessage(error) });
    }
  }

  async toggleStatus(id: string, status: unknown) {
    try {
      await this.prisma.voucher.update({ where: { id: Number(id) }, data: { status: Boolean(Number(status)) } });
      return { success: true, message: 'Voucher status updated successfully!' };
    } catch (error) {
      throw new InternalServerErrorException({ success: false, message: getErrorMessage(error) });
    }
  }

  async remove(id: string) {
    try {
      const voucher = await this.prisma.voucher.findUnique({ where: { id: Number(id) } });
      if (!voucher) throw new NotFoundException({ success: false, message: 'Voucher not found or already deleted!' });
      const releasedCode = `${voucher.code}_deleted_${voucher.id}_${Date.now()}`.slice(0, 50);
      await this.prisma.voucher.update({ where: { id: Number(id) }, data: { status: false, code: releasedCode } });
      return { success: true, message: 'Voucher deleted successfully! The code has been released for reuse.' };
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      console.error('Remove Voucher Error:', error);
      throw new InternalServerErrorException({ success: false, message: 'System error while deleting voucher.' });
    }
  }

  async getDetails(id: string) {
    try {
      if (!id) throw new BadRequestException({ success: false, message: 'Missing ID' });
      const voucher = await this.prisma.voucher.findUnique({
        where: { id: Number(id) },
        include: { product_vouchers: { include: { product: true } }, voucher_categories: { include: { category: true } } },
      });
      if (!voucher) throw new NotFoundException({ success: false, message: 'Voucher not found' });
      let details: Array<{ name: string; name_vi: string | null; name_en: string | null; gender: Gender }> = [];
      if (voucher.apply_scope === 'product') details = voucher.product_vouchers.map((entry) => ({ name: entry.product.name, name_vi: entry.product.name_vi, name_en: entry.product.name_en, gender: entry.product.gender }));
      if (voucher.apply_scope === 'category') details = voucher.voucher_categories.map((entry) => ({ name: entry.category.name, name_vi: entry.category.name_vi, name_en: entry.category.name_en, gender: entry.category.gender }));
      return { success: true, details };
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException({ success: false, error: getErrorMessage(error) });
    }
  }
}
