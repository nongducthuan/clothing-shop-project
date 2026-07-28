import prisma from '../../prisma/client';

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
          { total_gifts_issued: { lt: prisma.buyXGetYPromotion.fields.total_gift_limit } as any },
        ],
      },
      orderBy: { priority: 'desc' },
    });

    if (activePromos.length === 0) {
      return { cartItems, giftItems };
    }

    const promoMap: Record<number, typeof activePromos> = {};
    const variantMap: Record<number, GiftVariant[]> = {};

    for (const promo of activePromos) {
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
      return { success: true, message: 'Không có quà tặng nào cần xử lý.' };
    }

    try {
      await prisma.$transaction(async (tx) => {
        for (const gift of userSelectedGifts) {
          // Cập nhật tổng số quà đã phát
          const promoUpdate = await tx.buyXGetYPromotion.updateMany({
            where: {
              id: gift.promotion_id,
              OR: [
                { total_gift_limit: null },
                { total_gifts_issued: { lte: prisma.buyXGetYPromotion.fields.total_gift_limit as any } },
              ],
            },
            data: { total_gifts_issued: { increment: gift.actual_quantity } },
          });

          if (promoUpdate.count === 0) {
            throw new Error(`Khuyến mãi ID ${gift.promotion_id} đã hết lượt nhận quà hoặc không tồn tại.`);
          }

          // Trừ kho quà tặng
          const stockUpdate = await tx.productSize.updateMany({
            where: {
              id: gift.size_id,
              stock: { gte: gift.actual_quantity },
            },
            data: { stock: { decrement: gift.actual_quantity } },
          });

          if (stockUpdate.count === 0) {
            throw new Error(`Quà tặng với size_id ${gift.size_id} đã hết hàng trong kho.`);
          }
        }
      });

      return { success: true, message: 'Đã áp dụng khuyến mãi và trừ kho thành công.' };
    } catch (error: any) {
      console.error('Lỗi khi xử lý quà tặng lúc Checkout:', error.message);
      throw error;
    }
  },
};

export default promotionService;
