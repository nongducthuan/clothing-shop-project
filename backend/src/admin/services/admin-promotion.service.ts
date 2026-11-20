import { Injectable, InternalServerErrorException } from '@nestjs/common';
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

  async createPromotion(payload: PromotionPayload) {
    try {
      const baseName = payload.name || payload.name_vi || payload.name_en;
      const newPromotion = await this.prisma.buyXGetYPromotion.create({
        data: {
          name: baseName as string,
          name_vi: payload.name_vi || baseName || null,
          name_en: payload.name_en || baseName || null,
          buy_product_id: Number(payload.buy_product_id),
          buy_quantity: Number(payload.buy_quantity),
          gift_product_id: Number(payload.gift_product_id),
          gift_quantity: Number(payload.gift_quantity),
          start_date: new Date(payload.start_date as string),
          end_date: new Date(payload.end_date as string),
          max_gift_per_order: payload.max_gift_per_order ? Number(payload.max_gift_per_order) : null,
          total_gift_limit: payload.total_gift_limit ? Number(payload.total_gift_limit) : null,
          priority: payload.priority ? Number(payload.priority) : 0,
          is_stackable: Boolean(payload.is_stackable),
          status: 'active',
        },
      });
      return { success: true, message: 'Created successfully', id: newPromotion.id };
    } catch (error) {
      console.error('Error creating promotion:', error);
      throw new InternalServerErrorException({ success: false, message: 'Server error' });
    }
  }

  async updatePromotion(id: string, payload: PromotionPayload) {
    try {
      const baseName = payload.name || payload.name_vi || payload.name_en;
      await this.prisma.buyXGetYPromotion.update({
        where: { id: Number(id) },
        data: {
          name: baseName || undefined,
          name_vi: payload.name_vi !== undefined ? (payload.name_vi || baseName || null) : undefined,
          name_en: payload.name_en !== undefined ? (payload.name_en || baseName || null) : undefined,
          buy_product_id: Number(payload.buy_product_id),
          buy_quantity: Number(payload.buy_quantity),
          gift_product_id: Number(payload.gift_product_id),
          gift_quantity: Number(payload.gift_quantity),
          start_date: new Date(payload.start_date as string),
          end_date: new Date(payload.end_date as string),
          max_gift_per_order: payload.max_gift_per_order ? Number(payload.max_gift_per_order) : null,
          total_gift_limit: payload.total_gift_limit ? Number(payload.total_gift_limit) : null,
          priority: payload.priority ? Number(payload.priority) : 0,
          is_stackable: Boolean(payload.is_stackable),
        },
      });
      return { success: true, message: 'Updated successfully' };
    } catch (error) {
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
