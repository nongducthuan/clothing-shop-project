import { Request, Response } from 'express';
import prisma from '../../../prisma/client';

export const getActivePromotions = async (req: Request, res: Response): Promise<void> => {
    try {
        const promotions = await prisma.buyXGetYPromotion.findMany({
            where: {
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
            orderBy: { priority: 'desc' }
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
        const { cartItems } = req.body;

        if (!cartItems || cartItems.length === 0) {
            res.status(400).json({ success: false, message: 'Empty Cart' });
            return;
        }

        const promotions = await prisma.buyXGetYPromotion.findMany({
            where: {
                status: 'active',
                start_date: { lte: new Date() },
                end_date: { gte: new Date() }
            },
            orderBy: { priority: 'desc' }
        });

        const activePromos = promotions.filter(p => 
            p.total_gift_limit === null || p.total_gifts_issued < p.total_gift_limit
        );

        let giftItems: any[] = [];
        const variantMap: Record<number, any[]> = {};

        for (const item of cartItems) {
            const matchedPromos = activePromos.filter(p => p.buy_product_id === Number(item.product_id));
            if (matchedPromos.length === 0) continue;

            for (const promo of matchedPromos) {
                let expectedGiftQty = Math.floor(Number(item.quantity) / promo.buy_quantity) * promo.gift_quantity;
                if (expectedGiftQty <= 0) continue;

                if (promo.max_gift_per_order !== null) {
                    expectedGiftQty = Math.min(expectedGiftQty, promo.max_gift_per_order);
                }

                if (promo.total_gift_limit !== null) {
                    const remaining = Math.max(0, promo.total_gift_limit - promo.total_gifts_issued);
                    expectedGiftQty = Math.min(expectedGiftQty, remaining);
                }

                if (!variantMap[promo.gift_product_id]) {
                    const variants = await prisma.productColor.findMany({
                        where: { product_id: promo.gift_product_id },
                        include: { sizes: true }
                    });
                    const flattenedVariants: any[] = [];
                    for (const pc of variants) {
                        for (const ps of pc.sizes) {
                            if (ps.stock > 0) {
                                flattenedVariants.push({
                                    size_id: ps.id,
                                    color_id: pc.id,
                                    color_name: pc.color_name,
                                    size: ps.size,
                                    stock: ps.stock,
                                    image_url: pc.image_url
                                });
                            }
                        }
                    }
                    variantMap[promo.gift_product_id] = flattenedVariants;
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
                    status: isPartialGift ? "PARTIAL" : "FULL",
                    is_stackable: promo.is_stackable,
                    variants: variants.map(v => ({
                        size_id: v.size_id,
                        color_id: v.color_id,
                        color: v.color_name,
                        size: v.size,
                        stock: v.stock,
                        image: v.image_url
                    })),
                    message: isPartialGift
                        ? `Only ${actualGiftQty} free item(s) available. Please choose color and size.`
                        : `You received ${actualGiftQty} free item(s). Please choose color and size.`
                });

                if (!promo.is_stackable) {
                    item.block_other_discounts = true;
                    break;
                }
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
