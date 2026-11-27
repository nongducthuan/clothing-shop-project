// Shared Type Definitions — Frontend (đồng bộ với Backend API)

export interface User {
  id: number;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  role: 'admin' | 'customer';
  tier_name?: string;
  discount_percent?: number;
  total_spent?: number;
  points?: number;
  avatar_url?: string;
  avatar?: string;
  created_at?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface Category {
  id: number;
  name: string;
  name_vi?: string;
  name_en?: string;
  image_url?: string;
  created_at?: string;
}

export interface Color {
  id: number;
  name: string;
  hex_code?: string;
  image_urls?: string[];
}

export interface Size {
  id: number;
  name: string;
}

export interface ProductVariant {
  id: number;
  product_id: number;
  color_id: number;
  size_id: number;
  stock: number;
  price: number;
  color?: Color;
  size?: Size;
}

export interface Product {
  id: number;
  name: string;
  name_vi?: string;
  name_en?: string;
  description?: string;
  description_vi?: string;
  description_en?: string;
  category_id?: number;
  category?: Category;
  variants?: ProductVariant[];
  colors?: Color[];
  sizes?: Size[];
  image_url?: string;
  base_price?: number;
  is_active?: boolean;
  created_at?: string;
  [key: string]: unknown;
}

export interface CartItem {
  cartItemId?: string; // Made optional since addToCart constructs it if not present
  id: number;
  name: string;
  name_vi?: string;
  name_en?: string;
  price: number;
  quantity: number;
  size_id: number;
  color_id: number;
  size_name?: string;
  color_name?: string;
  color_name_vi?: string;
  color_name_en?: string;
  image_url?: string;
  variant_id?: number;
  stock?: number;
  category_id?: number;
  color?: string;
  color_image?: string;
  size?: string;
  [key: string]: unknown;
}

export type OrderStatus =
  | 'Pending'
  | 'Confirmed'
  | 'Shipping'
  | 'Delivered'
  | 'Cancelled'
  | 'Return Requested'
  | 'Return_Requested'
  | 'Return Rejected'
  | 'Return_Rejected'
  | 'Return Approved'
  | 'Return_Approved';

export interface OrderItem {
  id: number;
  order_id: number;
  product_id: number;
  color_id?: number | null;
  size_id?: number | null;
  quantity: number;
  price: number;
  is_gift?: boolean;
  promotion_id?: number | null;
  import_price_snapshot?: number;
  product_name?: string;
  color_name?: string;
  size_name?: string;
  image_url?: string;
  product?: { name: string; name_vi?: string; name_en?: string; image_url?: string };
  color?: { color_name: string; color_name_vi?: string; color_name_en?: string; image_url?: string };
  size?: { size: string };
}

export interface Order {
  id: number;
  user_id?: number | null;
  status: OrderStatus | string;
  total_price: number;
  shipping_fee?: number;
  discount_amount?: number;
  address?: string;
  name?: string;
  phone?: string;
  email?: string;
  payment_method?: string;
  payment_status?: 'Unpaid' | 'Paid' | 'Refunded';
  voucher_id?: number | null;
  items?: OrderItem[];
  return_request?: unknown;
  created_at?: string;
  updated_at?: string;
}

export interface Banner {
  id: number;
  title?: string;
  image_url: string;
  link_url?: string;
  is_active: boolean;
  order?: number;
  created_at?: string;
}

export interface Voucher {
  id: number;
  code: string;
  discount_percent?: number | null;
  max_discount_amount?: number | null;
  min_order_value?: number;
  usage_limit?: number | null;
  used_count?: number;
  status: boolean;
  apply_scope?: 'all' | 'product' | 'category';
  start_date?: string | null;
  end_date?: string | null;
  created_at?: string;
}

export interface Sale {
  id: number;
  name: string;
  discount_percent: number;
  apply_scope?: 'all' | 'product' | 'category';
  start_date: string;
  end_date: string;
  status: boolean;
  created_at?: string;
}

export interface Promotion {
  id: number;
  buy_product_id: number;
  gift_product_id: number;
  buy_quantity: number;
  gift_quantity: number;
  is_active: boolean;
  status?: string;
  is_stackable?: boolean;
  max_gift_per_order?: number | null;
  total_gift_limit?: number | null;
  total_gifts_issued?: number;
  priority?: number;
  start_date?: string;
  end_date?: string;
  created_at?: string;
}

export type MessageRole = 'user' | 'ai';

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  createdAt: string;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
  success?: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
