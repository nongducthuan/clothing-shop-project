import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface PromotionPayload {
  name?: string;
  name_vi?: string | null;
  name_en?: string | null;
  buy_product_id?: number | string;
  buy_quantity?: number | string;
  gift_product_id?: number | string;
  gift_quantity?: number | string;
  start_date?: string | Date;
  end_date?: string | Date;
  max_gift_per_order?: number | string | null;
  total_gift_limit?: number | string | null;
  priority?: number | string;
  is_stackable?: boolean | string;
}

@Injectable()
export class AdminPromotionService {
  constructor(private readonly prisma: PrismaService) {}

  async getAdminPromotions() {
    try {
      return await this.prisma.buyXGetYPromotion.findMany({
        where: { is_active: true },
        orderBy: { created_at: 'desc' },
      });
    } catch (error) {
      console.error('Error fetching admin promotions:', error);
      throw new InternalServerErrorException({ success: false, message: 'Server error' });
    }
  }

  private parseDate(value: string | Date | undefined, fieldName: string): Date {
    const date = new Date(value as string | Date);
    if (!value || Number.isNaN(date.getTime())) {
      throw new BadRequestException({ success: false, message: `Invalid ${fieldName}` });
    }
    return date;
  }

  private validateDateRange(startDate: Date, endDate: Date) {
    if (startDate >= endDate) {
      throw new BadRequestException({ success: false, message: 'start_date must be before end_date' });
    }
  }

  private validatePromotionConstraints(payload: PromotionPayload, requireQuantities = false) {
    // B-4: treat empty string as missing so Number("") === 0 is never persisted
    const buyQtyRaw = payload.buy_quantity;
    if (requireQuantities || (buyQtyRaw != null && buyQtyRaw !== '')) {
      const buyQty = Number(buyQtyRaw);
      if (buyQtyRaw == null || buyQtyRaw === '' || !Number.isFinite(buyQty) || !Number.isInteger(buyQty) || buyQty <= 0) {
        throw new BadRequestException({ success: false, message: 'buy_quantity must be a positive integer' });
      }
    }
    const giftQtyRaw = payload.gift_quantity;
    if (requireQuantities || (giftQtyRaw != null && giftQtyRaw !== '')) {
      const giftQty = Number(giftQtyRaw);
      if (giftQtyRaw == null || giftQtyRaw === '' || !Number.isFinite(giftQty) || !Number.isInteger(giftQty) || giftQty <= 0) {
        throw new BadRequestException({ success: false, message: 'gift_quantity must be a positive integer' });
      }
    }
    // B-5: empty optional fields must become null, not 0
    if (payload.max_gift_per_order != null && payload.max_gift_per_order !== '') {
      const maxGift = Number(payload.max_gift_per_order);
      if (!Number.isFinite(maxGift) || maxGift <= 0) {
        throw new BadRequestException({ success: false, message: 'max_gift_per_order must be greater than 0' });
      }
    }
    if (payload.total_gift_limit != null && payload.total_gift_limit !== '') {
      const totalLimit = Number(payload.total_gift_limit);
      if (!Number.isFinite(totalLimit) || totalLimit < 0) {
        throw new BadRequestException({ success: false, message: 'total_gift_limit cannot be negative' });
      }
    }
  }

