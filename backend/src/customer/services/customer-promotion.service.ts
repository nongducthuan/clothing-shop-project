import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

type CartItem = { product_id: number | string; quantity: number | string; block_other_discounts?: boolean };
type GiftVariant = { size_id: number; color_id: number; color: string; size: string; stock: number; image: string | null };
type ProductVariant = { size_id: number; color_id: number; color_name: string; size: string; stock: number; image_url: string | null };
type GiftItem = {
  promotion_id: number; gift_product_id: number; expected_quantity: number; actual_quantity: number;
  is_partial_gift: boolean; status: 'PARTIAL' | 'FULL'; is_stackable: boolean; variants: GiftVariant[]; message: string;
};

const isCartItem = (value: unknown): value is CartItem => {
  if (typeof value !== 'object' || value === null) return false;
  const item = value as Record<string, unknown>;
  const productId = item.product_id;
  const quantity = item.quantity;
  const parsedProductId = Number(productId);
  const parsedQuantity = Number(quantity);
  return (typeof productId === 'number' || typeof productId === 'string')
    && (typeof quantity === 'number' || typeof quantity === 'string')
    && Number.isInteger(parsedProductId) && parsedProductId > 0
    && Number.isInteger(parsedQuantity) && parsedQuantity > 0;
};

@Injectable()
export class CustomerPromotionService {
  constructor(private readonly prisma: PrismaService) {}

  async getActivePromotions() {
    try {
      const now = new Date();
      const promotions = await this.prisma.buyXGetYPromotion.findMany({
        where: {
          is_active: true,
          status: 'active',
          start_date: { lte: now },
          end_date: { gte: now },
          OR: [{ total_gift_limit: null }, { total_gift_limit: { gt: 0 } }],
        },
        orderBy: [{ priority: 'desc' }, { id: 'asc' }],
      });
      const active = promotions.filter((promotion) => promotion.total_gift_limit === null || promotion.total_gifts_issued < promotion.total_gift_limit);
      return { success: true, data: active };
    } catch (error) {
      console.error('Error fetching active promotions:', error);
      throw new InternalServerErrorException({ success: false, message: 'Server error' });
    }
  }

  async calculateCart(body: { cartItems?: unknown }) {
    try {
      const cartItems: CartItem[] = Array.isArray(body.cartItems) ? body.cartItems.filter(isCartItem) : [];
      if (!cartItems.length) throw new BadRequestException({ success: false, message: 'Empty Cart' });
      const now = new Date();
      const promotions = await this.prisma.buyXGetYPromotion.findMany({
        where: { is_active: true, status: 'active', start_date: { lte: now }, end_date: { gte: now } },
        orderBy: [{ priority: 'desc' }, { id: 'asc' }],
      });
      const activePromos = promotions.filter((promotion) => promotion.total_gift_limit === null || promotion.total_gifts_issued < promotion.total_gift_limit);
      const giftItems: GiftItem[] = [];
      const inventoryByProduct = new Map<number, { variants: ProductVariant[]; tracked: boolean; remaining: number }>();
      const quantityByProduct = new Map<number, number>();
      for (const item of cartItems) {
        const productId = Number(item.product_id);
        const quantity = Number(item.quantity);
        if (Number.isInteger(productId) && productId > 0 && Number.isFinite(quantity) && quantity > 0) {
          quantityByProduct.set(productId, (quantityByProduct.get(productId) ?? 0) + quantity);
        }
      }
      const stoppedBuyProducts = new Set<number>();
      for (const promo of activePromos) {
        if (stoppedBuyProducts.has(promo.buy_product_id)) continue;
        const productQuantity = quantityByProduct.get(promo.buy_product_id) ?? 0;
        let expectedGiftQty = Math.floor(productQuantity / promo.buy_quantity) * promo.gift_quantity;
        if (expectedGiftQty <= 0) continue;
        if (promo.max_gift_per_order !== null) expectedGiftQty = Math.min(expectedGiftQty, promo.max_gift_per_order);
        if (promo.total_gift_limit !== null) {
          expectedGiftQty = Math.min(expectedGiftQty, Math.max(0, promo.total_gift_limit - promo.total_gifts_issued));
        }
        if (expectedGiftQty <= 0) continue;
        let inventory = inventoryByProduct.get(promo.gift_product_id);
        if (!inventory) {
          const productColors = await this.prisma.productColor.findMany({
            where: { product_id: promo.gift_product_id },
            include: { sizes: true },
          });
          const allSizes = productColors.flatMap((color) => color.sizes);
          const variants: ProductVariant[] = productColors.flatMap((color) => color.sizes
            .filter((size) => Number(size.stock) > 0)
            .map((size) => ({
              size_id: size.id,
              color_id: color.id,
              color_name: color.color_name,
              size: size.size,
              stock: Number(size.stock),
              image_url: color.image_url,
            })));
          const tracked = allSizes.length > 0;
          const totalStock = variants.reduce((sum, variant) => sum + variant.stock, 0);
          const alreadyInCart = quantityByProduct.get(promo.gift_product_id) ?? 0;
          inventory = { variants, tracked, remaining: tracked ? Math.max(0, totalStock - alreadyInCart) : Number.POSITIVE_INFINITY };
          inventoryByProduct.set(promo.gift_product_id, inventory);
        }
        if (inventory.tracked && inventory.remaining <= 0) continue;
        const actualGiftQty = inventory.tracked ? Math.min(expectedGiftQty, inventory.remaining) : expectedGiftQty;
        if (actualGiftQty <= 0) continue;
        const isPartialGift = actualGiftQty < expectedGiftQty;
        if (inventory.tracked) inventory.remaining -= actualGiftQty;
        giftItems.push({
          promotion_id: promo.id,
          gift_product_id: promo.gift_product_id,
          expected_quantity: expectedGiftQty,
          actual_quantity: actualGiftQty,
          is_partial_gift: isPartialGift,
          status: isPartialGift ? 'PARTIAL' : 'FULL',
          is_stackable: promo.is_stackable,
          variants: inventory.variants.map((variant) => ({
            size_id: variant.size_id, color_id: variant.color_id, color: variant.color_name,
            size: variant.size, stock: variant.stock, image: variant.image_url,
          })),
          message: isPartialGift
            ? `Only ${actualGiftQty} free item(s) available. Please choose color and size.`
            : inventory.variants.length > 0
              ? `You received ${actualGiftQty} free item(s). Please choose color and size.`
              : `You received ${actualGiftQty} free item(s).`,
        });
        if (!promo.is_stackable) {
          cartItems.filter((item) => Number(item.product_id) === promo.buy_product_id)
            .forEach((item) => { item.block_other_discounts = true; });
          stoppedBuyProducts.add(promo.buy_product_id);
        }
      }
      return { success: true, data: { cartItems, giftItems } };
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      console.error('Error in calculateCart service:', error);
      throw new InternalServerErrorException({ success: false, message: 'Server error when calculating promotion.' });
    }
  }
}
