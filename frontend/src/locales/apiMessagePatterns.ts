/**
 * Bản dịch cho các message ĐỘNG từ backend (có nội suy tên sản phẩm, mã đơn, số lượng...).
 * Lý do: `t()` chỉ tra key CHÍNH XÁC, nên message có tham số (VD `Please select a size
 * for product "Áo thun"`) cần tầng regex → template bên dưới.
 * Quy ước: `key` trỏ tới entry trong translations, placeholder dạng {name}.
 * Không khớp pattern nào → caller giữ nguyên message gốc.
 */
export interface ApiMessagePattern {
  /** Regex khớp message (tiếng Anh) do backend trả về */
  pattern: RegExp;
  /** Key template trong translations (thường là 'api_msg.pattern.*') */
  key: string;
  /** Trích placeholder từ kết quả match */
  params: (match: RegExpMatchArray) => Record<string, string>;
}

export const API_MESSAGE_PATTERNS: ApiMessagePattern[] = [
  {
    pattern: /^Invalid OTP code! (\d+) attempt\(s\) remaining\.$/,
    key: 'api_msg.pattern.invalid_otp',
    params: (m) => ({ remaining: m[1] }),
  },
  {
    pattern: /^Please select a size for product "(.+)"$/,
    key: 'api_msg.pattern.select_size',
    params: (m) => ({ product: m[1] }),
  },
  {
    pattern: /^Out of stock for product "(.+)" due to high traffic!$/,
    key: 'api_msg.pattern.out_of_stock_high_traffic',
    params: (m) => ({ product: m[1] }),
  },
  {
    pattern: /^Insufficient stock for product "(.+)" \(size_id=(\d+)\)$/,
    key: 'api_msg.pattern.insufficient_stock',
    params: (m) => ({ product: m[1], sizeId: m[2] }),
  },
  {
    pattern: /^Insufficient stock for product \(size_id=(\d+)\)$/,
    key: 'api_msg.pattern.insufficient_stock_admin',
    params: (m) => ({ sizeId: m[1] }),
  },
  {
    pattern: /^Gift item with size_id (\d+) is out of stock\.$/,
    key: 'api_msg.pattern.gift_out_of_stock',
    params: (m) => ({ sizeId: m[1] }),
  },
  {
    pattern: /^Promotion ID (\d+) has reached its gift limit or does not exist\.$/,
    key: 'api_msg.pattern.promotion_gift_limit',
    params: (m) => ({ promotionId: m[1] }),
  },
  {
    pattern: /^Order #(\d+) not found\.$/,
    key: 'api_msg.pattern.order_not_found',
    params: (m) => ({ orderId: m[1] }),
  },
  {
    pattern: /^Cannot cancel an order that is already "(.+)"\.$/,
    key: 'api_msg.pattern.cannot_cancel_order',
    params: (m) => ({ status: m[1] }),
  },
  {
    pattern: /^Item ID (\d+) does not belong to this order\.$/,
    key: 'api_msg.pattern.return_item_not_in_order',
    params: (m) => ({ itemId: m[1] }),
  },
  {
    pattern: /^Invalid return quantity for item ID (\d+)\. Must be between 1 and (\d+)\.$/,
    key: 'api_msg.pattern.return_qty_invalid',
    params: (m) => ({ itemId: m[1], max: m[2] }),
  },
  {
    pattern:
      /^Item ID (\d+) must be returned in full quantity \((\d+)\) because it is part of a Buy X Get Y promotion\.$/,
    key: 'api_msg.pattern.return_full_qty_promo',
    params: (m) => ({ itemId: m[1], quantity: m[2] }),
  },
  {
    pattern: /^Gift item "(.+)" is missing promotion reference\.$/,
    key: 'api_msg.pattern.gift_missing_promo',
    params: (m) => ({ product: m[1] }),
  },
  {
    pattern: /^Buy X Get Y promotion is invalid for gift item "(.+)"\.$/,
    key: 'api_msg.pattern.gift_promo_invalid',
    params: (m) => ({ product: m[1] }),
  },
  {
    pattern: /^Order #(\d+) is not in Return Requested status \(current status: '(.+)'\)\.$/,
    key: 'api_msg.pattern.order_not_return_requested',
    params: (m) => ({ orderId: m[1], status: m[2] }),
  },
  {
    pattern: /^Invalid shipping fee: must be between 0 and (\d+)\.$/,
    key: 'api_msg.pattern.invalid_shipping_fee',
    params: (m) => ({ max: m[1] }),
  },
  {
    pattern: /^Only a Return Approved order can be un-approved \(current: "(.+)"\)\.$/,
    key: 'api_msg.pattern.only_return_approved',
    params: (m) => ({ status: m[1] }),
  },
  {
    pattern: /^Invalid payment transition: (.+) -> (.+)\.$/,
    key: 'api_msg.pattern.invalid_payment_transition',
    params: (m) => ({ from: m[1], to: m[2] }),
  },
  {
    pattern: /^Invalid status transition: cannot move order #(\d+) from "(.+)" back to "(.+)"$/,
    key: 'api_msg.pattern.invalid_status_transition',
    params: (m) => ({ orderId: m[1], from: m[2], to: m[3] }),
  },
  {
    pattern: /^Payment status updated to (.+)$/,
    key: 'api_msg.pattern.payment_status_updated',
    params: (m) => ({ status: m[1] }),
  },
];

/**
 * Dịch message động: trả về chuỗi đã nội suy nếu khớp pattern VÀ đã có bản dịch;
 * ngược lại trả `null` để caller giữ nguyên message gốc.
 */
export function matchApiMessagePattern(
  msg: string,
  translate: (key: string, fallback?: string) => string
): string | null {
  for (const p of API_MESSAGE_PATTERNS) {
    const match = msg.match(p.pattern);
    if (!match) continue;

    const template = translate(p.key, msg);
    // Chưa có bản dịch → t() trả lại fallback (chính là msg) → giữ nguyên
    if (template === msg) return null;

    const values = p.params(match);
    return template.replace(/\{(\w+)\}/g, (_, name: string) => values[name] ?? '');
  }
  return null;
}
