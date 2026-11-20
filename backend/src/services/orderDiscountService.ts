import type { OrderItemToSave, TxClient } from '../types/orderTypes';
import { toVnd } from '../utils/pricing';
import { MinimumOrderValueError, OrderCreationError } from './orderCreationErrors';

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
