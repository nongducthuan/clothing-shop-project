import type { Prisma } from '../generated/prisma/client';
import type { OrderRequestItem, TxClient } from '../types/orderTypes';

export type ProductWithOptions = Prisma.ProductGetPayload<{
    include: { colors: { include: { sizes: true } } };
}>;

export type ActiveSale = Prisma.SaleGetPayload<{
    include: { product_sales: true; sale_categories: true };
}>;

export type GiftPromotion = Prisma.BuyXGetYPromotionGetPayload<{
    select: {
        id: true;
        gift_product_id: true;
        buy_product_id: true;
        buy_quantity: true;
        gift_quantity: true;
        max_gift_per_order: true;
        total_gift_limit: true;
        total_gifts_issued: true;
        start_date: true;
        end_date: true;
        status: true;
        is_active: true;
        is_stackable: true;
        priority: true;
    };
}>;

type GiftStock = { tracked: boolean; remaining: number };

export type OrderValidationContext = {
    now: Date;
    productMap: Map<number, ProductWithOptions>;
    promotionMap: Map<number, GiftPromotion>;
    activePromotions: GiftPromotion[];
    eligiblePromotionIds: Set<number>;
    blockedProductIds: Set<number>;
    purchasedQuantityByProduct: Map<number, number>;
    sales: ActiveSale[];
    sizeMap: Map<number, { id: number; stock: number }>;
    promotionPriority: Map<number, number>;
};

const GIFT_PROMOTION_SELECT = {
    id: true,
    gift_product_id: true,
    buy_product_id: true,
    buy_quantity: true,
    gift_quantity: true,
    max_gift_per_order: true,
    total_gift_limit: true,
    total_gifts_issued: true,
    start_date: true,
    end_date: true,
    status: true,
    is_active: true,
    is_stackable: true,
    priority: true,
} as const;

function getPurchasedQuantities(items: OrderRequestItem[]): Map<number, number> {
    const quantities = new Map<number, number>();
    for (const item of items) {
        if (item.is_gift) continue;
        const productId = Number(item.product_id);
        quantities.set(productId, (quantities.get(productId) ?? 0) + Number(item.quantity));
    }
    return quantities;
}

async function loadRequestedPromotions(
    tx: TxClient,
    promotionIds: number[],
): Promise<Map<number, GiftPromotion>> {
    const promotionMap = new Map<number, GiftPromotion>();
    if (promotionIds.length === 0) return promotionMap;

    const promotions: GiftPromotion[] = await tx.buyXGetYPromotion.findMany({
        where: { id: { in: promotionIds } },
        select: GIFT_PROMOTION_SELECT,
    });
    for (const promotion of promotions) promotionMap.set(promotion.id, promotion);
    return promotionMap;
}

async function loadActivePromotions(
    tx: TxClient,
    purchasedProductIds: number[],
    now: Date,
): Promise<GiftPromotion[]> {
    if (purchasedProductIds.length === 0) return [];
    return tx.buyXGetYPromotion.findMany({
        where: {
            buy_product_id: { in: purchasedProductIds },
            is_active: true,
            status: 'active',
            start_date: { lte: now },
            end_date: { gte: now },
        },
        select: GIFT_PROMOTION_SELECT,
        orderBy: [{ priority: 'desc' }, { id: 'asc' }],
    });
}

async function loadGiftStock(
    tx: TxClient,
    activePromotions: GiftPromotion[],
    purchasedQuantityByProduct: Map<number, number>,
): Promise<Map<number, GiftStock>> {
    const giftProductIds = [...new Set(activePromotions.map(promotion => promotion.gift_product_id))];
    if (giftProductIds.length === 0) return new Map();

    const giftProducts: ProductWithOptions[] = await tx.product.findMany({
        where: { id: { in: giftProductIds }, is_active: true },
        include: { colors: { include: { sizes: true } } },
    });

    const giftStockByProduct = new Map<number, GiftStock>();
    for (const giftProduct of giftProducts) {
        const variants = giftProduct.colors.flatMap(color => color.sizes);
        const tracked = variants.length > 0;
        const onHand = variants.reduce((sum, variant) => sum + Math.max(0, Number(variant.stock) || 0), 0);
        const alreadyPurchased = purchasedQuantityByProduct.get(giftProduct.id) ?? 0;
        giftStockByProduct.set(giftProduct.id, {
            tracked,
            remaining: tracked ? Math.max(0, onHand - alreadyPurchased) : Number.POSITIVE_INFINITY,
        });
    }
    return giftStockByProduct;
}

