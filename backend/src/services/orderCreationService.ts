import type { Prisma } from '../generated/prisma/client';
import type { OrderItemToSave, OrderRequestItem, TxClient } from '../types/orderTypes';
import { calculateDiscountedUnitPrice, toVnd } from '../utils/pricing';

export class OrderCreationError extends Error {
    constructor(readonly httpStatus: 400 | 409, message: string) {
        super(message);
        this.name = 'OrderCreationError';
    }
}

type ProductWithOptions = Prisma.ProductGetPayload<{
    include: { colors: { include: { sizes: true } } };
}>;

type ActiveSale = Prisma.SaleGetPayload<{
    include: { product_sales: true; sale_categories: true };
}>;

type GiftPromotion = Prisma.BuyXGetYPromotionGetPayload<{
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

export async function validateAndReserveItems(
    tx: TxClient,
    items: OrderRequestItem[]
): Promise<{ itemsToSave: OrderItemToSave[]; serverCalculatedTotal: number; blockedProductIds: Set<number> }> {
    let serverCalculatedTotal = 0;
    const itemsToSave: OrderItemToSave[] = [];

    const productIds = items.map(i => Number(i.product_id));
    const promotionIds = items.filter(i => i.is_gift && i.promotion_id).map(i => Number(i.promotion_id));
    const sizeIds = items.filter(i => i.size_id).map(i => Number(i.size_id));

    const products: ProductWithOptions[] = await tx.product.findMany({
        where: { id: { in: productIds }, is_active: true },
        include: { colors: { include: { sizes: true } } },
    });
    const productMap = new Map(products.map(p => [p.id, p]));

    const now = new Date();
    const promotionSelect = {
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
    const promotionMap = new Map<number, GiftPromotion>();
    if (promotionIds.length > 0) {
        const requestedPromotions: GiftPromotion[] = await tx.buyXGetYPromotion.findMany({
            where: { id: { in: promotionIds } },
            select: promotionSelect,
        });
        for (const promotion of requestedPromotions) promotionMap.set(promotion.id, promotion);
    }

    // Only promotions that would be offered for the purchased quantities may reserve gifts.
    // Respect priority and stop after the first qualifying non-stackable promotion per product.
    const purchasedQuantityByProduct = new Map<number, number>();
    for (const item of items) {
        if (item.is_gift) continue;
        const productId = Number(item.product_id);
        purchasedQuantityByProduct.set(productId, (purchasedQuantityByProduct.get(productId) ?? 0) + Number(item.quantity));
    }
    const purchasedProductIds = [...purchasedQuantityByProduct.keys()];
    const activePromotions: GiftPromotion[] = purchasedProductIds.length > 0
        ? await tx.buyXGetYPromotion.findMany({
            where: {
                buy_product_id: { in: purchasedProductIds },
                is_active: true,
                status: 'active',
                start_date: { lte: now },
                end_date: { gte: now },
            },
            select: promotionSelect,
            orderBy: [{ priority: 'desc' }, { id: 'asc' }],
        })
        : [];
    const giftProductIds = [...new Set(activePromotions.map(promo => promo.gift_product_id))];
    const giftProducts = giftProductIds.length > 0
        ? await tx.product.findMany({
            where: { id: { in: giftProductIds }, is_active: true },
            include: { colors: { include: { sizes: true } } },
        })
        : [];
    // A product may be gifted by multiple promotions, but its tracked stock is shared.
    // Count purchased units first so the same inventory is not promised as both sold and gifted.
    const giftStockByProduct = new Map<number, { tracked: boolean; remaining: number }>();
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

    const eligiblePromotionIds = new Set<number>();
    const stoppedBuyProducts = new Set<number>();
    for (const promo of activePromotions) {
        if (stoppedBuyProducts.has(promo.buy_product_id)) continue;
        if (promo.total_gift_limit !== null && promo.total_gifts_issued >= promo.total_gift_limit) continue;

        const giftStock = giftStockByProduct.get(promo.gift_product_id);
        if (!giftStock || giftStock.remaining <= 0) continue;

        const boughtQuantity = purchasedQuantityByProduct.get(promo.buy_product_id) ?? 0;
        let expectedGiftQuantity = Math.floor(boughtQuantity / promo.buy_quantity) * promo.gift_quantity;
        if (promo.max_gift_per_order !== null) {
            expectedGiftQuantity = Math.min(expectedGiftQuantity, promo.max_gift_per_order);
        }
        if (promo.total_gift_limit !== null) {
            expectedGiftQuantity = Math.min(expectedGiftQuantity, promo.total_gift_limit - promo.total_gifts_issued);
        }
        if (giftStock.tracked) expectedGiftQuantity = Math.min(expectedGiftQuantity, giftStock.remaining);
        if (expectedGiftQuantity <= 0) continue;

        if (giftStock.tracked) giftStock.remaining -= expectedGiftQuantity;
        eligiblePromotionIds.add(promo.id);
        if (promo.is_stackable === false) stoppedBuyProducts.add(promo.buy_product_id);
    }

    const blockedProductIds = new Set<number>();
    for (const promo of activePromotions) {
        if (eligiblePromotionIds.has(promo.id) && promo.is_stackable === false) {
            blockedProductIds.add(promo.buy_product_id);
        }
    }

    const sales: ActiveSale[] = await tx.sale.findMany({
        where: {
            status: true,
            start_date: { lte: new Date() },
            end_date: { gte: new Date() },
        },
        include: { product_sales: true, sale_categories: true },
    });

    const sizeMap = new Map<number, { id: number; stock: number }>();
    if (sizeIds.length > 0) {
        const sizes = await tx.productSize.findMany({ where: { id: { in: sizeIds } } });
        for (const size of sizes) sizeMap.set(size.id, size);
    }

    const stockDecrements = new Map<number, { quantity: number; productName: string }>();
    const giftQuantityByPromotion = new Map<number, number>();
    const promotionPriority = new Map(activePromotions.map((promotion, index) => [promotion.id, index]));
    // Always reserve purchased items first, then gifts in server-defined promotion priority.
    const orderedItems = [...items].sort((a, b) => {
        const aGift = a.is_gift === true;
        const bGift = b.is_gift === true;
        if (aGift !== bGift) return aGift ? 1 : -1;
        if (!aGift) return 0;
        return (promotionPriority.get(Number(a.promotion_id)) ?? Number.MAX_SAFE_INTEGER)
            - (promotionPriority.get(Number(b.promotion_id)) ?? Number.MAX_SAFE_INTEGER);
    });

    for (const item of orderedItems) {
        const productId = Number(item.product_id);
        const product = productMap.get(productId);
        if (!product) throw new OrderCreationError(400, 'Product not found');

        const isGift = item.is_gift === true;
        const hasSizes = product.colors.some(c => c.sizes.length > 0);
        if (hasSizes && !item.size_id && !isGift) {
            throw new OrderCreationError(400, `Please select a size for product "${product.name}"`);
        }

        const colorId = item.color_id == null ? null : Number(item.color_id);
        const sizeId = item.size_id == null ? null : Number(item.size_id);
        if (colorId !== null && !product.colors.some(color => color.id === colorId)) {
            throw new OrderCreationError(400, `Selected color does not belong to product "${product.name}".`);
        }
        if (sizeId !== null) {
            const selectedSize = product.colors
                .flatMap(color => color.sizes)
                .find(size => size.id === sizeId);
            if (!selectedSize) {
                throw new OrderCreationError(400, `Selected size does not belong to product "${product.name}".`);
            }
            if (colorId !== null && selectedSize.color_id !== colorId) {
                throw new OrderCreationError(400, `Selected size does not belong to the selected color for product "${product.name}".`);
            }
        }

        let giftPromotion: Pick<GiftPromotion, 'id' | 'gift_product_id'> | null = null;
        if (isGift) {
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
            const nextGiftQuantity = previousGiftQuantity + requestedGiftQuantity;
            if (nextGiftQuantity > allowedGiftQuantity) {
                throw new OrderCreationError(400, `Gift quantity exceeds the active promotion allowance for "${product.name}".`);
            }
            giftPromotion = promotion;
        }

        let finalItemPrice = 0;
        if (!isGift) {
            const applicableSales = sales
                .filter(s =>
                    s.apply_scope === 'all' ||
                    s.product_sales.some(ps => ps.product_id === product.id) ||
                    s.sale_categories.some(sc => sc.category_id === product.category_id)
                )
                .sort((a, b) => Number(b.discount_percent) - Number(a.discount_percent));

            const discount = applicableSales.length > 0 ? Number(applicableSales[0].discount_percent) : 0;
            // Keep the per-unit value identical to /products/prices and the cart.
            finalItemPrice = calculateDiscountedUnitPrice(product.price, discount);
            serverCalculatedTotal += finalItemPrice * Number(item.quantity);
        }

        if (isGift && giftPromotion && hasSizes) {
            const previousGiftQuantity = giftQuantityByPromotion.get(giftPromotion.id) ?? 0;
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

                sizeMap.set(variant.id, { id: variant.id, stock: variant.stock });
                stockDecrements.set(variant.id, {
                    quantity: alreadyReserved + quantity,
                    productName: stockDecrements.get(variant.id)?.productName || product.name,
                });
                itemsToSave.push({
                    product_id: productId,
                    color_id: variant.color_id,
                    size_id: variant.id,
                    quantity,
                    price: 0,
                    import_price_snapshot: Number(product.import_price ?? 0),
                    is_gift: true,
                    promotion_id: giftPromotion.id,
                });
                allocatedGiftQuantity += quantity;
                remainingGiftQuantity -= quantity;
            }
            if (remainingGiftQuantity > 0) {
                throw new OrderCreationError(409, `Gift stock changed while checking out for product "${product.name}". Please refresh your cart and try again.`);
            }
            giftQuantityByPromotion.set(giftPromotion.id, previousGiftQuantity + allocatedGiftQuantity);
        } else {
            if (sizeId !== null) {
                const prevDecrement = stockDecrements.get(sizeId);
                stockDecrements.set(sizeId, {
                    quantity: (prevDecrement?.quantity || 0) + Number(item.quantity),
                    productName: prevDecrement?.productName || product.name,
                });
            }

            itemsToSave.push({
                product_id: productId,
                color_id: colorId,
                size_id: sizeId,
                quantity: Number(item.quantity),
                price: finalItemPrice,
                import_price_snapshot: Number(product.import_price ?? 0),
                is_gift: isGift,
                promotion_id: giftPromotion ? giftPromotion.id : null,
            });
            if (isGift && giftPromotion) {
                const previousGiftQuantity = giftQuantityByPromotion.get(giftPromotion.id) ?? 0;
                giftQuantityByPromotion.set(giftPromotion.id, previousGiftQuantity + Number(item.quantity));
            }
        }
    }

    // Reserve the promotion's global gift limit with an optimistic compare-and-swap.
    // The update is in the order transaction, so duplicate/replayed checkouts cannot
    // exceed the configured limit or consume gift quota without creating an order.
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

    if (stockDecrements.size > 0) {
        for (const [sizeId, dec] of stockDecrements) {
            const size = sizeMap.get(sizeId);
            if (!size || size.stock < dec.quantity) {
                throw new OrderCreationError(409, `Insufficient stock for product "${dec.productName}" (size_id=${sizeId})`);
            }
        }

        for (const [sizeId, dec] of stockDecrements) {
            const affected = await tx.productSize.updateMany({
                where: { id: sizeId, stock: { gte: dec.quantity } },
                data: { stock: { decrement: dec.quantity } },
            });
            if (affected.count !== 1) {
                throw new OrderCreationError(409, 'Out of stock due to high traffic! Please refresh and try again.');
            }
        }
    }

    return { itemsToSave, serverCalculatedTotal, blockedProductIds };
}

export async function applyMembershipDiscount(
    tx: TxClient,
    userId: number | null,
    itemsToSave: OrderItemToSave[],
    blockedProductIds: Set<number>
): Promise<{ totalMembershipDiscount: number; userMembershipPercent: number }> {
    let totalMembershipDiscount = 0;
    let userMembershipPercent = 0;

    if (userId) {
        const user = await tx.user.findUnique({ where: { id: userId }, include: { membership: true } });
        if (user?.membership?.is_active && Number(user.membership.discount_percent) > 0) {
            userMembershipPercent = Number(user.membership.discount_percent);
            let discountableSubtotal = 0;
            for (const item of itemsToSave) {
                if (!item.is_gift && !blockedProductIds.has(Number(item.product_id))) {
                    discountableSubtotal += Number(item.price) * Number(item.quantity);
                }
            }
            totalMembershipDiscount = toVnd((discountableSubtotal * userMembershipPercent) / 100);
        }
    }

    return { totalMembershipDiscount, userMembershipPercent };
}

export class MinimumOrderValueError extends Error {
    readonly min_order_value: number;

    constructor(minOrderValue: number) {
        super('Minimum order value not met');
        this.name = 'MinimumOrderValueError';
        this.min_order_value = minOrderValue;
    }
}

export async function applyVoucherDiscount(
    tx: TxClient,
    voucher_id: number | string | null | undefined,
    itemsToSave: OrderItemToSave[],
    userMembershipPercent: number,
    blockedProductIds: Set<number>
): Promise<{ totalVoucherDiscount: number; eligibleProductIds: number[] }> {
    let totalVoucherDiscount = 0;
    let eligibleProductIds: number[] = [];

    if (!voucher_id) return { totalVoucherDiscount, eligibleProductIds };

    const voucher = await tx.voucher.findUnique({
        where: { id: Number(voucher_id) },
        include: { product_vouchers: true, voucher_categories: true },
    });

    if (!voucher || !voucher.status) throw new OrderCreationError(400, 'Voucher does not exist or has been disabled.');
    if (voucher.usage_limit !== null && voucher.usage_limit <= 0) throw new OrderCreationError(409, 'Voucher usage limit reached.');
    if (voucher.start_date && new Date() < voucher.start_date) throw new OrderCreationError(400, 'Voucher is not active yet.');
    if (voucher.end_date && new Date() > voucher.end_date) throw new OrderCreationError(400, 'Voucher has expired.');

    const nonGiftItems = itemsToSave.filter(i => !i.is_gift);
    const goodsSubtotal = nonGiftItems.reduce((sum, i) => sum + Number(i.price) * Number(i.quantity), 0);
    if (goodsSubtotal < Number(voucher.min_order_value)) {
        throw new MinimumOrderValueError(Number(voucher.min_order_value));
    }

    let eligibleTotal = 0;
    const membershipRate = userMembershipPercent > 0 ? userMembershipPercent / 100 : 0;
    const priceAfterMembership = (gross: number) => gross * (1 - membershipRate);
    const eligibleNonGiftItems = nonGiftItems.filter(i => !blockedProductIds.has(Number(i.product_id)));

    if (voucher.apply_scope === 'all') {
        eligibleTotal = eligibleNonGiftItems.reduce((sum, i) => sum + priceAfterMembership(i.price * i.quantity), 0);
        eligibleProductIds = eligibleNonGiftItems.map(i => i.product_id);
    } else if (voucher.apply_scope === 'product') {
        const allowedIds = voucher.product_vouchers.map(pv => pv.product_id);
        const eligible = eligibleNonGiftItems.filter(i => allowedIds.includes(i.product_id));
        eligibleProductIds = eligible.map(i => i.product_id);
        eligibleTotal = eligible.reduce((sum, i) => sum + priceAfterMembership(i.price * i.quantity), 0);
    } else if (voucher.apply_scope === 'category') {
        const allowedCatIds = voucher.voucher_categories.map(vc => vc.category_id);
        const products = await tx.product.findMany({
            where: { id: { in: eligibleNonGiftItems.map(i => i.product_id) } },
            select: { id: true, category_id: true },
        });
        eligibleProductIds = products.filter(p => allowedCatIds.includes(p.category_id)).map(p => p.id);
        eligibleTotal = eligibleNonGiftItems
            .filter(i => eligibleProductIds.includes(i.product_id))
            .reduce((sum, i) => sum + priceAfterMembership(i.price * i.quantity), 0);
    }

    eligibleTotal = toVnd(eligibleTotal);
    if (eligibleTotal <= 0) throw new OrderCreationError(400, 'Voucher is not applicable to any products in this order.');

    totalVoucherDiscount = toVnd((eligibleTotal * Number(voucher.discount_percent || 0)) / 100);
    if (voucher.max_discount_amount !== null && voucher.max_discount_amount !== undefined) {
        totalVoucherDiscount = Math.min(totalVoucherDiscount, toVnd(voucher.max_discount_amount));
    }
    totalVoucherDiscount = Math.min(totalVoucherDiscount, toVnd(eligibleTotal));

    if (voucher.usage_limit !== null) {
        const voucherUpdateResult = await tx.voucher.updateMany({
            where: { id: Number(voucher_id), usage_limit: { gte: 1 } },
            data: { usage_limit: { decrement: 1 }, used_count: { increment: 1 } },
        });
        if (voucherUpdateResult.count === 0) throw new OrderCreationError(409, 'Voucher was just fully consumed by other users.');
    } else {
        await tx.voucher.update({
            where: { id: Number(voucher_id) },
            data: { used_count: { increment: 1 } },
        });
    }

    return { totalVoucherDiscount, eligibleProductIds };
}
