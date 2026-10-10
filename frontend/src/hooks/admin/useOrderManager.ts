import { useState, useEffect, useCallback } from "react";
import API from "../../services/apiClient";
import { useToast } from "../../context/ToastContext";
import { useLanguage } from "../../context/LanguageContext";
import { formatCurrency as formatCurrencyUtil } from "../../utils/currencyUtils";
import { UNDO_TRANSITIONS, isClosedOrderStatus, STANDARD_STATUSES, RETURN_STATUSES, ORDER_STATUS_COLORS, PAYMENT_STATUS_COLORS } from "../../utils/orderUtils";
import useReturnActions from "./useReturnActions";
import type { AdminOrder as OrderRecord } from "../../components/admin/orders/orderTypes";

/** Số đơn mỗi trang — khớp mặc định của GET /admin/orders (backend chặn tối đa 100). */
const PAGE_SIZE = 50;

type OrderTab = "Standard" | "Returns";
type PaymentStatus = "Paid" | "Unpaid" | "Refunded" | string;

// Danh sách enum trạng thái (STATUS_OPTIONS, STANDARD_STATUSES, RETURN_STATUSES,
// PAYMENT_OPTIONS) và luật chuyển trạng thái (isStatusAllowed / isStatusFlowLocked)
// được khai báo DUY NHẤT trong utils/orderUtils → tránh lệch giữa desktop table,
// mobile card và bộ lọc.

export default function useOrderManager() {
  const { showToast } = useToast();
  const { t, language, translateApiMessage } = useLanguage();
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<OrderRecord | null>(null);
  const [confirmAction, setConfirmAction] = useState(false);

  // GET /admin/orders chỉ trả 50 đơn mới nhất/trang, nên tab (Đơn hàng / Đổi trả)
  // và trạng thái phải lọc ngay tại DB: lọc ở client chỉ nhìn thấy đúng 1 trang,
  // đơn thứ 51 trở đi sẽ biến mất và các tab đếm sai.
  const [activeTab, setActiveTab] = useState<OrderTab>("Standard");
  const [filterStandard, setFilterStandard] = useState("All");
  const [filterReturn, setFilterReturn] = useState("All");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, totalOrders: 0 });

  const currentActiveFilter = activeTab === "Standard" ? filterStandard : filterReturn;

  const getToken = useCallback(() => {
    return localStorage.getItem("token") || localStorage.getItem("adminToken");
  }, []);

  const formatCurrency = useCallback((amount: number | string | null | undefined) => {
    return formatCurrencyUtil(amount, language);
  }, [language]);

  const getOrderStatusColor = useCallback((status: string) => {
    return ORDER_STATUS_COLORS[status as keyof typeof ORDER_STATUS_COLORS] || "#6c757d";
  }, []);

  const getPaymentStatusColor = useCallback((status: string) => {
    return PAYMENT_STATUS_COLORS[status as keyof typeof PAYMENT_STATUS_COLORS] || "#6c757d";
  }, []);

  /**
   * Lấy đơn đang thao tác để biết ĐÃ THU TIỀN chưa (payment_status === "Paid").
   * Việc có cần nhắc hoàn tiền hay không dựa trên "tiền đã thu chưa",
   * KHÔNG dựa vào payment_method (COD giao xong vẫn đã thu tiền mặt).
   */
  const findOrderById = (orderId: number | string) =>
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
      const pageOrders: OrderRecord[] = Array.isArray(ordersData) ? ordersData : [];
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
  const handleTabSwitch = useCallback((tab: OrderTab) => {
    setActiveTab(tab);
    setPage(1);
  }, []);

  /** Đổi trạng thái đang lọc: lọc chạy ở server nên cũng phải về trang 1. */
  const setCurrentFilter = useCallback((status: string) => {
    if (activeTab === "Standard") setFilterStandard(status);
    else setFilterReturn(status);
    setPage(1);
  }, [activeTab]);

  /** Chuyển trang — cuộn lên đầu danh sách vì mỗi trang có thể dài 50 dòng. */
  const handlePageChange = useCallback((nextPage: number) => {
    setPage(nextPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  /**
   * Updates the general delivery status of an order
   */
  const handleOrderStatus = async (orderId: number | string, status: string) => {
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
        setSelectedOrder((prev) => prev ? { ...prev, status } : prev);
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
  const handlePaymentStatus = async (orderId: number | string, newStatus: PaymentStatus) => {
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
          String(o.id) === String(orderId) ? { ...o, payment_status: newStatus } : o
        )
      );

      // Update currently viewed order if open in modal
      if (selectedOrder?.id === orderId) {
        setSelectedOrder((prev) => prev ? { ...prev, payment_status: newStatus } : prev);
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

  const { handleApproveReturn, handleRejectReturn, handleUndoApproveReturn } = useReturnActions({
    getToken,
    findOrderById,
    fetchOrders,
    setSelectedOrder,
    showToast,
    t,
    translateApiMessage,
  });

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
