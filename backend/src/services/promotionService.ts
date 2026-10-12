import prisma from '../../prisma/client';
import { getErrorMessage } from '../utils/errorMessage';

interface CartItem {
  product_id: number;
  quantity: number;
  size_id?: number;
  color_id?: number;
  block_other_discounts?: boolean;
}

interface GiftVariant {
  size_id: number;
  color_id: number;
  color: string;
  size: string;
  stock: number;
  image: string | null;
}

interface GiftItem {
  promotion_id: number;
  gift_product_id: number;
  expected_quantity: number;
  actual_quantity: number;
  is_partial_gift: boolean;
  status: 'PARTIAL' | 'FULL';
  is_stackable: boolean;
  variants: GiftVariant[];
  message: string;
}

interface UserSelectedGift {
  promotion_id: number;
  size_id: number;
  actual_quantity: number;
}

const promotionService = {
  calculateCartPromotions: async (cartItems: CartItem[]): Promise<{ cartItems: CartItem[]; giftItems: GiftItem[] }> => {
    return await promotionService.calculateBuyXGetY(cartItems);
  },

  calculateBuyXGetY: async (cartItems: CartItem[]): Promise<{ cartItems: CartItem[]; giftItems: GiftItem[] }> => {
    const giftItems: GiftItem[] = [];

    const now = new Date();
    const activePromos = await prisma.buyXGetYPromotion.findMany({
      where: {
        status: 'active',
        start_date: { lte: now },
        end_date: { gte: now },
        OR: [
          { total_gift_limit: null },
          { total_gift_limit: { gt: 0 } },
        ],
      },
      orderBy: { priority: 'desc' },
    });

    const eligiblePromos = activePromos.filter(p =>
      p.total_gift_limit === null || p.total_gifts_issued < p.total_gift_limit
    );

    if (eligiblePromos.length === 0) {
      return { cartItems, giftItems };
    }

    const promoMap: Record<number, typeof activePromos> = {};
    const variantMap: Record<number, GiftVariant[]> = {};

    for (const promo of eligiblePromos) {
      promoMap[promo.buy_product_id] = promoMap[promo.buy_product_id] || [];
      promoMap[promo.buy_product_id].push(promo);

      if (!variantMap[promo.gift_product_id]) {
        const sizes = await prisma.productSize.findMany({
          where: {
            color: { product_id: promo.gift_product_id },
            stock: { gt: 0 },
          },
          include: { color: true },
        });
        variantMap[promo.gift_product_id] = sizes.map(s => ({
          size_id: s.id,
          color_id: s.color_id,
          color: s.color.color_name,
          size: s.size,
          stock: s.stock,
          image: s.color.image_url,
        }));
      }
    }

    for (const item of cartItems) {
      const matchedPromos = promoMap[item.product_id];
      if (!matchedPromos) continue;

      for (const promo of matchedPromos) {
        let expectedGiftQty = Math.floor(item.quantity / promo.buy_quantity) * promo.gift_quantity;

        if (expectedGiftQty <= 0) continue;

        if (promo.max_gift_per_order !== null) {
          expectedGiftQty = Math.min(expectedGiftQty, promo.max_gift_per_order);
        }

        if (promo.total_gift_limit !== null) {
          const remaining = Math.max(0, promo.total_gift_limit - promo.total_gifts_issued);
          expectedGiftQty = Math.min(expectedGiftQty, remaining);
        }

        const variants = variantMap[promo.gift_product_id];
        if (!variants || variants.length === 0) continue;

        const totalStock = variants.reduce((sum, v) => sum + v.stock, 0);
        const actualGiftQty = Math.min(expectedGiftQty, totalStock);

        if (actualGiftQty <= 0) continue;

        const isPartialGift = actualGiftQty < expectedGiftQty;

        giftItems.push({
          promotion_id: promo.id,
          gift_product_id: promo.gift_product_id,
          expected_quantity: expectedGiftQty,
          actual_quantity: actualGiftQty,
          is_partial_gift: isPartialGift,
          status: isPartialGift ? 'PARTIAL' : 'FULL',
          is_stackable: promo.is_stackable,
          variants,
          message: isPartialGift
            ? `Only ${actualGiftQty} free item(s) available. Please choose color and size.`
            : `You received ${actualGiftQty} free item(s). Please choose color and size.`,
        });

        if (!promo.is_stackable) {
          item.block_other_discounts = true;
          break;
        }
      }
    }

    return { cartItems, giftItems };
  },

  applyPromotionsAtCheckout: async (userSelectedGifts: UserSelectedGift[]): Promise<{ success: boolean; message: string }> => {
    if (!userSelectedGifts || userSelectedGifts.length === 0) {
      return { success: true, message: 'No gifts to process.' };
    }

    try {
      await prisma.$transaction(async (tx) => {
        for (const gift of userSelectedGifts) {
          // Fetch current state first, then enforce limit atomically
          // Prisma field references don't work in updateMany WHERE — use explicit check
          const promo = await tx.buyXGetYPromotion.findUnique({
            where: { id: gift.promotion_id },
            select: { total_gift_limit: true, total_gifts_issued: true }
          });

          if (!promo) {
            throw new Error(`Promotion ID ${gift.promotion_id} does not exist.`);
          }

          if (promo.total_gift_limit !== null &&
              promo.total_gifts_issued + gift.actual_quantity > promo.total_gift_limit) {
            throw new Error(`Promotion ID ${gift.promotion_id} has reached its gift limit.`);
          }

          const promoUpdate = await tx.buyXGetYPromotion.updateMany({
            where: {
              id: gift.promotion_id,
              OR: [
                { total_gift_limit: null },
                // Atomic guard: only succeed if still within limit
                { total_gift_limit: { gte: promo.total_gifts_issued + gift.actual_quantity } },
              ],
            },
            data: { total_gifts_issued: { increment: gift.actual_quantity } },
          });

          if (promoUpdate.count === 0) {
            throw new Error(`Promotion ID ${gift.promotion_id} has reached its gift limit or does not exist.`);
          }

          const stockUpdate = await tx.productSize.updateMany({
            where: {
              id: gift.size_id,
              stock: { gte: gift.actual_quantity },
            },
            data: { stock: { decrement: gift.actual_quantity } },
          });

          if (stockUpdate.count === 0) {
            throw new Error(`Gift item with size_id ${gift.size_id} is out of stock.`);
          }
        }
      });

      return { success: true, message: 'Promotions applied and stock updated successfully.' };
    } catch (error: unknown) {
      console.error('Error processing gifts at checkout:', getErrorMessage(error));
      throw error;
    }
  },
};

export default promotionService;
