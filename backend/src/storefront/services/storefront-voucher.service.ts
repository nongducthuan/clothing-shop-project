import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { getErrorMessage } from '../../utils/errorMessage';
import { calculateDiscountedUnitPrice, toVnd } from '../../utils/pricing';

type CartItem = { id?: number | string; product_id?: number | string; quantity: number | string; block_other_discounts?: boolean };
type ActiveSale = Prisma.SaleGetPayload<{ include: { product_sales: true; sale_categories: true } }>;

const isCartItem = (value: unknown): value is CartItem => {
  if (typeof value !== 'object' || value === null) return false;
  const item = value as Record<string, unknown>;
  const productId = item.product_id ?? item.id;
  return (typeof productId === 'number' || typeof productId === 'string')
    && (typeof item.quantity === 'number' || typeof item.quantity === 'string');
};

@Injectable()
export class StorefrontVoucherService {
  constructor(private readonly prisma: PrismaService) {}

  async applyVoucher(body: {
    code?: string; orderTotal?: number | string; subtotal?: number | string;
    membershipDiscountableSubtotal?: number | string; cartItems?: unknown;
  }) {
    try {
      const { code, orderTotal, subtotal, membershipDiscountableSubtotal, cartItems } = body;
      const voucher = await this.prisma.voucher.findUnique({
        where: { code: code as string },
        include: { product_vouchers: true, voucher_categories: true },
      });
      if (!voucher || !voucher.status) throw new NotFoundException({ success: false, message: 'Voucher does not exist or has expired!' });
      if (voucher.usage_limit !== null && voucher.usage_limit <= 0) throw new BadRequestException({ success: false, message: 'Voucher usage limit reached!' });
      if (voucher.start_date && new Date() < new Date(voucher.start_date)) throw new BadRequestException({ success: false, message: 'Voucher is not active yet!' });
      if (voucher.end_date && new Date() > new Date(voucher.end_date)) throw new BadRequestException({ success: false, message: 'Voucher has expired!' });

      const safeCartItems: CartItem[] = Array.isArray(cartItems) ? cartItems.filter(isCartItem) : [];
      const productIds = safeCartItems.map((item) => Number(item.product_id || item.id)).filter(Boolean);
      const dbProducts = await this.prisma.product.findMany({
        where: { id: { in: productIds } },
        select: { id: true, price: true, category_id: true },
      });
      const sales = await this.prisma.sale.findMany({
        where: { status: true, start_date: { lte: new Date() }, end_date: { gte: new Date() } },
        include: { product_sales: true, sale_categories: true },
      });
      const priceMap = new Map<number, number>();
      const categoryMap = new Map<number, number>();
      for (const product of dbProducts) {
        categoryMap.set(product.id, product.category_id);
        const applicableSales = sales.filter((sale: ActiveSale) => sale.apply_scope === 'all'
          || sale.product_sales.some((row) => row.product_id === product.id)
          || sale.sale_categories.some((row) => row.category_id === product.category_id))
          .sort((a: ActiveSale, b: ActiveSale) => Number(b.discount_percent) - Number(a.discount_percent));
        const discount = applicableSales.length ? Number(applicableSales[0].discount_percent) : 0;
        priceMap.set(product.id, calculateDiscountedUnitPrice(product.price, discount));
      }

      const fallbackSubtotal = Number(subtotal || orderTotal || 0);
      const goodsSubtotal = safeCartItems.length
        ? safeCartItems.reduce((sum, item) => sum + (priceMap.get(Number(item.product_id || item.id)) ?? 0) * Number(item.quantity), 0)
        : fallbackSubtotal;
      const orderTotalNum = Number(orderTotal ?? fallbackSubtotal);
      const eligibleForMembership = safeCartItems.filter((item) => item.block_other_discounts !== true);
      const membershipBase = eligibleForMembership.reduce((sum, item) => sum + (priceMap.get(Number(item.product_id || item.id)) ?? 0) * Number(item.quantity), 0);
      const suppliedMembershipBase = Number(membershipDiscountableSubtotal);
      const effectiveMembershipBase = Number.isFinite(suppliedMembershipBase) && suppliedMembershipBase >= 0 ? suppliedMembershipBase : membershipBase;
      const membershipRate = effectiveMembershipBase > 0 ? Math.max(0, Math.min(1, (goodsSubtotal - orderTotalNum) / effectiveMembershipBase)) : 0;
      const eligibleCartItems = safeCartItems.filter((item) => item.block_other_discounts !== true);
      const priceAfterMembership = (item: CartItem) => {
        const lineTotal = (priceMap.get(Number(item.product_id || item.id)) ?? 0) * Number(item.quantity);
        return item.block_other_discounts === true ? lineTotal : lineTotal * (1 - membershipRate);
      };

      let eligibleTotal = 0;
      if (voucher.apply_scope === 'all') {
        eligibleTotal = safeCartItems.length ? eligibleCartItems.reduce((sum, item) => sum + priceAfterMembership(item), 0) : orderTotalNum;
      } else if (voucher.apply_scope === 'product') {
        const allowedIds = voucher.product_vouchers.map((row) => row.product_id);
        eligibleTotal = eligibleCartItems.filter((item) => allowedIds.includes(Number(item.product_id || item.id)))
          .reduce((sum, item) => sum + priceAfterMembership(item), 0);
      } else if (voucher.apply_scope === 'category') {
        const allowedIds = voucher.voucher_categories.map((row) => row.category_id);
        eligibleTotal = eligibleCartItems.filter((item) => allowedIds.includes(categoryMap.get(Number(item.product_id || item.id)) as number))
          .reduce((sum, item) => sum + priceAfterMembership(item), 0);
      }
      if (eligibleTotal === 0) throw new BadRequestException({ success: false, message: 'This voucher is not applicable to any products in your cart!' });
      if (goodsSubtotal < Number(voucher.min_order_value)) {
        throw new BadRequestException({ success: false, message: 'Minimum order value not met', min_order_value: Number(voucher.min_order_value) });
      }
      eligibleTotal = toVnd(eligibleTotal);
      let discountAmount = toVnd((eligibleTotal * Number(voucher.discount_percent || 0)) / 100);
      if (voucher.max_discount_amount !== null && voucher.max_discount_amount !== undefined) {
        discountAmount = Math.min(discountAmount, toVnd(voucher.max_discount_amount));
      }
      discountAmount = Math.min(discountAmount, eligibleTotal);
      return {
        success: true,
        message: 'Voucher applied successfully!',
        data: {
          ...voucher,
          discount_amount: discountAmount,
          final_total: Math.max(0, toVnd(orderTotalNum) - discountAmount),
          applied_to_total: eligibleTotal,
        },
      };
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof NotFoundException) throw error;
      console.error('Voucher application error:', error);
      throw new InternalServerErrorException({ success: false, message: 'Server error applying voucher' });
    }
  }

  async getActiveVouchers(query: { category_id?: string; product_id?: string }) {
    try {
      const now = new Date();
      const vouchers = await this.prisma.voucher.findMany({
        where: {
          status: true,
          AND: [
            { OR: [{ start_date: null }, { start_date: { lte: now } }] },
            { OR: [{ end_date: null }, { end_date: { gte: now } }] },
            { OR: [{ usage_limit: null }, { usage_limit: { gt: 0 } }] },
          ],
        },
        include: { product_vouchers: true, voucher_categories: true },
      });
      const filtered = vouchers.filter((voucher) => {
        if (!query.category_id && !query.product_id) return true;
        if (voucher.apply_scope === 'all') return true;
        if (voucher.apply_scope === 'category' && query.category_id) return voucher.voucher_categories.some((row) => row.category_id === Number(query.category_id));
        if (voucher.apply_scope === 'product' && query.product_id) return voucher.product_vouchers.some((row) => row.product_id === Number(query.product_id));
        return false;
      });
      return { success: true, data: filtered };
    } catch (error) {
      console.error('Voucher API Error:', getErrorMessage(error));
      throw new InternalServerErrorException({ success: false, error: getErrorMessage(error) });
    }
  }
}
