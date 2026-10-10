import { getPromotionBuyProductIds, isPromotionBuyItem, getAutoReturnedGiftItems } from "./promotionUtils";
import type { ReturnableOrderItem } from "./promotionUtils";
import { balanceReturnItemsRefund } from "./orderUtils";

export type ReturnItemVal = { selected: boolean; return_quantity: number | string };

export type ReturnLineItem = { order_item_id: number; return_quantity: number };

export interface ReturnOrderItem {
  id: number;
  product_id?: number;
  is_gift?: boolean;
  quantity?: number;
  product_name?: string;
  product_name_vi?: string;
  product_name_en?: string;
  color_name?: string;
  color_name_vi?: string;
  color_name_en?: string;
  color?: string;
  size?: string;
  payable_amount?: number | string | null;
  price?: number;
  [key: string]: unknown;
}

export interface OptimisticReturnItem {
  order_item_id: number;
  return_quantity: number;
  refund_amount: number;
  product_name?: string | null;
  product_name_vi?: string | null;
  product_name_en?: string | null;
  color_name?: string | null;
  color_name_vi?: string | null;
  color_name_en?: string | null;
  size?: string | null;
  is_gift: boolean;
}

/**
 * Dựng danh sách sản phẩm trả từ các dòng khách đã tick.
 * Chỉ sản phẩm X của Buy X Get Y mới bắt buộc hoàn trả toàn bộ số lượng.
 */
export function buildReturnItems(
  selectedItems: Record<string | number, ReturnItemVal> | null | undefined,
  orderItems: ReturnableOrderItem[] | null | undefined
): ReturnLineItem[] {
  const buyProductIds = getPromotionBuyProductIds(orderItems);
  const returnItems: ReturnLineItem[] = [];
  if (selectedItems) {
    Object.entries(selectedItems).forEach(([itemIdStr, val]: [string, ReturnItemVal]) => {
      if (val.selected) {
        const itemInOrder = (orderItems || []).find((i) => i.id === Number(itemIdStr));
        const qty = isPromotionBuyItem(itemInOrder, buyProductIds)
          ? (itemInOrder?.quantity || Number(val.return_quantity) || 1)
          : (Number(val.return_quantity) || 1);
        if (qty > 0) {
          returnItems.push({
            order_item_id: Number(itemIdStr),
            return_quantity: qty
          });
        }
      }
    });
  }
  return returnItems;
}

/**
 * Dựng FormData gửi lên POST /orders/:id/return.
 * `bankFieldName` giữ nguyên tên field mà mỗi màn hình đang gửi (backend nhận cả hai).
 */
export function buildReturnFormData(params: {
  reasonCode: string;
  description: string;
  email: string;
  returnItems: ReturnLineItem[];
  bankInfo: { name: string; acc: string; owner: string };
  bankFieldName: "refund_bank_info" | "bankInfo";
  images?: File[];
}): FormData {
  const formData = new FormData();
  formData.append("reason_code", params.reasonCode);
  formData.append("description", params.description);
  formData.append("email", params.email);
  formData.append(params.bankFieldName, JSON.stringify(params.bankInfo));
  formData.append("returnItems", JSON.stringify(params.returnItems));
  if (params.images && params.images.length > 0) {
    params.images.forEach((file) => {
      formData.append("images", file);
    });
  }
  return formData;
}

/**
 * Dựng return_request "lạc quan" để UI hiện ngay box thông tin đổi trả sau khi gửi,
 * không phải chờ tải lại danh sách. Mirror luật tính tiền hoàn của backend.
 */
export function buildOptimisticReturnRequest(
  order: { items?: ReturnOrderItem[]; total_price?: unknown; shipping_fee?: unknown },
  returnItems: ReturnLineItem[],
  reasonCode: string,
  description: string
) {
  const orderItems = order?.items || [];
  const nonGiftItemsWithRaw: { item: ReturnOrderItem; return_quantity: number; rawRefund: number }[] = [];

  returnItems.forEach((ri: ReturnLineItem) => {
    const orderItem = (orderItems as ReturnOrderItem[]).find((i) => i.id === Number(ri.order_item_id));
    if (!orderItem || orderItem.is_gift) return;
    const qty = Number(orderItem.quantity) || 1;
    const unitPayable = orderItem.payable_amount !== null && orderItem.payable_amount !== undefined && orderItem.payable_amount !== ''
      ? (Number(orderItem.payable_amount) || 0) / qty
      : (Number(orderItem.price) || 0);
    const rawRefund = unitPayable * Number(ri.return_quantity);
    nonGiftItemsWithRaw.push({ item: orderItem, return_quantity: ri.return_quantity, rawRefund });
  });

  const allPurchasable = (orderItems as ReturnOrderItem[]).filter(i => !i.is_gift);
  const isFull = allPurchasable.length === nonGiftItemsWithRaw.length &&
    allPurchasable.every(it => {
      const f = nonGiftItemsWithRaw.find(n => n.item.id === it.id);
      return f && f.return_quantity === it.quantity;
    });

  let targetRefund = 0;
  if (isFull && order.total_price != null && !isNaN(Number(order.total_price))) {
    targetRefund = Math.max(0, Math.round(Number(order.total_price) - Number(order.shipping_fee || 0)));
  } else {
    targetRefund = Math.round(nonGiftItemsWithRaw.reduce((sum, it) => sum + it.rawRefund, 0));
  }

  const optimisticRawItems: OptimisticReturnItem[] = nonGiftItemsWithRaw.map(({ item, return_quantity, rawRefund }) => ({
    order_item_id: item.id,
    return_quantity,
    refund_amount: Math.round(rawRefund),
    product_name: item.product_name ?? null,
    product_name_vi: item.product_name_vi ?? null,
    product_name_en: item.product_name_en ?? null,
    color_name: item.color_name ?? item.color ?? null,
    color_name_vi: item.color_name_vi ?? null,
    color_name_en: item.color_name_en ?? null,
    size: item.size ?? null,
    is_gift: false,
  }));

  // Quà tặng (Y) không thể trả độc lập: backend tự gom quà khi sản phẩm X tương ứng được trả.
  // Mirror luật này để box "Thông tin yêu cầu đổi trả" hiện đúng quà tặng ngay sau khi gửi.
  const returnedProductIds = new Set<number>(
    nonGiftItemsWithRaw
      .map(({ item }) => Number(item.product_id))
      .filter((id) => !Number.isNaN(id))
  );
  const autoReturnedGifts = getAutoReturnedGiftItems(orderItems as ReturnOrderItem[], returnedProductIds);
  const optimisticGiftItems: OptimisticReturnItem[] = autoReturnedGifts.map((gift) => ({
    order_item_id: Number(gift.id),
    return_quantity: Number(gift.quantity) || 1,
    refund_amount: 0,
    product_name: gift.product_name ?? null,
    product_name_vi: gift.product_name_vi ?? null,
    product_name_en: gift.product_name_en ?? null,
    color_name: (gift.color_name as string | undefined) ?? null,
    color_name_vi: (gift.color_name_vi as string | undefined) ?? null,
    color_name_en: (gift.color_name_en as string | undefined) ?? null,
    size: (gift.size as string | undefined) ?? null,
    is_gift: true,
  }));

  const items = balanceReturnItemsRefund([...optimisticRawItems, ...optimisticGiftItems], targetRefund);

  return {
    id: 'pending',
    status: 'Pending',
    reason_code: reasonCode,
    description,
    admin_response: null,
    refund_amount: targetRefund,
    items,
  };
}
