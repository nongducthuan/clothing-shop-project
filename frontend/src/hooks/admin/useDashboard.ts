import { useState, useEffect } from "react";
import API from "../../services/apiClient";

export interface DashboardStats {
  categoriesCount: number;
  totalStock: number;
  orders: number;
  banners: number;
  activeSales: number;
  activeVouchers: number;
  activePromotions: number;
  users: number;
}

const EMPTY_STATS: DashboardStats = {
  categoriesCount: 0,
  totalStock: 0,
  orders: 0,
  banners: 0,
  activeSales: 0,
  activeVouchers: 0,
  activePromotions: 0,
  users: 0,
};

// Backend trả số đếm dạng number (COUNT của MySQL có thể là BigInt-string).
// Giá trị thiếu / không phải số => 0 để các ô dashboard không hiện NaN.
const toCount = (value: unknown): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

export function useDashboardStats() {
  const [stats, setStats] = useState<DashboardStats>(EMPTY_STATS);

  useEffect(() => {
    let isCancelled = false;

    // Dashboard chỉ cần 8 con số đếm => 1 request duy nhất tới /admin/stats, backend
    // đếm bằng COUNT(*) tại DB.
    const fetchStats = async () => {
      try {
        const response = await API.get("/admin/stats");
        const counters = (response.data?.dashboard || {}) as Record<string, unknown>;

        if (isCancelled) return;

        setStats({
          categoriesCount: toCount(counters.categoriesCount),
          totalStock: toCount(counters.totalStock),
          orders: toCount(counters.orders),
          banners: toCount(counters.banners),
          activeSales: toCount(counters.activeSales),
          activeVouchers: toCount(counters.activeVouchers),
          activePromotions: toCount(counters.activePromotions),
          users: toCount(counters.users),
        });
      } catch (error: unknown) {
        console.error("Failed to fetch dashboard stats", error);
      }
    };

    fetchStats();

    return () => {
      isCancelled = true;
    };
  }, []);

  return { stats };
}
