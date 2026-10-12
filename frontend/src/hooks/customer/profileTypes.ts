export interface ProfileOrderItem {
  id: number;
  product_id?: number;
  is_gift?: boolean;
  quantity: number;
  price: number;
  product_name?: string;
  color?: string;
  size?: string;
  product_name_vi?: string;
  product_name_en?: string;
  image?: string;
  image_url?: string;
  color_image?: string;
  product_image?: string;
  color_name?: string;
  size_name?: string;
  [key: string]: unknown;
}

export interface ProfileReturnRequest {
  reason_code?: string;
  status?: string;
  refund_amount?: number;
  admin_response?: string;
  items?: ProfileReturnItem[];
}

export interface ProfileReturnItem {
  order_item_id?: number | string; return_quantity?: number | string; refund_amount?: number | string;
  is_gift?: boolean; product_name?: string; color_name?: string; size?: string;
  image?: string; image_url?: string; color_image?: string; product_image?: string;
  order_item?: { color?: { image_url?: string }; product?: { image_url?: string } };
  [key: string]: unknown;
}

export interface ProfileOrder {
  id: number;
  status: string;
  email?: string;
  created_at?: string;
  delivered_at?: string | null;
  /** Backend tính quy tắc đổi trả 7 ngày; false = hết hạn → ẩn nút đổi trả. */
  can_return?: boolean;
  return_deadline?: string | null;
  payment_method?: string;
  total_price?: number | string;
  shipping_fee?: number | string;
  name?: string;
  phone?: string;
  address?: string;
  voucher_code?: string;
  voucher?: { code?: string };
  membership_discount?: number | string;
  voucher_discount?: number | string;
  items?: ProfileOrderItem[];
  payment_status?: string;
  return_request?: ProfileReturnRequest;
  [key: string]: unknown;
}