  async createPromotion(payload: PromotionPayload) {
    try {
      // B-4/B-5: require buy/gift quantities on create
      this.validatePromotionConstraints(payload, true);
      const startDate = this.parseDate(payload.start_date, 'start_date');
      const endDate = this.parseDate(payload.end_date, 'end_date');
      this.validateDateRange(startDate, endDate);

      // B-6: require at least one name field
      const baseName = payload.name || payload.name_vi || payload.name_en;
      if (!baseName || !String(baseName).trim()) {
        throw new BadRequestException({ success: false, message: 'Promotion name is required' });
      }
      const newPromotion = await this.prisma.buyXGetYPromotion.create({
        data: {
          name: baseName as string,
          name_vi: payload.name_vi || baseName || null,
          name_en: payload.name_en || baseName || null,
          buy_product_id: Number(payload.buy_product_id),
          buy_quantity: Number(payload.buy_quantity),
          gift_product_id: Number(payload.gift_product_id),
          gift_quantity: Number(payload.gift_quantity),
          start_date: startDate,
          end_date: endDate,
          // B-5: empty string optional fields → null, not 0
          max_gift_per_order: (payload.max_gift_per_order != null && payload.max_gift_per_order !== '') ? Number(payload.max_gift_per_order) : null,
          total_gift_limit: (payload.total_gift_limit != null && payload.total_gift_limit !== '') ? Number(payload.total_gift_limit) : null,
          priority: payload.priority != null ? Number(payload.priority) : 0,
          is_stackable: payload.is_stackable === true || payload.is_stackable === 'true',
          status: 'active',
        },
      });
      return { success: true, message: 'Created successfully', id: newPromotion.id };
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      console.error('Error creating promotion:', error);
      throw new InternalServerErrorException({ success: false, message: 'Server error' });
    }
  }

  async updatePromotion(id: string, payload: PromotionPayload) {
    try {
      this.validatePromotionConstraints(payload);
      const startDate = payload.start_date !== undefined ? this.parseDate(payload.start_date, 'start_date') : undefined;
      const endDate = payload.end_date !== undefined ? this.parseDate(payload.end_date, 'end_date') : undefined;
      if (startDate && endDate) {
        this.validateDateRange(startDate, endDate);
      } else if (startDate || endDate) {
        const existing = await this.prisma.buyXGetYPromotion.findUnique({
          where: { id: Number(id) },
          select: { start_date: true, end_date: true },
        });
        if (existing) {
          this.validateDateRange(startDate ?? existing.start_date, endDate ?? existing.end_date);
        }
      }

      const baseName = payload.name || payload.name_vi || payload.name_en;
      await this.prisma.buyXGetYPromotion.update({
        where: { id: Number(id) },
        data: {
          name: baseName || undefined,
          name_vi: payload.name_vi !== undefined ? (payload.name_vi || baseName || null) : undefined,
          name_en: payload.name_en !== undefined ? (payload.name_en || baseName || null) : undefined,
          ...(payload.buy_product_id !== undefined && { buy_product_id: Number(payload.buy_product_id) }),
          // B-4: guard updatePromotion — also reject empty string for buy/gift_quantity
          ...(payload.buy_quantity !== undefined && payload.buy_quantity !== '' && { buy_quantity: Number(payload.buy_quantity) }),
          ...(payload.gift_product_id !== undefined && { gift_product_id: Number(payload.gift_product_id) }),
          ...(payload.gift_quantity !== undefined && payload.gift_quantity !== '' && { gift_quantity: Number(payload.gift_quantity) }),
          ...(startDate !== undefined && { start_date: startDate }),
          ...(endDate !== undefined && { end_date: endDate }),
          // B-5: empty string → null for optional caps in updatePromotion too
          ...(payload.max_gift_per_order !== undefined && {
            max_gift_per_order: (payload.max_gift_per_order != null && payload.max_gift_per_order !== '') ? Number(payload.max_gift_per_order) : null,
          }),
          ...(payload.total_gift_limit !== undefined && {
            total_gift_limit: (payload.total_gift_limit != null && payload.total_gift_limit !== '') ? Number(payload.total_gift_limit) : null,
          }),
          ...(payload.priority !== undefined && { priority: payload.priority != null ? Number(payload.priority) : 0 }),
          ...(payload.is_stackable !== undefined && {
            is_stackable: payload.is_stackable === true || payload.is_stackable === 'true',
          }),
        },
      });
      return { success: true, message: 'Updated successfully' };
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      console.error('Error updating promotion:', error);
      throw new InternalServerErrorException({ success: false, message: 'Server error' });
    }
  }

  async deletePromotion(id: string) {
    try {
      await this.prisma.buyXGetYPromotion.update({
        where: { id: Number(id) },
        data: { is_active: false },
      });
      return { success: true, message: 'Deleted successfully' };
    } catch (error) {
      console.error('Error deleting promotion:', error);
      throw new InternalServerErrorException({ success: false, message: 'Server error' });
    }
  }
}
