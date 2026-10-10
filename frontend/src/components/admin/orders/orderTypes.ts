export interface AdminOrder {
  id: number | string;
  status: string;
  payment_status?: string;
  payment_method?: string;
  total_price?: number | string;
  created_at?: string;
  return_status?: string;
  user_name?: string;
  name?: string;
  phone?: string;
  address?: string;
  email?: string;
  refund_amount?: number;
  items?: AdminOrderItem[];
  shipping_fee?: number | string;
  voucher_code?: string;
  voucher?: { code?: string };
  membership_discount?: number | string;
  voucher_discount?: number | string;
  return_request?: unknown;
  [key: string]: unknown;
}

export interface AdminOrderItem {
  id: number;
  is_gift?: boolean;
  price: number;
  quantity: number;
  image_url?: string;
  product_name?: string;
  color_name?: string;
  size?: string;
  [key: string]: unknown;
}

export interface OrderFilters {
  activeTab: "Standard" | "Returns";
  currentFilters: string[];
  currentActiveFilter: string;
  displayedOrders: AdminOrder[];
  handleTabSwitch: (tab: "Standard" | "Returns") => void;
  setCurrentFilter: (status: string) => void;
}

export interface OrderDisplayProps {
  getOrderStatusColor: (status: string) => string;
  getPaymentStatusColor: (status: string) => string;
  formatCurrency: (amount: number | string | null | undefined) => string;
  handleOrderStatus: (id: number | string, status: string) => void;
  handlePaymentStatus: (id: number | string, status: string) => void;
  handleApproveReturn: (id: number | string) => void;
  handleRejectReturn: (id: number | string) => void;
  onViewDetails: (order: AdminOrder) => void;
  onUndoApproveReturn: (order: AdminOrder) => void;
  filters: OrderFilters;
}
