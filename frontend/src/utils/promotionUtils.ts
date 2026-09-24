/**
 * Helper dùng chung cho nghiệp vụ Buy X Get Y (Mua X tặng Y) ở phía Return/Đổi trả.
 *
 * Quy tắc nghiệp vụ:
 * - Chỉ sản phẩm X (chính là `buy_product_id` của promotion đã tặng quà) mới bị ràng buộc
 *   "hoàn trả toàn bộ số lượng" và mới kéo theo quà Y.
 * - Các sản phẩm khác trong cùng đơn hoàn trả 1 phần bình thường.
 */

export interface OrderItemPromotionInfo {
  id?: number;
  buy_product_id?: number;
  gift_product_id?: number;
  buy_quantity?: number;
  gift_quantity?: number;
}

export interface ReturnableOrderItem {
  id?: number;
  product_id?: number;
  is_gift?: boolean;
  quantity?: number;
  promotion?: OrderItemPromotionInfo | null;
  product_name?: string;
  product_name_vi?: string;
  product_name_en?: string;
  [key: string]: unknown;
}

/**
 * Tập `product_id` của các sản phẩm X (sản phẩm mua để nhận quà Y) trong đơn hàng.
 * Quà tặng luôn được gắn `promotion` từ khâu tạo đơn nên luôn xác định được X.
 */
export function getPromotionBuyProductIds(items: ReturnableOrderItem[] | null | undefined): Set<number> {
  const ids = new Set<number>();
  (items || []).forEach(item => {
    if (item?.is_gift && item.promotion?.buy_product_id) {
      ids.add(Number(item.promotion.buy_product_id));
    }
  });
  return ids;
}

/**
 * Sản phẩm này có phải là X của một Buy X Get Y trong đơn không?
 * Nếu đúng ⇒ không cho đổi số lượng hoàn trả (luôn hoàn toàn bộ) và sẽ kéo theo quà Y.
 */
export function isPromotionBuyItem(
  item: ReturnableOrderItem | null | undefined,
  buyProductIds: Set<number>
): boolean {
  if (!item || item.is_gift) return false;
  return buyProductIds.has(Number(item.product_id));
}

/** Danh sách order item của sản phẩm X gắn với quà tặng này */
export function getLinkedBuyItems(
  gift: ReturnableOrderItem | null | undefined,
  items: ReturnableOrderItem[] | null | undefined
): ReturnableOrderItem[] {
  const buyProductId = gift?.promotion?.buy_product_id;
  if (!buyProductId) return [];
  return (items || []).filter(item => !item.is_gift && Number(item.product_id) === Number(buyProductId));
}

/** Quà tặng này có được hoàn trả kèm theo lựa chọn hiện tại của khách không? */
export function isGiftAutoReturned(
  gift: ReturnableOrderItem | null | undefined,
  items: ReturnableOrderItem[] | null | undefined,
  isItemSelected: (item: ReturnableOrderItem) => boolean
): boolean {
  return getLinkedBuyItems(gift, items).some(item => isItemSelected(item));
}
