const BASE_URL = import.meta.env.VITE_API_URL;
import type { ToastType } from "../../context/ToastContext";
import type { AdminOrder } from "../../components/admin/orders/orderTypes";

type OrderRecord = AdminOrder;
interface Dependencies {
  getToken: () => string | null;
  findOrderById: (orderId: number | string) => OrderRecord | null;
  fetchOrders: () => void;
  setSelectedOrder: (order: OrderRecord | null) => void;
  showToast: (message: string, type?: ToastType) => void;
  t: (key: string, fallback?: string) => string;
  translateApiMessage: (message?: string) => string | undefined;
}

/**
 * Các thao tác đổi trả của admin (duyệt / từ chối / hoàn tác duyệt).
 * Tách từ useOrderManager — logic giữ nguyên, các phụ thuộc được truyền qua tham số.
 */
export default function useReturnActions({ getToken, findOrderById, fetchOrders, setSelectedOrder, showToast, t, translateApiMessage }: Dependencies) {
  /**
   * Approves a customer's return request
   */
  const handleApproveReturn = async (orderId: number | string) => {
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
  const handleRejectReturn = async (orderId: number | string) => {
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
  const handleUndoApproveReturn = async (orderId: number | string, { stockReturned, moneyRefunded }: { stockReturned: boolean; moneyRefunded: boolean }) => {
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

  return { handleApproveReturn, handleRejectReturn, handleUndoApproveReturn };
}
