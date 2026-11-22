export interface AdminUser {
  id: number;
  name: string;
  email: string;
  phone?: string | null;
  role: "admin" | "customer";
  total_spent?: string | number | null;
  membership_id?: number | null;
  created_at?: string;
  membership?: {
    id: number;
    name: string;
    name_vi?: string | null;
    name_en?: string | null;
    discount_percent?: string | number | null;
  } | null;
  _count?: { orders?: number };
}

export interface AdminMembership {
  id: number;
  name: string;
  name_vi?: string | null;
  name_en?: string | null;
  min_spending?: string | number | null;
  discount_percent?: string | number | null;
}

export interface UserOrderSummary {
  id: number;
  status: string;
  payment_status: string;
  payment_method: string;
  total_price: string | number;
  created_at: string;
}

export const EMPTY_USER_FORM = {
  name: "",
  email: "",
  phone: "",
  password: "",
  role: "customer",
  membership_id: "",
};

export const readErrorMessage = (error: unknown): string => {
  const axiosError = error as { response?: { data?: { message?: string } }; message?: string };
  return axiosError?.response?.data?.message || axiosError?.message || "";
};

/**
 * Hạng mặc định = "Thường" (min_spending = 0); nếu không có thì lấy hạng đầu tiên.
 * Thống nhất mới/cũ đều có hạng, không còn "Chưa có hạng".
 */
export const pickDefaultMembership = (memberships: AdminMembership[]): AdminMembership | undefined =>
  memberships.find((m) => Number(m.min_spending) === 0) || memberships[0];
