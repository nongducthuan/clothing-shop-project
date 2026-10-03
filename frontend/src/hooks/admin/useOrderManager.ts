import { useState, useEffect, useCallback } from "react";
import API from "../../services/apiClient";
import { useToast } from "../../context/ToastContext";
import { useLanguage } from "../../context/LanguageContext";
import { formatCurrency as formatCurrencyUtil } from "../../utils/currencyUtils";
import { UNDO_TRANSITIONS, isClosedOrderStatus, STANDARD_STATUSES, RETURN_STATUSES } from "../../utils/orderUtils";

const BASE_URL = import.meta.env.VITE_API_URL;

/** Số đơn mỗi trang — khớp mặc định của GET /admin/orders (backend chặn tối đa 100). */
const PAGE_SIZE = 50;

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

export default function useOrderManager() {
  const { showToast } = useToast();
  const { t, language, translateApiMessage } = useLanguage();
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [confirmAction, setConfirmAction] = useState(false);

  // ─── LỌC + PHÂN TRANG CHẠY Ở SERVER ────────────────────────────────────────
  // GET /admin/orders chỉ trả 50 đơn mới nhất/trang, nên tab (Đơn hàng / Đổi trả)
  // và trạng thái phải lọc ngay tại DB: lọc ở client chỉ nhìn thấy đúng 1 trang,
  // đơn thứ 51 trở đi sẽ biến mất và các tab đếm sai.
  const [activeTab, setActiveTab] = useState("Standard"); // "Standard" | "Returns"
  const [filterStandard, setFilterStandard] = useState("All");
  const [filterReturn, setFilterReturn] = useState("All");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, totalOrders: 0 });

  const currentActiveFilter = activeTab === "Standard" ? filterStandard : filterReturn;

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

  /**
   * Lấy MỘT TRANG đơn hàng từ backend. Backend tự lọc theo tab + trạng thái và
   * sắp xếp mới nhất trước (orderBy created_at desc) → không lọc/sắp xếp lại ở client.
   */
  const fetchOrders = useCallback(async () => {
    try {
      const res = await API.get("/admin/orders", {
        headers: { Authorization: `Bearer ${getToken()}` },
        params: { page, limit: PAGE_SIZE, tab: activeTab, status: currentActiveFilter },
      });

      const ordersData = res.data?.data ?? res.data;
      const pageOrders = Array.isArray(ordersData) ? ordersData : [];
      const totalPages = Number(res.data?.totalPages) || 1;

      // Trang hiện tại rỗng (ví dụ đơn cuối cùng của trang cuối vừa bị đổi trạng thái
      // nên rời khỏi bộ lọc) → lùi về trang trước thay vì để admin nhìn bảng trống.
      if (pageOrders.length === 0 && page > 1) {
        setPage(Math.min(page - 1, totalPages));
        return;
      }

      setOrders(pageOrders);
      setPagination({
        currentPage: Number(res.data?.currentPage) || page,
        totalPages,
        totalOrders: Number(res.data?.totalOrders) || 0,
      });
    } catch {
      showToast(t("admin.order.toast_load_failed", "Error loading orders"), "error");
    }
  }, [activeTab, currentActiveFilter, getToken, page, showToast, t]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  /** Đổi tab (Đơn hàng ↔ Đổi trả): tập dữ liệu khác hẳn → luôn về trang 1. */
  const handleTabSwitch = useCallback((tab) => {
    setActiveTab(tab);
    setPage(1);
  }, []);

  /** Đổi trạng thái đang lọc: lọc chạy ở server nên cũng phải về trang 1. */
  const setCurrentFilter = useCallback((status) => {
    if (activeTab === "Standard") setFilterStandard(status);
    else setFilterReturn(status);
    setPage(1);
  }, [activeTab]);

  /** Chuyển trang — cuộn lên đầu danh sách vì mỗi trang có thể dài 50 dòng. */
  const handlePageChange = useCallback((nextPage) => {
    setPage(nextPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

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
        showToast(translateApiMessage(data.message) || t("admin.order.toast_approve_failed", "Failed to approve return"), "error");
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
        showToast(translateApiMessage(data.message) || t("admin.order.toast_reject_failed", "Failed to reject return"), "error");
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
      showToast(translateApiMessage(data.message) || t("admin.order.toast_undo_approve_failed", "Hoàn tác thất bại"), "error");
      return false;
    } catch (error: unknown) {
      console.error(error);
      showToast(t("admin.order.toast_server_error", "Server connection error"), "error");
      return false;
    }
  };

  // Bộ lọc hiển thị: dùng CHUNG 1 object cho desktop table và mobile card.
  // displayedOrders === orders vì backend đã lọc sẵn theo tab + trạng thái.
  const currentFilters =
    activeTab === "Standard" ? ["All", ...STANDARD_STATUSES] : ["All", ...RETURN_STATUSES];

  return {
    orders,
    filters: {
      activeTab,
      handleTabSwitch,
      currentFilters,
      currentActiveFilter,
      setCurrentFilter,
      displayedOrders: orders
    },
    pagination,
    handlePageChange,
    selectedOrder,
    setSelectedOrder,
    confirmAction,
    setConfirmAction,
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

