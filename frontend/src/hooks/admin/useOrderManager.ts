import { useState, useEffect, useCallback, useMemo } from "react";
import API from "../../services/apiClient";
import { useToast } from "../../context/ToastContext";

// ==========================================
// CONSTANTS (Declared outside to prevent re-creation on every render)
// ==========================================

const BASE_URL = import.meta.env.VITE_API_URL;

export const PAYMENT_OPTIONS = ["Unpaid", "Paid", "Refunded"];

export const STATUS_OPTIONS = [
  "Pending",
  "Confirmed",
  "Shipping",
  "Delivered",
  "Cancelled",
  "Return Requested",
  "Return Rejected",
  "Return Approved",
];

const ORDER_STATUS_COLORS = {
  Pending: "#ffc107",
  Confirmed: "#17a2b8",
  Shipping: "#007bff",
  Delivered: "#28a745",
  Cancelled: "#dc3545",
  "Return Requested": "#fd7e14",
  "Return_Requested": "#fd7e14",
  "Return Rejected": "#6c757d",
  "Return_Rejected": "#6c757d",
  "Return Approved": "#6f42c1",
  "Return_Approved": "#6f42c1",
};

const PAYMENT_STATUS_COLORS = {
  Unpaid: "#dc3545",
  Paid: "#28a745",
  Refunded: "#6f42c1",
};

// ==========================================
// CUSTOM HOOK
// ==========================================

/**
 * Custom hook to manage admin orders logic.
 * Encapsulates state management, API calls, and UI helpers.
 */
export default function useOrderManager() {
  // --- STATE MANAGEMENT ---
  const { showToast } = useToast();
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [confirmAction, setConfirmAction] = useState(false);
  const [filterStatus, setFilterStatus] = useState("All");

  // --- UTILS & HELPERS ---

  const getToken = useCallback(() => {
    return localStorage.getItem("token") || localStorage.getItem("adminToken");
  }, []);

  const formatCurrency = useCallback((amount) => {
    return Number(amount).toLocaleString("vi-VN") + "đ";
  }, []);

  const getOrderStatusColor = useCallback((status) => {
    return ORDER_STATUS_COLORS[status] || "#6c757d";
  }, []);

  const getPaymentStatusColor = useCallback((status) => {
    return PAYMENT_STATUS_COLORS[status] || "#6c757d";
  }, []);

  // --- DATA FETCHING ---

  /**
   * Fetch all orders from backend, sorted by newest first
   */
  const fetchOrders = useCallback(async () => {
    try {
      const res = await API.get("/admin/orders", {
        headers: { Authorization: `Bearer ${getToken()}` },
      });

      const ordersData = res.data.data || res.data;
      
      const sortedOrders = (Array.isArray(ordersData) ? ordersData : []).sort(
        (a: { created_at: string }, b: { created_at: string }) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      setOrders(sortedOrders);
    } catch (error: unknown) {
      showToast("Error loading orders", "error");
    }
  }, [getToken, showToast]);

  // Initial Data Load
  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // --- MUTATIONS (API ACTIONS) ---

  /**
   * Updates the general delivery status of an order
   */
  const handleOrderStatus = async (orderId, status) => {
    try {
      await API.put(
        `/admin/orders/${orderId}/status`,
        { status },
        { headers: { Authorization: `Bearer ${getToken()}` } }
      );

      fetchOrders(); // Refresh list to stay synced

      // Update currently viewed order if open in modal
      if (selectedOrder?.id === orderId) {
        setSelectedOrder((prev) => ({ ...prev, status }));
      }

      showToast("Order status updated successfully!");
    } catch (err: unknown) {
      const axErr = err as { response?: { data?: { message?: string } }; message?: string };
      showToast(axErr.response?.data?.message || axErr.message || "Error", "error");
    }
  };

  /**
   * Updates the payment status of an order
   */
  const handlePaymentStatus = async (orderId, newStatus) => {
    try {
      await API.put(
        `/admin/orders/${orderId}/payment`,
        { payment_status: newStatus },
        { headers: { Authorization: `Bearer ${getToken()}` } }
      );

      // Optimistic UI update for the grid
      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderId ? { ...o, payment_status: newStatus } : o
        )
      );

      // Update currently viewed order if open in modal
      if (selectedOrder?.id === orderId) {
        setSelectedOrder((prev) => ({ ...prev, payment_status: newStatus }));
      }

      showToast(`Payment status updated to ${newStatus}!`);
    } catch (err: unknown) {
      console.error(err);
      showToast("Error updating payment", "error");
    }
  };

  /**
   * Approves a customer's return request
   */
  const handleApproveReturn = async (orderId) => {
    if (!window.confirm("Confirm that you have refunded the money? This will set status to 'Return Approved'.")) {
      return;
    }

    const token = getToken();
    if (!token) {
      showToast("Error: Authentication token not found!", "error");
      return;
    }

    try {
      const response = await fetch(`${BASE_URL}/admin/orders/${orderId}/return/approve`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (response.ok) {
        showToast("Return request approved successfully!", "success");
        fetchOrders();
        setSelectedOrder(null); // Close modal if open
      } else {
        showToast(data.message || "Failed to approve return", "error");
      }
    } catch (error: unknown) {
      console.error(error);
      showToast("Server connection error", "error");
    }
  };

  /**
   * Rejects a customer's return request with a required admin note
   */
  const handleRejectReturn = async (orderId) => {
    const reason = window.prompt("Enter reason for rejection:");
    if (reason === null) return;
    if (reason.trim() === "") {
      showToast("Please provide a reason!", "warning");
      return;
    }

    const token = getToken();
    if (!token) {
      showToast("Error: Authentication token not found!", "error");
      return;
    }

    try {
      const response = await fetch(`${BASE_URL}/admin/orders/${orderId}/return/reject`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ adminNote: reason }),
      });

      if (response.ok) {
        showToast("Return request rejected.", "info");
        fetchOrders();
        setSelectedOrder(null); // Close modal if open
      } else {
        const data = await response.json();
        showToast(data.message || "Failed to reject return", "error");
      }
    } catch (error: unknown) {
      console.error(error);
      showToast("Server connection error", "error");
    }
  };

  // --- DERIVED STATE ---

  // Memoized to prevent recalculation on every re-render unless dependencies change
  const filteredOrders = useMemo(() => {
    return orders.filter(
      (o) => filterStatus === "All" || o.status === filterStatus
    );
  }, [orders, filterStatus]);

  // --- EXPOSE API TO COMPONENT ---
  return {
    orders: filteredOrders,
    selectedOrder,
    setSelectedOrder,
    confirmAction,
    setConfirmAction,
    filterStatus,
    setFilterStatus,
    formatCurrency,
    getOrderStatusColor,
    getPaymentStatusColor,
    handleOrderStatus,
    handlePaymentStatus,
    handleApproveReturn,
    handleRejectReturn
  };
}

