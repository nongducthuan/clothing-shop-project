import { useState, useEffect, useCallback } from "react";
import API from "../../services/apiClient.ts";
import type { ProfileOrder } from "./profileTypes";

/**
 * Danh sách đơn hàng của khách trong trang Profile.
 * Tự tải đúng 1 lần khi `shouldLoad` = true (đang ở tab "orders" và đã đăng nhập);
 * các nơi khác gọi `fetchOrders()` để làm mới thủ công.
 */
export function useProfileOrders(shouldLoad: boolean) {
  const [orders, setOrders] = useState<ProfileOrder[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<ProfileOrder | null>(null);
  const [hasFetchedOrders, setHasFetchedOrders] = useState(false);

  const fetchOrders = useCallback(async () => {
    setLoadingOrders(true);
    setHasFetchedOrders(true);
    try {
      const token = localStorage.getItem("token");
      const response = await API.get("/orders", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setOrders(response.data as ProfileOrder[]);
    } catch (error) {
      console.error("Order Fetch Error:", error);
    } finally {
      setLoadingOrders(false);
    }
  }, []);

  useEffect(() => {
    if (shouldLoad && !hasFetchedOrders) {
      fetchOrders();
    }
  }, [shouldLoad, hasFetchedOrders, fetchOrders]);

  return { orders, setOrders, loadingOrders, selectedOrder, setSelectedOrder, fetchOrders };
}
