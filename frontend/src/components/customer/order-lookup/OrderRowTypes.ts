import type { ReturnOrderItem } from "../../../utils/returnRequestUtils";

export type OrderLookupItem = ReturnOrderItem;

export interface OrderReturnItem {
  order_item_id?: number | string;
  product_name?: string;
  color_name?: string;
  image?: string;
  image_url?: string;
  color_image?: string;
  product_image?: string;
  size?: string;
  is_gift?: boolean;
  return_quantity?: number | string;
  refund_amount?: number | string;
  order_item?: {
    color?: { image_url?: string };
    product?: { image_url?: string };
  };
  [key: string]: unknown;
}

export interface OrderReturnRequest {
  reason_code?: string;
  refund_amount?: number | string;
  items?: OrderReturnItem[];
  admin_response?: string;
  status?: string;
}

export interface OrderLookupOrder {
  id: number | string;
  status: string;
  payment_status: string;
  payment_method?: string;
  created_at?: string;
  delivered_at?: string | null;
  /** Backend tính quy tắc đổi trả 7 ngày; false = hết hạn → ẩn nút đổi trả. */
  can_return?: boolean;
  return_deadline?: string | null;
  items?: OrderLookupItem[];
  return_request?: OrderReturnRequest | null;
  name?: string;
  phone?: string;
  address?: string;
  shipping_fee?: number | string;
  membership_discount?: number | string;
  voucher_discount?: number | string;
  voucher_code?: string;
  voucher?: { code?: string } | null;
  total_price?: number | string;
  email?: string;
  [key: string]: unknown;
}

export type LocalizedTextObject = Record<string, unknown>;
