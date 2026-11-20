import type { OrderItemToSave, OrderRequestItem, TxClient } from '../types/orderTypes';
import { calculateDiscountedUnitPrice } from '../utils/pricing';
import { OrderCreationError } from './orderCreationErrors';
import {
    loadOrderValidationContext,
    type ActiveSale,
    type GiftPromotion,
    type OrderValidationContext,
    type ProductWithOptions,
} from './orderReservationContext';

type StockDecrement = { quantity: number; productName: string };

function orderItemsForReservation(
    items: OrderRequestItem[],
    promotionPriority: Map<number, number>,
): OrderRequestItem[] {
    // Purchased items are reserved first, then gifts in server-defined promotion priority.
    return [...items].sort((a, b) => {
        const aGift = a.is_gift === true;
        const bGift = b.is_gift === true;
        if (aGift !== bGift) return aGift ? 1 : -1;
        if (!aGift) return 0;
        return (promotionPriority.get(Number(a.promotion_id)) ?? Number.MAX_SAFE_INTEGER)
            - (promotionPriority.get(Number(b.promotion_id)) ?? Number.MAX_SAFE_INTEGER);
    });
}

function validateProductOptions(
    product: ProductWithOptions,
    item: OrderRequestItem,
): { hasSizes: boolean; colorId: number | null; sizeId: number | null } {
    const isGift = item.is_gift === true;
    const hasSizes = product.colors.some(color => color.sizes.length > 0);
    if (hasSizes && !item.size_id && !isGift) {
        throw new OrderCreationError(400, `Please select a size for product "${product.name}"`);
    }

    const colorId = item.color_id == null ? null : Number(item.color_id);
    const sizeId = item.size_id == null ? null : Number(item.size_id);
    if (colorId !== null && !product.colors.some(color => color.id === colorId)) {
        throw new OrderCreationError(400, `Selected color does not belong to product "${product.name}".`);
    }
    if (sizeId !== null) {
        const selectedSize = product.colors.flatMap(color => color.sizes).find(size => size.id === sizeId);
        if (!selectedSize) {
            throw new OrderCreationError(400, `Selected size does not belong to product "${product.name}".`);
        }
        if (colorId !== null && selectedSize.color_id !== colorId) {
            throw new OrderCreationError(400, `Selected size does not belong to the selected color for product "${product.name}".`);
        }
    }

    return { hasSizes, colorId, sizeId };
}

function validateGiftPromotion(
    item: OrderRequestItem,
    product: ProductWithOptions,
    now: Date,
    promotionMap: Map<number, GiftPromotion>,
    eligiblePromotionIds: Set<number>,
    purchasedQuantityByProduct: Map<number, number>,
    giftQuantityByPromotion: Map<number, number>,
): GiftPromotion | null {
    if (item.is_gift !== true) return null;
    if (!item.promotion_id) {
        throw new OrderCreationError(400, `Gift item "${product.name}" is missing promotion reference.`);
    }

    const promotion = promotionMap.get(Number(item.promotion_id));
    if (!promotion || promotion.gift_product_id !== product.id) {
        throw new OrderCreationError(400, `Buy X Get Y promotion is invalid for gift item "${product.name}".`);
    }
    if (
        !promotion.is_active ||
        promotion.status !== 'active' ||
        promotion.start_date > now ||
        promotion.end_date < now
    ) {
        throw new OrderCreationError(409, `Buy X Get Y promotion is no longer active for gift item "${product.name}".`);
    }
    if (!eligiblePromotionIds.has(promotion.id)) {
        throw new OrderCreationError(400, `Buy X Get Y promotion is invalid for gift item "${product.name}".`);
    }

    const purchasedQuantity = purchasedQuantityByProduct.get(promotion.buy_product_id) ?? 0;
    let allowedGiftQuantity = Math.floor(purchasedQuantity / promotion.buy_quantity) * promotion.gift_quantity;
    if (promotion.max_gift_per_order !== null) {
        allowedGiftQuantity = Math.min(allowedGiftQuantity, promotion.max_gift_per_order);
    }
    if (promotion.total_gift_limit !== null) {
        allowedGiftQuantity = Math.min(
            allowedGiftQuantity,
            Math.max(0, promotion.total_gift_limit - promotion.total_gifts_issued),
        );
    }

    const previousGiftQuantity = giftQuantityByPromotion.get(promotion.id) ?? 0;
    const requestedGiftQuantity = Number(item.quantity);
    if (previousGiftQuantity + requestedGiftQuantity > allowedGiftQuantity) {
        throw new OrderCreationError(400, `Gift quantity exceeds the active promotion allowance for "${product.name}".`);
    }
    return promotion;
}

