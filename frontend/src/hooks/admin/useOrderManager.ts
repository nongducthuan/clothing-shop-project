import { useState, useEffect, useCallback, useMemo } from "react";
import API from "../../services/apiClient";
import { useToast } from "../../context/ToastContext";
import { useLanguage } from "../../context/LanguageContext";
import { formatCurrency as formatCurrencyUtil } from "../../utils/currencyUtils";
import { UNDO_TRANSITIONS, isClosedOrderStatus } from "../../utils/orderUtils";

// ==========================================
// CONSTANTS (Declared outside to prevent re-creation on every render)
// ==========================================

const BASE_URL = import.meta.env.VITE_API_URL;

// Danh sách enum trạng thái (STATUS_OPTIONS, STANDARD_STATUSES, RETURN_STATUSES,
// PAYMENT_OPTIONS) và luật chuyển trạng thái (isStatusAllowed / isStatusFlowLocked)
// được khai báo DUY NHẤT trong utils/orderUtils → tránh lệch giữa desktop table,
// mobile card và bộ lọc.

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
  const { t, language, translateApiMessage } = useLanguage();
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [confirmAction, setConfirmAction] = useState(false);
  const [filterStatus, setFilterStatus] = useState("All");

  // --- UTILS & HELPERS ---

  const getToken = useCallback(() => {
    return localStorage.getItem("token") || localStorage.getItem("adminToken");
  }, []);

  const formatCurrency = useCallback((amount) => {
    return formatCurrencyUtil(amount, language);
  }, [language]);

  const getOrderStatusColor = useCallback((status) => {
    return ORDER_STATUS_COLORS[status] || "#6c757d";
  }, []);

  const getPaymentStatusColor = useCallback((status) => {
    return PAYMENT_STATUS_COLORS[status] || "#6c757d";
  }, []);

  /**
   * Lấy đơn đang thao tác để biết ĐÃ THU TIỀN chưa (payment_status === "Paid").
   * Việc có cần nhắc hoàn tiền hay không dựa trên "tiền đã thu chưa",
   * KHÔNG dựa vào payment_method (COD giao xong vẫn đã thu tiền mặt).
   */
  const findOrderById = (orderId) =>
    orders.find((o) => String(o.id) === String(orderId)) || selectedOrder;

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
      showToast(t("admin.order.toast_load_failed", "Error loading orders"), "error");
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
    const currentStatus = findOrderById(orderId)?.status?.replace(/_/g, " ");
    // UNDO có kiểm soát: quay lại đúng 1 bước (Delivered→Shipping, Cancelled→Pending,
    // Return Rejected→Return Requested). Luôn hỏi xác nhận vì đụng kho/doanh thu.
    if (currentStatus && UNDO_TRANSITIONS[currentStatus] === status) {
      const undoKey =
        status === "Shipping"
          ? "admin.order.confirm_undo_delivered"
          : status === "Pending"
          ? "admin.order.confirm_undo_cancelled"
          : "admin.order.confirm_undo_return_rejected";
      if (!window.confirm(t(undoKey))) {
        return;
      }
    }

    if (status === "Cancelled") {
      // Hủy đơn luôn cộng lại kho; chỉ nhắc hoàn tiền khi đơn ĐÃ thu tiền
      const needsRefund = findOrderById(orderId)?.payment_status === "Paid";
      const messageKey = needsRefund
        ? "admin.order.confirm_cancel_refund"
        : "admin.order.confirm_cancel";
      if (!window.confirm(t(messageKey))) {
        return;
      }
    }

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

      showToast(t("admin.order.toast_status_updated", "Order status updated successfully!"));
    } catch (err: unknown) {
      const axErr = err as { response?: { data?: { message?: string } }; message?: string };
      // Dịch message tiếng Anh từ backend qua api_msg.* để toast hiển thị song ngữ
      showToast(
        translateApiMessage(axErr.response?.data?.message) || axErr.message || "Error",
        "error"
      );
    }
  };

  /**
   * Updates the payment status of an order
   */
  const handlePaymentStatus = async (orderId, newStatus) => {
    // Undo "lỡ bấm Paid nhầm": chỉ khi tiền CHƯA thật sự thu (điển hình COD).
    // Với MoMo/VNPay cần đối chiếu cổng thanh toán — confirm bắt buộc trước khi đổi.
    // Nhãn "Unpaid" đổi theo trạng thái đơn cho KHỚP với badge trong dropdown:
    // đơn ĐÓNG (hủy/đổi trả) = "Chưa thu tiền"; 4 trạng thái luồng giao hàng = "Chưa thanh toán".
    const currentOrder = findOrderById(orderId);
    const currentPayment = currentOrder?.payment_status || "Unpaid";
    if (currentPayment === "Paid" && newStatus === "Unpaid") {
      const unpaidLabel =
        currentOrder && isClosedOrderStatus(currentOrder.status || "")
          ? t("payment_status.not_collected", "Chưa thu tiền")
          : t("payment_status.unpaid", "Chưa thanh toán");
      if (!window.confirm(t("admin.order.confirm_paid_to_unpaid").replace("{label}", unpaidLabel))) {
        return;
      }
    }
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

      // Keep the payment toast bilingual, matching the rest of the admin order flow
      const localizedPaymentStatus = t(
        `payment_status.${String(newStatus).toLowerCase().replace(/\s+/g, "_")}`,
        newStatus
      );
      showToast(
        t("admin.order.toast_payment_updated", "Payment status updated to {status}!").replace(
          "{status}",
          localizedPaymentStatus
        )
      );
    } catch (err: unknown) {
      console.error(err);
      showToast(t("admin.order.toast_payment_failed", "Error updating payment"), "error");
    }
  };

  /**
   * Approves a customer's return request
   */
  const handleApproveReturn = async (orderId) => {
    // Đổi trả luôn cộng lại kho; chỉ nhắc hoàn tiền khi đơn ĐÃ thu tiền
    const needsRefund = findOrderById(orderId)?.payment_status === "Paid";
    const messageKey = needsRefund
      ? "admin.order.confirm_refunded"
      : "admin.order.confirm_return_approved";
    if (!window.confirm(t(messageKey))) {
      return;
    }

    const token = getToken();
    if (!token) {
      showToast(t("admin.order.toast_no_token", "Error: Authentication token not found!"), "error");
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
        showToast(t("admin.order.toast_return_approved", "Return request approved successfully!"), "success");
        fetchOrders();
        setSelectedOrder(null); // Close modal if open
      } else {
        showToast(data.message || t("admin.order.toast_approve_failed", "Failed to approve return"), "error");
      }
    } catch (error: unknown) {
      console.error(error);
      showToast(t("admin.order.toast_server_error", "Server connection error"), "error");
    }
  };

  /**
   * Rejects a customer's return request with a required admin note
   */
  const handleRejectReturn = async (orderId) => {
    const reason = window.prompt(t("admin.order.prompt_reject_reason", "Nhập lý do từ chối:"));
    if (reason === null) return;
    if (reason.trim() === "") {
      showToast(t("admin.toast_provide_reason", "Vui lòng cung cấp lý do!"), "warning");
      return;
    }

    const token = getToken();
    if (!token) {
      showToast(t("admin.order.toast_no_token", "Error: Authentication token not found!"), "error");
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
        showToast(t("admin.order.toast_return_rejected", "Return request rejected."), "info");
        fetchOrders();
        setSelectedOrder(null); // Close modal if open
      } else {
        const data = await response.json();
        showToast(data.message || t("admin.order.toast_reject_failed", "Failed to reject return"), "error");
      }
    } catch (error: unknown) {
      console.error(error);
      showToast(t("admin.order.toast_server_error", "Server connection error"), "error");
    }
  };

  /**
   * Hoàn tác duyệt nhầm Return Approved — thay nút Undo bị cấm bằng modal 2 checkbox.
   * Admin phải gọi điện xác nhận với khách trước rồi tick đúng thực tế:
   *   - stockReturned: hàng đã về kho thật chưa? (chưa → backend trừ lại kho)
   *   - moneyRefunded: tiền đã hoàn ra ngoài thật chưa? (chưa → Refunded → Paid)
   */
  const handleUndoApproveReturn = async (orderId, { stockReturned, moneyRefunded }) => {
    const token = getToken();
    if (!token) {
      showToast(t("admin.order.toast_no_token", "Error: Authentication token not found!"), "error");
      return false;
    }

    try {
      const response = await fetch(`${BASE_URL}/admin/orders/${orderId}/return/undo-approve`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ stock_returned: stockReturned, money_refunded: moneyRefunded }),
      });

      const data = await response.json();

      if (response.ok) {
        showToast(t("admin.order.toast_undo_approved", "Đã hoàn tác duyệt nhầm. Đơn đã về lại \"Yêu cầu đổi trả\"."), "success");
        fetchOrders();
        setSelectedOrder(null); // Close modal if open
        return true;
      }
      showToast(data.message || t("admin.order.toast_undo_approve_failed", "Hoàn tác thất bại"), "error");
      return false;
    } catch (error: unknown) {
      console.error(error);
      showToast(t("admin.order.toast_server_error", "Server connection error"), "error");
      return false;
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
    handleRejectReturn,
    handleUndoApproveReturn
  };
}