function findEligiblePromotions(
    activePromotions: GiftPromotion[],
    giftStockByProduct: Map<number, GiftStock>,
    purchasedQuantityByProduct: Map<number, number>,
): Set<number> {
    const eligiblePromotionIds = new Set<number>();
    const stoppedBuyProducts = new Set<number>();

    for (const promotion of activePromotions) {
        if (stoppedBuyProducts.has(promotion.buy_product_id)) continue;
        if (promotion.total_gift_limit !== null && promotion.total_gifts_issued >= promotion.total_gift_limit) continue;

        const giftStock = giftStockByProduct.get(promotion.gift_product_id);
        if (!giftStock || giftStock.remaining <= 0) continue;

        const boughtQuantity = purchasedQuantityByProduct.get(promotion.buy_product_id) ?? 0;
        let expectedGiftQuantity = Math.floor(boughtQuantity / promotion.buy_quantity) * promotion.gift_quantity;
        if (promotion.max_gift_per_order !== null) {
            expectedGiftQuantity = Math.min(expectedGiftQuantity, promotion.max_gift_per_order);
        }
        if (promotion.total_gift_limit !== null) {
            expectedGiftQuantity = Math.min(
                expectedGiftQuantity,
                promotion.total_gift_limit - promotion.total_gifts_issued,
            );
        }
        if (giftStock.tracked) expectedGiftQuantity = Math.min(expectedGiftQuantity, giftStock.remaining);
        if (expectedGiftQuantity <= 0) continue;

        if (giftStock.tracked) giftStock.remaining -= expectedGiftQuantity;
        eligiblePromotionIds.add(promotion.id);
        if (promotion.is_stackable === false) stoppedBuyProducts.add(promotion.buy_product_id);
    }

    return eligiblePromotionIds;
}

function getBlockedProductIds(
    activePromotions: GiftPromotion[],
    eligiblePromotionIds: Set<number>,
): Set<number> {
    const blockedProductIds = new Set<number>();
    for (const promotion of activePromotions) {
        if (eligiblePromotionIds.has(promotion.id) && promotion.is_stackable === false) {
            blockedProductIds.add(promotion.buy_product_id);
        }
    }
    return blockedProductIds;
}

async function loadSizeMap(
    tx: TxClient,
    sizeIds: number[],
): Promise<Map<number, { id: number; stock: number }>> {
    const sizeMap = new Map<number, { id: number; stock: number }>();
    if (sizeIds.length === 0) return sizeMap;

    const sizes = await tx.productSize.findMany({ where: { id: { in: sizeIds } } });
    for (const size of sizes) sizeMap.set(size.id, size);
    return sizeMap;
}

export async function loadOrderValidationContext(
    tx: TxClient,
    items: OrderRequestItem[],
): Promise<OrderValidationContext> {
    const productIds = items.map(item => Number(item.product_id));
    const promotionIds = items.filter(item => item.is_gift && item.promotion_id).map(item => Number(item.promotion_id));
    const sizeIds = items.filter(item => item.size_id).map(item => Number(item.size_id));

    const products: ProductWithOptions[] = await tx.product.findMany({
        where: { id: { in: productIds }, is_active: true },
        include: { colors: { include: { sizes: true } } },
    });
    const productMap = new Map(products.map(product => [product.id, product]));

    const now = new Date();
    const promotionMap = await loadRequestedPromotions(tx, promotionIds);
    const purchasedQuantityByProduct = getPurchasedQuantities(items);
    const activePromotions = await loadActivePromotions(
        tx,
        [...purchasedQuantityByProduct.keys()],
        now,
    );
    const giftStockByProduct = await loadGiftStock(tx, activePromotions, purchasedQuantityByProduct);
    const eligiblePromotionIds = findEligiblePromotions(
        activePromotions,
        giftStockByProduct,
        purchasedQuantityByProduct,
    );
    const blockedProductIds = getBlockedProductIds(activePromotions, eligiblePromotionIds);

    // Keep the sales query's own timestamp, as in the previous implementation.
    const sales: ActiveSale[] = await tx.sale.findMany({
        where: {
            status: true,
            start_date: { lte: new Date() },
            end_date: { gte: new Date() },
        },
        include: { product_sales: true, sale_categories: true },
    });

    const sizeMap = await loadSizeMap(tx, sizeIds);
    const promotionPriority = new Map(activePromotions.map((promotion, index) => [promotion.id, index]));

    return {
        now,
        productMap,
        promotionMap,
        activePromotions,
        eligiblePromotionIds,
        blockedProductIds,
        purchasedQuantityByProduct,
        sales,
        sizeMap,
        promotionPriority,
    };
}

