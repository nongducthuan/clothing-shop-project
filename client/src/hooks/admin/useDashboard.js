import { useState, useEffect } from "react";
import API from "../../services/apiClient";

/**
 * Safely extracts array data from Promise.allSettled results.
 * Handles different API response structures ({ data: [] } vs []).
 * * @param {Object} result - The result object from Promise.allSettled
 * @returns {Array} The extracted data array or empty array
 */
const extractData = (result) => {
  if (result.status !== "fulfilled") return [];

  const data = result.value.data;

  // Case 1: API returns array directly
  if (Array.isArray(data)) return data;

  // Case 2: API returns { data: [...] }
  if (data && Array.isArray(data.data)) return data.data;

  return [];
};

/**
 * Custom Hook to manage Dashboard data fetching and state.
 * Separates data logic from UI rendering.
 */
export function useDashboardStats() {
  const [stats, setStats] = useState({
    categoriesCount: 0,
    totalStock: 0,
    orders: 0,
    banners: 0,
    activeSales: 0,
    activeVouchers: 0,
    activePromotion: 0,
  });

  useEffect(() => {
    const fetchStats = async () => {
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };

      try {
        // Fetch all required data concurrently
        const results = await Promise.allSettled([
          API.get("/admin/products", { headers }),
          API.get("/admin/orders", { headers }),
          API.get("/admin/banners", { headers }),
          API.get("/categories", { headers }),
          API.get("/sales/admin", { headers }),
          API.get("/vouchers/admin", { headers }),
          API.get("/promotions/admin", { headers }),
        ]);

        // Parse results using helper
        const products = extractData(results[0]);
        const orders = extractData(results[1]);
        const banners = extractData(results[2]);
        const categories = extractData(results[3]);
        const sales = extractData(results[4]);
        const vouchers = extractData(results[5]);
        const promotions = extractData(results[6]);

        // Select status = 1
        const activeSalesCount = sales.filter(s => s.status === 1).length;
        const activeVouchersCount = vouchers.filter(v => v.status === 1).length;
        const activePromotionsCount = promotions.filter(p => p.status === 'active').length;

        // Calculate total stock from all products
        const totalStockCount = products.reduce(
          (sum, p) => sum + (Number(p.total_stock) || 0),
          0
        );

        // Update state
        setStats({
          categoriesCount: categories.length,
          totalStock: totalStockCount,
          orders: orders.length,
          banners: banners.length,
          activeSales: activeSalesCount,
          activeVouchers: activeVouchersCount,
          activePromotions: activePromotionsCount,
        });
      } catch (error) {
        console.error("Failed to fetch dashboard stats", error);
      }
    };

    fetchStats();
  }, []);

  return { stats };
}