function getDiscountPercent(product: ProductWithOptions, sales: ActiveSale[]): number {
    const applicableSales = sales
        .filter(sale =>
            sale.apply_scope === 'all' ||
            sale.product_sales.some(productSale => productSale.product_id === product.id) ||
            sale.sale_categories.some(categorySale => categorySale.category_id === product.category_id)
        )
        .sort((a, b) => Number(b.discount_percent) - Number(a.discount_percent));

    return applicableSales.length > 0 ? Number(applicableSales[0].discount_percent) : 0;
}

function allocateSizedGift(
    item: OrderRequestItem,
    product: ProductWithOptions,
    promotion: GiftPromotion,
    colorId: number | null,
    sizeId: number | null,
    context: OrderValidationContext,
    giftQuantityByPromotion: Map<number, number>,
    stockDecrements: Map<number, StockDecrement>,
    itemsToSave: OrderItemToSave[],
): void {
    const previousGiftQuantity = giftQuantityByPromotion.get(promotion.id) ?? 0;
    let remainingGiftQuantity = Number(item.quantity);
    const variants = product.colors.flatMap(color =>
        color.sizes.map(size => ({
            id: size.id,
            color_id: color.id,
            stock: Number(size.stock),
        }))
    );
    variants.sort((a, b) => {
        const rank = (variant: typeof a) =>
            variant.id === sizeId ? 0 :
            colorId !== null && variant.color_id === colorId ? 1 : 2;
        return rank(a) - rank(b) || b.stock - a.stock;
    });

    let allocatedGiftQuantity = 0;
    for (const variant of variants) {
        if (remainingGiftQuantity <= 0) break;
        const alreadyReserved = stockDecrements.get(variant.id)?.quantity ?? 0;
        const available = Math.max(0, variant.stock - alreadyReserved);
        const quantity = Math.min(remainingGiftQuantity, available);
        if (quantity <= 0) continue;

        context.sizeMap.set(variant.id, { id: variant.id, stock: variant.stock });
        stockDecrements.set(variant.id, {
            quantity: alreadyReserved + quantity,
            productName: stockDecrements.get(variant.id)?.productName || product.name,
        });
        itemsToSave.push({
            product_id: Number(item.product_id),
            color_id: variant.color_id,
            size_id: variant.id,
            quantity,
            price: 0,
            import_price_snapshot: Number(product.import_price ?? 0),
            is_gift: true,
            promotion_id: promotion.id,
        });
        allocatedGiftQuantity += quantity;
        remainingGiftQuantity -= quantity;
    }

    if (remainingGiftQuantity > 0) {
        throw new OrderCreationError(409, `Gift stock changed while checking out for product "${product.name}". Please refresh your cart and try again.`);
    }
    giftQuantityByPromotion.set(promotion.id, previousGiftQuantity + allocatedGiftQuantity);
}

function saveStandardOrderItem(
    item: OrderRequestItem,
    product: ProductWithOptions,
    finalItemPrice: number,
    colorId: number | null,
    sizeId: number | null,
    promotion: GiftPromotion | null,
    giftQuantityByPromotion: Map<number, number>,
    stockDecrements: Map<number, StockDecrement>,
    itemsToSave: OrderItemToSave[],
): void {
    if (sizeId !== null) {
        const previousDecrement = stockDecrements.get(sizeId);
        stockDecrements.set(sizeId, {
            quantity: (previousDecrement?.quantity || 0) + Number(item.quantity),
            productName: previousDecrement?.productName || product.name,
        });
    }

    itemsToSave.push({
        product_id: Number(item.product_id),
        color_id: colorId,
        size_id: sizeId,
        quantity: Number(item.quantity),
        price: finalItemPrice,
        import_price_snapshot: Number(product.import_price ?? 0),
        is_gift: item.is_gift === true,
        promotion_id: promotion ? promotion.id : null,
    });

    if (item.is_gift === true && promotion) {
        const previousGiftQuantity = giftQuantityByPromotion.get(promotion.id) ?? 0;
        giftQuantityByPromotion.set(promotion.id, previousGiftQuantity + Number(item.quantity));
    }
}

