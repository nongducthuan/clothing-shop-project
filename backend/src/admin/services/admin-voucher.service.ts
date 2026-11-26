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
    throw new BadRequestException({ success: false, message: 'Invalid apply scope' });
  }

  private validateScopeTargets(applyScope: ApplyScope, payload: VoucherPayload) {
    if (applyScope === ApplyScope.category && (!Array.isArray(payload.categoryIds) || payload.categoryIds.length === 0)) {
      throw new BadRequestException({ success: false, message: 'Vui lòng chọn ít nhất một danh mục!' });
    }
    if (applyScope === ApplyScope.product && (!Array.isArray(payload.productIds) || payload.productIds.length === 0)) {
      throw new BadRequestException({ success: false, message: 'Vui lòng chọn ít nhất một sản phẩm!' });
    }
  }

  private validateVoucherConstraints(payload: VoucherPayload, requireDiscount = false) {
    if (requireDiscount || (payload.discount_percent != null && payload.discount_percent !== '')) {
      const discount = Number(payload.discount_percent);
      if (payload.discount_percent == null || payload.discount_percent === '' || !Number.isFinite(discount) || discount <= 0 || discount > 100) {
        throw new BadRequestException({ success: false, message: 'Phần trăm giảm giá phải từ 1 đến 100%!' });
      }
    }
    if (payload.min_order_value != null && payload.min_order_value !== '') {
      const minVal = Number(payload.min_order_value);
      if (!Number.isFinite(minVal) || minVal < 0) {
        throw new BadRequestException({ success: false, message: 'Giá trị đơn tối thiểu không được âm!' });
      }
    }
    if (payload.max_discount_amount != null && payload.max_discount_amount !== '') {
      const maxDiscount = Number(payload.max_discount_amount);
      if (!Number.isFinite(maxDiscount) || maxDiscount < 0) {
        throw new BadRequestException({ success: false, message: 'Mức giảm tối đa không được âm!' });
      }
    }
    if (payload.usage_limit != null && payload.usage_limit !== '') {
      const limit = Number(payload.usage_limit);
      // B-8: float usage_limit would fail Prisma Int field → require integer
      if (!Number.isFinite(limit) || !Number.isInteger(limit) || limit < 1) {
        throw new BadRequestException({ success: false, message: 'Lượt sử dụng tối đa phải là số nguyên từ 1 trở lên!' });
      }
    }
  }

  private parseOptionalDate(value: string | Date | null | undefined, label: string): Date | null {
    if (!value) return null;
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      throw new BadRequestException({ success: false, message: `${label} không hợp lệ!` });
    }
    return parsed;
  }

  private validateDateRange(start: Date | null | undefined, end: Date | null | undefined) {
    if (start && end && !Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime()) && start >= end) {
      throw new BadRequestException({ success: false, message: 'Thời gian bắt đầu phải trước thời gian kết thúc!' });
    }
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
      const applyScope = this.parseApplyScope(payload.apply_scope);
      this.validateScopeTargets(applyScope, payload);
      this.validateVoucherConstraints(payload, true);
      // B-9: validate code is non-empty and non-whitespace
      const code = typeof payload.code === 'string' ? payload.code.trim() : '';
      if (!code) {
        throw new BadRequestException({ success: false, message: 'Mã voucher không được để trống!' });
      }
      const startDate = this.parseOptionalDate(payload.start_date, 'Thời gian bắt đầu');
      const endDate = this.parseOptionalDate(payload.end_date, 'Thời gian kết thúc');
      this.validateDateRange(startDate, endDate);

      await this.prisma.$transaction(async (tx) => {
        const voucher = await tx.voucher.create({
          data: {
            code,
            discount_percent: payload.discount_percent != null && payload.discount_percent !== '' ? Number(payload.discount_percent) : null,
            max_discount_amount: payload.max_discount_amount != null && payload.max_discount_amount !== '' ? Number(payload.max_discount_amount) : null,
            min_order_value: payload.min_order_value != null && payload.min_order_value !== '' ? Number(payload.min_order_value) : 0,
            usage_limit: payload.usage_limit != null && payload.usage_limit !== '' ? Number(payload.usage_limit) : null,
            start_date: startDate,
            end_date: endDate,
            apply_scope: applyScope,
            status: true,
          },
        });
        const data = this.relationData(payload, voucher.id);
        if (payload.apply_scope === 'category' && data.length) await tx.voucherCategory.createMany({ data: data as never });
        if (payload.apply_scope === 'product' && data.length) await tx.productVoucher.createMany({ data: data as never });
      });
      return { success: true, message: 'Voucher Created Successfully!' };
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      console.error('BACKEND ERROR:', getErrorMessage(error));
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new BadRequestException({ success: false, message: 'Mã voucher này đã tồn tại. Vui lòng nhập mã khác!' });
      }
      throw new InternalServerErrorException({ success: false, message: 'Server error creating voucher' });
    }
  }

  async update(id: string, payload: VoucherPayload) {
    try {
      const applyScope = this.parseApplyScope(payload.apply_scope);
      this.validateScopeTargets(applyScope, payload);
      this.validateVoucherConstraints(payload, true);
      const startDate = payload.start_date !== undefined ? this.parseOptionalDate(payload.start_date, 'Thời gian bắt đầu') : undefined;
      const endDate = payload.end_date !== undefined ? this.parseOptionalDate(payload.end_date, 'Thời gian kết thúc') : undefined;

      if (startDate !== undefined && endDate !== undefined) {
        this.validateDateRange(startDate, endDate);
      } else if (startDate !== undefined || endDate !== undefined) {
        const existing = await this.prisma.voucher.findUnique({
          where: { id: Number(id) },
          select: { start_date: true, end_date: true },
        });
        if (existing) {
          this.validateDateRange(startDate !== undefined ? startDate : existing.start_date, endDate !== undefined ? endDate : existing.end_date);
        }
      }

      await this.prisma.$transaction(async (tx) => {
        await tx.voucher.update({
          where: { id: Number(id) },
          data: {
            code: payload.code,
            discount_percent: payload.discount_percent != null && payload.discount_percent !== '' ? Number(payload.discount_percent) : null,
            max_discount_amount: payload.max_discount_amount != null && payload.max_discount_amount !== '' ? Number(payload.max_discount_amount) : null,
            min_order_value: payload.min_order_value != null && payload.min_order_value !== '' ? Number(payload.min_order_value) : 0,
            usage_limit: payload.usage_limit != null && payload.usage_limit !== '' ? Number(payload.usage_limit) : null,
            ...(startDate !== undefined && { start_date: startDate }),
            ...(endDate !== undefined && { end_date: endDate }),
            apply_scope: applyScope,
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
      if (error instanceof BadRequestException) throw error;
      console.error('UPDATE VOUCHER ERROR:', getErrorMessage(error));
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new BadRequestException({ success: false, message: 'Mã voucher (code) này đã tồn tại. Vui lòng nhập mã khác!' });
      }
      throw new InternalServerErrorException({ success: false, message: 'Server error updating voucher' });
    }
  }

  async findAll(includeDeleted: boolean) {
    try {
      const vouchers = await this.prisma.voucher.findMany({
        where: includeDeleted ? undefined : { status: true },
        orderBy: { created_at: 'desc' },
        include: {
          product_vouchers: { select: { product_id: true } },
          voucher_categories: { select: { category_id: true } },
        },
      });
      const data = vouchers.map(({ product_vouchers, voucher_categories, ...voucher }) => ({
        ...voucher,
        productIds: product_vouchers.map((entry) => entry.product_id),
        categoryIds: voucher_categories.map((entry) => entry.category_id),
      }));
      return { success: true, data };
    } catch (error) {
      throw new InternalServerErrorException({ success: false, message: getErrorMessage(error) });
    }
  }

  async toggleStatus(id: string, status: unknown) {
    try {
      // B-7: Boolean(Number("true")) === false. Parse boolean properly.
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
      await this.prisma.voucher.update({ where: { id: Number(id) }, data: { status: boolStatus } });
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
