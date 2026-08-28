// =============================================================================
// Shared Type Definitions — Frontend (đồng bộ với Backend API)
// =============================================================================

// --------------- User & Auth ---------------

export interface User {
  id: number;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  role: 'admin' | 'user';
  tier_name?: string;
  discount_percent?: number;
  total_spent?: number;
  points?: number;
  avatar_url?: string;
  created_at?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

// --------------- Category ---------------

export interface Category {
  id: number;
  name: string;
  image_url?: string;
  description?: string;
  created_at?: string;
}

// --------------- Product ---------------

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
  description?: string;
  category_id?: number;
  category?: Category;
  variants?: ProductVariant[];
  colors?: Color[];
  sizes?: Size[];
  image_url?: string;
  base_price?: number;
  is_active?: boolean;
  created_at?: string;
}

// --------------- Cart ---------------

export interface CartItem {
  cartItemId?: string; // Made optional since addToCart constructs it if not present
  id: number;
  name: string;
  price: number;
  quantity: number;
  size_id: number;
  color_id: number;
  size_name?: string;
  color_name?: string;
  image_url?: string;
  variant_id?: number;
  stock?: number;
  category_id?: number;
  color?: string;
  color_image?: string;
  size?: string;
}

// --------------- Order ---------------

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'shipping'
  | 'delivered'
  | 'cancelled'
  | 'return_requested'
  | 'returned';

export interface OrderItem {
  id: number;
  order_id: number;
  product_variant_id: number;
  quantity: number;
  unit_price: number;
  product_name?: string;
  color_name?: string;
  size_name?: string;
  image_url?: string;
}

export interface Order {
  id: number;
  user_id?: number;
  status: OrderStatus;
  total_amount: number;
  discount_amount?: number;
  final_amount?: number;
  shipping_address?: string;
  recipient_name?: string;
  recipient_phone?: string;
  payment_method?: string;
  note?: string;
  voucher_code?: string;
  items?: OrderItem[];
  created_at?: string;
  updated_at?: string;
}

// --------------- Banner ---------------

export interface Banner {
  id: number;
  title?: string;
  image_url: string;
  link_url?: string;
  is_active: boolean;
  order?: number;
  created_at?: string;
}

// --------------- Voucher ---------------

export interface Voucher {
  id: number;
  code: string;
  discount_type: 'percent' | 'fixed';
  discount_value: number;
  min_order_amount?: number;
  max_discount_amount?: number;
  usage_limit?: number;
  used_count?: number;
  is_active: boolean;
  expires_at?: string;
  created_at?: string;
}

// --------------- Sale ---------------

export interface Sale {
  id: number;
  name: string;
  discount_percent: number;
  start_date: string;
  end_date: string;
  is_active: boolean;
  created_at?: string;
}

// --------------- Promotion ---------------

export interface Promotion {
  id: number;
  name: string;
  description?: string;
  type: 'gift' | 'discount' | 'tier';
  min_quantity?: number;
  gift_product_id?: number;
  discount_percent?: number;
  is_active: boolean;
  created_at?: string;
}

// --------------- AI Chat ---------------

export type MessageRole = 'user' | 'ai';

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  createdAt: string;
}

// --------------- Generic API Response ---------------

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