function processOrderItem(
    item: OrderRequestItem,
    context: OrderValidationContext,
    giftQuantityByPromotion: Map<number, number>,
    stockDecrements: Map<number, StockDecrement>,
    itemsToSave: OrderItemToSave[],
): number {
    const productId = Number(item.product_id);
    const product = context.productMap.get(productId);
    if (!product) throw new OrderCreationError(400, 'Product not found');

    const { hasSizes, colorId, sizeId } = validateProductOptions(product, item);
    const promotion = validateGiftPromotion(
        item,
        product,
        context.now,
        context.promotionMap,
        context.eligiblePromotionIds,
        context.purchasedQuantityByProduct,
        giftQuantityByPromotion,
    );

    const isGift = item.is_gift === true;
    const finalItemPrice = isGift
        ? 0
        : calculateDiscountedUnitPrice(product.price, getDiscountPercent(product, context.sales));

    if (isGift && promotion && hasSizes) {
        allocateSizedGift(
            item,
            product,
            promotion,
            colorId,
            sizeId,
            context,
            giftQuantityByPromotion,
            stockDecrements,
            itemsToSave,
        );
    } else {
        saveStandardOrderItem(
            item,
            product,
            finalItemPrice,
            colorId,
            sizeId,
            promotion,
            giftQuantityByPromotion,
            stockDecrements,
            itemsToSave,
        );
    }

    return isGift ? 0 : finalItemPrice * Number(item.quantity);
}

async function reservePromotionGiftQuota(
    tx: TxClient,
    promotionMap: Map<number, GiftPromotion>,
    giftQuantityByPromotion: Map<number, number>,
    now: Date,
): Promise<void> {
    // Compare-and-swap the global gift quota inside the order transaction.
    for (const [promotionId, giftQuantity] of giftQuantityByPromotion) {
        const promotion = promotionMap.get(promotionId);
        if (!promotion) throw new OrderCreationError(400, 'Buy X Get Y promotion is invalid.');
        const updated = await tx.buyXGetYPromotion.updateMany({
            where: {
                id: promotion.id,
                is_active: true,
                status: 'active',
                start_date: { lte: now },
                end_date: { gte: now },
                total_gifts_issued: promotion.total_gifts_issued,
                total_gift_limit: promotion.total_gift_limit,
            },
            data: { total_gifts_issued: { increment: giftQuantity } },
        });
        if (updated.count !== 1) {
            throw new OrderCreationError(409, 'Buy X Get Y promotion was just updated or fully consumed. Please refresh and try again.');
        }
    }
}

async function reserveProductStock(
    tx: TxClient,
    sizeMap: Map<number, { id: number; stock: number }>,
    stockDecrements: Map<number, StockDecrement>,
): Promise<void> {
    // Validate all requested stock first, then perform conditional decrements.
    for (const [sizeId, decrement] of stockDecrements) {
        const size = sizeMap.get(sizeId);
        if (!size || size.stock < decrement.quantity) {
            throw new OrderCreationError(409, `Insufficient stock for product "${decrement.productName}" (size_id=${sizeId})`);
        }
    }

    for (const [sizeId, decrement] of stockDecrements) {
        const affected = await tx.productSize.updateMany({
            where: { id: sizeId, stock: { gte: decrement.quantity } },
            data: { stock: { decrement: decrement.quantity } },
        });
        if (affected.count !== 1) {
            throw new OrderCreationError(409, 'Out of stock due to high traffic! Please refresh and try again.');
        }
    }
}

export async function validateAndReserveItems(
    tx: TxClient,
    items: OrderRequestItem[]
): Promise<{ itemsToSave: OrderItemToSave[]; serverCalculatedTotal: number; blockedProductIds: Set<number> }> {
    const context = await loadOrderValidationContext(tx, items);
    const itemsToSave: OrderItemToSave[] = [];
    const stockDecrements = new Map<number, StockDecrement>();
    const giftQuantityByPromotion = new Map<number, number>();
    let serverCalculatedTotal = 0;

    const orderedItems = orderItemsForReservation(items, context.promotionPriority);
    for (const item of orderedItems) {
        serverCalculatedTotal += processOrderItem(
            item,
            context,
            giftQuantityByPromotion,
            stockDecrements,
            itemsToSave,
        );
    }

    await reservePromotionGiftQuota(tx, context.promotionMap, giftQuantityByPromotion, context.now);
    await reserveProductStock(tx, context.sizeMap, stockDecrements);

    return { itemsToSave, serverCalculatedTotal, blockedProductIds: context.blockedProductIds };
}

