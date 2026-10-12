import { Request, Response } from 'express';
import prisma from '../../../prisma/client';

type CartItem = {
    product_id: number | string;
    quantity: number | string;
    block_other_discounts?: boolean;
};

type GiftVariant = {
    size_id: number;
    color_id: number;
    color: string;
    size: string;
    stock: number;
    image: string | null;
};

type ProductVariant = {
    size_id: number;
    color_id: number;
    color_name: string;
    size: string;
    stock: number;
    image_url: string | null;
};

type GiftItem = {
    promotion_id: number;
    gift_product_id: number;
    expected_quantity: number;
    actual_quantity: number;
    is_partial_gift: boolean;
    status: 'PARTIAL' | 'FULL';
    is_stackable: boolean;
    variants: GiftVariant[];
    message: string;
};

const isCartItem = (value: unknown): value is CartItem => {
    if (typeof value !== 'object' || value === null) return false;
    const item = value as Record<string, unknown>;
    const productId = item.product_id;
    const quantity = item.quantity;
    const parsedProductId = Number(productId);
    const parsedQuantity = Number(quantity);
    return (typeof productId === 'number' || typeof productId === 'string') &&
        (typeof quantity === 'number' || typeof quantity === 'string') &&
        Number.isInteger(parsedProductId) && parsedProductId > 0 &&
        Number.isInteger(parsedQuantity) && parsedQuantity > 0;
};

export const getActivePromotions = async (req: Request, res: Response): Promise<void> => {
    try {
        const promotions = await prisma.buyXGetYPromotion.findMany({
            where: {
                is_active: true,
                status: 'active',
                start_date: { lte: new Date() },
                end_date: { gte: new Date() },
                OR: [
                    { total_gift_limit: null },
                    {
                        total_gift_limit: { gt: 0 }, // fallback logic since prisma doesn't allow field comparisons in where directly
                        // We filter in memory for total_gifts_issued < total_gift_limit
                    }
                ]
            },
            orderBy: [{ priority: 'desc' }, { id: 'asc' }]
        });

        const activePromos = promotions.filter(p =>
            p.total_gift_limit === null || p.total_gifts_issued < p.total_gift_limit
        );

        res.status(200).json({ success: true, data: activePromos });
    } catch (error) {
        console.error('Error fetching active promotions:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

export const calculateCart = async (req: Request, res: Response): Promise<void> => {
    try {
        const rawCartItems: unknown = req.body.cartItems;
        const cartItems: CartItem[] = Array.isArray(rawCartItems) ? rawCartItems.filter(isCartItem) : [];

        if (cartItems.length === 0) {
            res.status(400).json({ success: false, message: 'Empty Cart' });
            return;
        }

        const promotions = await prisma.buyXGetYPromotion.findMany({
            where: {
                is_active: true,
                status: 'active',
                start_date: { lte: new Date() },
                end_date: { gte: new Date() }
            },
            orderBy: [{ priority: 'desc' }, { id: 'asc' }]
        });

        const activePromos = promotions.filter(p =>
            p.total_gift_limit === null || p.total_gifts_issued < p.total_gift_limit
        );

        const giftItems: GiftItem[] = [];
        const inventoryByProduct = new Map<number, {
            variants: ProductVariant[];
            tracked: boolean;
            remaining: number;
        }>();
        const quantityByProduct = new Map<number, number>();
        for (const item of cartItems) {
            const productId = Number(item.product_id);
            const quantity = Number(item.quantity);
            if (Number.isInteger(productId) && productId > 0 && Number.isFinite(quantity) && quantity > 0) {
                quantityByProduct.set(productId, (quantityByProduct.get(productId) ?? 0) + quantity);
            }
        }

        const stoppedBuyProducts = new Set<number>();
        // Use one global priority order so the same shared SKU is not promised in
        // a different order depending on how products happen to appear in the cart.
        for (const promo of activePromos) {
            if (stoppedBuyProducts.has(promo.buy_product_id)) continue;
            const productQuantity = quantityByProduct.get(promo.buy_product_id) ?? 0;
            let expectedGiftQty = Math.floor(productQuantity / promo.buy_quantity) * promo.gift_quantity;
            if (expectedGiftQty <= 0) continue;

            if (promo.max_gift_per_order !== null) {
                expectedGiftQty = Math.min(expectedGiftQty, promo.max_gift_per_order);
            }
            if (promo.total_gift_limit !== null) {
                const remainingLimit = Math.max(0, promo.total_gift_limit - promo.total_gifts_issued);
                expectedGiftQty = Math.min(expectedGiftQty, remainingLimit);
            }
            if (expectedGiftQty <= 0) continue;

            let inventory = inventoryByProduct.get(promo.gift_product_id);
            if (!inventory) {
                const productColors = await prisma.productColor.findMany({
                    where: { product_id: promo.gift_product_id },
                    include: { sizes: true },
                });
                const allSizes = productColors.flatMap(color => color.sizes);
                const variants: ProductVariant[] = productColors.flatMap(color =>
                    color.sizes
                        .filter(size => Number(size.stock) > 0)
                        .map(size => ({
                            size_id: size.id,
                            color_id: color.id,
                            color_name: color.color_name,
                            size: size.size,
                            stock: Number(size.stock),
                            image_url: color.image_url,
                        }))
                );
                const tracked = allSizes.length > 0;
                const totalStock = variants.reduce((sum, variant) => sum + variant.stock, 0);
                const alreadyInCart = quantityByProduct.get(promo.gift_product_id) ?? 0;
                inventory = {
                    variants,
                    tracked,
                    remaining: tracked ? Math.max(0, totalStock - alreadyInCart) : Number.POSITIVE_INFINITY,
                };
                inventoryByProduct.set(promo.gift_product_id, inventory);
            }

            if (inventory.tracked && inventory.remaining <= 0) continue;
            const actualGiftQty = inventory.tracked
                ? Math.min(expectedGiftQty, inventory.remaining)
                : expectedGiftQty;
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
                variants: inventory.variants.map(variant => ({
                    size_id: variant.size_id,
                    color_id: variant.color_id,
                    color: variant.color_name,
                    size: variant.size,
                    stock: variant.stock,
                    image: variant.image_url,
                })),
                message: isPartialGift
                    ? `Only ${actualGiftQty} free item(s) available. Please choose color and size.`
                    : inventory.variants.length > 0
                        ? `You received ${actualGiftQty} free item(s). Please choose color and size.`
                        : `You received ${actualGiftQty} free item(s).`,
            });

            if (!promo.is_stackable) {
                cartItems
                    .filter(cartItem => Number(cartItem.product_id) === promo.buy_product_id)
                    .forEach(cartItem => { cartItem.block_other_discounts = true; });
                stoppedBuyProducts.add(promo.buy_product_id);
            }
        }

        res.status(200).json({
            success: true,
            data: { cartItems, giftItems }
        });
    } catch (error) {
        console.error('Error in calculateCart controller:', error);
        res.status(500).json({ success: false, message: 'Server error when calculating promotion.' });
    }
};
