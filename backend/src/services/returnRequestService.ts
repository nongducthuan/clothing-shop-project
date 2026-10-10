import type { BuyXGetYPromotion, Order, OrderItem } from '../generated/prisma/client';

export type ReturnOrderItem = Pick<OrderItem, 'id' | 'product_id' | 'quantity' | 'price' | 'payable_amount' | 'is_gift'> & {
    promotion?: Pick<BuyXGetYPromotion, 'buy_product_id'> | null;
};

export type ReturnOrder = Pick<Order, 'total_price' | 'shipping_fee'> & {
    items: ReturnOrderItem[];
};

export type RequestedReturnItem = { order_item_id: number; return_quantity: number };

export type ParsedBankInfo = { name: string; acc: string; owner: string };

type BankRecord = Record<string, unknown>;

const toBankRecord = (value: unknown): BankRecord | null =>
    typeof value === 'object' && value !== null ? value as BankRecord : null;

const stringValue = (value: unknown, fallback: string): string =>
    value == null || value === '' ? fallback : String(value);

export const parseBankInfo = (rawBank: unknown): ParsedBankInfo | null => {
    if (!rawBank) return null;
    const parsed: unknown = typeof rawBank === 'string' ? JSON.parse(rawBank) as unknown : rawBank;
    const bankData = toBankRecord(parsed);
    if (!bankData) return null;

    return {
        name: stringValue(bankData.name ?? bankData.bankName, 'N/A'),
        acc: stringValue(bankData.acc ?? bankData.bankNumber, 'N/A'),
        owner: stringValue(bankData.owner ?? bankData.accountHolder, 'N/A'),
    };
};

/**
 * Kiểm tra các sản phẩm khách chọn trả và tính tiền hoàn (pro-rata, làm tròn VNĐ).
 * Ném Error với đúng thông điệp cũ khi dữ liệu không hợp lệ. Không đụng DB.
 */
export function buildReturnPlan(order: ReturnOrder, requestedItems: RequestedReturnItem[]) {
    let parsedReturnItems = requestedItems;
    const orderItemMap = new Map(order.items.map(i => [i.id, i]));

    const giftItems = order.items.filter(i => i.is_gift);
    const promoBuyProductIds = new Set<number>(
        giftItems
            .map(gift => gift.promotion?.buy_product_id)
            .filter((id): id is number => typeof id === 'number')
    );
    const isPromotionBuyItem = (orderItem: ReturnOrderItem) => promoBuyProductIds.has(orderItem.product_id);

    if (parsedReturnItems.length === 0) {
        parsedReturnItems = order.items
            .filter(i => !i.is_gift)
            .map(i => ({ order_item_id: i.id, return_quantity: i.quantity }));
    }

    if (parsedReturnItems.length === 0) throw new Error('No items selected for return.');

    const seenOrderItemIds = new Set<number>();
    for (const ri of parsedReturnItems) {
        if (!Number.isSafeInteger(ri.order_item_id) || !Number.isSafeInteger(ri.return_quantity)) {
            throw new Error('Return item IDs and quantities must be whole numbers.');
        }
        if (seenOrderItemIds.has(ri.order_item_id)) {
            throw new Error(`Item ID ${ri.order_item_id} appears more than once in the return request.`);
        }
        seenOrderItemIds.add(ri.order_item_id);

        const orderItem = orderItemMap.get(ri.order_item_id);
        if (!orderItem) throw new Error(`Item ID ${ri.order_item_id} does not belong to this order.`);
        if (orderItem.is_gift) {
            throw new Error(`Gift items cannot be returned independently. Please include the associated purchased item.`);
        }
        if (ri.return_quantity <= 0 || ri.return_quantity > orderItem.quantity) {
            throw new Error(`Invalid return quantity for item ID ${ri.order_item_id}. Must be between 1 and ${orderItem.quantity}.`);
        }
        if (isPromotionBuyItem(orderItem) && ri.return_quantity !== orderItem.quantity) {
            throw new Error(`Item ID ${ri.order_item_id} must be returned in full quantity (${orderItem.quantity}) because it is part of a Buy X Get Y promotion.`);
        }
    }

    const returnItemsToCreate: { order_item_id: number; return_quantity: number; refund_amount: number }[] = [];
    const nonGiftReturnItems: { targetIndex: number; rawRefund: number }[] = [];

    for (const ri of parsedReturnItems) {
        const orderItem = orderItemMap.get(ri.order_item_id)!;
        let itemRefund = 0;

        if (!orderItem.is_gift) {
            if (orderItem.payable_amount !== null && orderItem.payable_amount !== undefined) {
                const unitPayable = Number(orderItem.payable_amount) / orderItem.quantity;
                itemRefund = unitPayable * ri.return_quantity;
            } else {
                itemRefund = Number(orderItem.price) * ri.return_quantity;
            }
            nonGiftReturnItems.push({ targetIndex: returnItemsToCreate.length, rawRefund: itemRefund });
        }

        returnItemsToCreate.push({ order_item_id: ri.order_item_id, return_quantity: ri.return_quantity, refund_amount: 0 });
    }

    const allPurchasableItems = order.items.filter(it => !it.is_gift);
    const isFullReturn = allPurchasableItems.length === nonGiftReturnItems.length &&
        allPurchasableItems.every(it => {
            const found = parsedReturnItems.find(p => p.order_item_id === it.id);
            return found !== undefined && found.return_quantity === it.quantity;
        });

    let targetTotalRefund = 0;
    if (isFullReturn && order.total_price != null && !isNaN(Number(order.total_price))) {
        targetTotalRefund = Math.max(0, Math.round(Number(order.total_price) - Number(order.shipping_fee || 0)));
    } else {
        targetTotalRefund = Math.round(nonGiftReturnItems.reduce((sum, it) => sum + it.rawRefund, 0));
    }

    let allocatedSum = 0;
    nonGiftReturnItems.forEach(item => {
        const roundedRefund = Math.round(item.rawRefund);
        returnItemsToCreate[item.targetIndex].refund_amount = roundedRefund;
        allocatedSum += roundedRefund;
    });

    const refundDiff = targetTotalRefund - allocatedSum;
    if (refundDiff !== 0 && nonGiftReturnItems.length > 0) {
        let maxItem = nonGiftReturnItems[0];
        for (let i = 1; i < nonGiftReturnItems.length; i++) {
            if (nonGiftReturnItems[i].rawRefund > maxItem.rawRefund) maxItem = nonGiftReturnItems[i];
        }
        returnItemsToCreate[maxItem.targetIndex].refund_amount += refundDiff;
    }

    const returnedProductIds = new Set<number>();
    for (const ri of parsedReturnItems) {
        const returnedItem = orderItemMap.get(ri.order_item_id);
        if (returnedItem && !returnedItem.is_gift) returnedProductIds.add(returnedItem.product_id);
    }

    for (const giftItem of giftItems) {
        const buyProductId = giftItem.promotion?.buy_product_id;
        if (!buyProductId || !returnedProductIds.has(buyProductId)) continue;
        if (!returnItemsToCreate.some(r => r.order_item_id === giftItem.id)) {
            returnItemsToCreate.push({ order_item_id: giftItem.id, return_quantity: giftItem.quantity, refund_amount: 0 });
        }
    }

    return { returnItemsToCreate, totalRefundAmount: targetTotalRefund };
}
