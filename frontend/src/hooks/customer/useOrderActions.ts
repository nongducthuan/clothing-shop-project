import type { Dispatch, SetStateAction } from "react";
import API from "../../services/apiClient";
import { useToast } from "../../context/ToastContext";
import { useLanguage } from "../../context/LanguageContext";

type AxiosErr = { response?: { data?: { message?: string } } };
type OrderId = number | string;

/** Dạng tối thiểu của một đơn trong danh sách — đủ để hook cập nhật trạng thái sau khi hủy */
interface OrderRow {
  id: OrderId;
  status?: string;
  payment_status?: string;
  return_request?: unknown;
  [key: string]: unknown;
}

interface RepayableOrder {
  id: OrderId;
  email?: string;
  payment_method?: string;
}

interface UseOrderActionsOptions<T extends OrderRow> {
  /** setOrders của màn hình đang dùng — hook tự cập nhật trạng thái đơn sau khi hủy */
  setOrders: Dispatch<SetStateAction<T[]>>;
  /**
   * Chỉ dành cho guest tra cứu bằng OTP: email dùng để xác thực quyền sở hữu đơn.
   * Có giá trị → gửi kèm email ở repay / hủy đơn / hủy yêu cầu trả hàng.
   * User đã đăng nhập: bỏ trống (server nhận diện qua token).
   */
  guestEmail?: string;
  /** Bật/tắt trạng thái "đang xử lý": guest dùng `loading`, profile dùng `repayLoading` */
  setRepayBusy: (busy: boolean) => void;
  /** Đơn đang hủy (null = xong). Guest bật/tắt `loading`; profile lưu `cancellingOrderId` */
  setCancelOrderBusy: (orderId: OrderId | null) => void;
  /** Chỉ guest có loading riêng cho hủy yêu cầu trả hàng */
  setCancelReturnBusy?: (busy: boolean) => void;
  /** Gọi sau khi hủy đơn / hủy trả hàng thành công (profile: fetchOrders) */
  onOrderChanged?: () => void;
  /** Gọi sau khi repay thành công mà không cần redirect (đóng modal + làm mới danh sách) */
  onRepaySuccess?: () => void | Promise<void>;
  /** Thông báo mặc định khi API không trả message — mỗi màn hình dùng key dịch riêng */
  messages: { repaySuccess: string; repayError: string };
}

/**
 * Các thao tác trên đơn hàng đã có: thanh toán lại / đổi phương thức, hủy đơn,
 * hủy yêu cầu trả hàng. Dùng chung cho tra cứu đơn (guest) và trang profile (đã đăng nhập);
 * điểm khác nhau giữa hai luồng được truyền qua options.
 * (Header Authorization do interceptor của apiClient tự gắn khi có token.)
 */
export function useOrderActions<T extends OrderRow>(options: UseOrderActionsOptions<T>) {
  const { showToast } = useToast();
  const { t, translateApiMessage } = useLanguage();
  const {
    setOrders, guestEmail, setRepayBusy, setCancelOrderBusy, setCancelReturnBusy,
    onOrderChanged, onRepaySuccess, messages,
  } = options;
  const isGuest = guestEmail !== undefined;

  /** Thanh toán lại / đổi phương thức thanh toán cho đơn đang chờ. */
  const handleRepay = async (order: RepayableOrder, newMethod?: string) => {
    setRepayBusy(true);
    try {
      const res = await API.post(`/orders/${order.id}/repay`, {
        email: isGuest ? (order.email || guestEmail) : order.email,
        new_payment_method: newMethod || order.payment_method
      });
      if (res.data?.payUrl) {
        window.location.href = res.data.payUrl;
      } else {
        showToast(translateApiMessage(res.data?.message) || messages.repaySuccess, "success");
        await onRepaySuccess?.();
      }
    } catch (err: unknown) {
      console.error("Repay error:", err);
      const axErr = err as AxiosErr;
      showToast(translateApiMessage(axErr.response?.data?.message) || messages.repayError, "error");
    } finally {
      setRepayBusy(false);
    }
  };

  /** Hủy yêu cầu trả hàng đang chờ duyệt → đơn quay lại "Delivered". */
  const handleCancelReturn = async (orderId: OrderId) => {
    if (!window.confirm(t("lookup.cancel_return_confirm"))) return;
    setCancelReturnBusy?.(true);
    try {
      await API.delete(`/orders/${orderId}/return`, isGuest ? { data: { email: guestEmail } } : undefined);
      showToast(t("lookup.return_cancelled"), "success");
      setOrders((prevOrders: T[]) =>
        prevOrders.map((order) =>
          order.id === orderId
            ? { ...order, status: "Delivered", return_request: null } as T
            : order
        )
      );
      onOrderChanged?.();
    } catch (err: unknown) {
      const axErr = err as AxiosErr;
      showToast(translateApiMessage(axErr.response?.data?.message) || t("lookup.cancel_return_error"), "error");
    } finally {
      setCancelReturnBusy?.(false);
    }
  };

  /**
   * Khách hủy đơn (chỉ khi Pending/Confirmed).
   * Backend lo hoàn kho, doanh thu và đánh dấu 'Refunded' cho đơn đã thanh toán online.
   */
  const handleCancelOrder = async (orderId: OrderId) => {
    if (!window.confirm(t("lookup.cancel_order_confirm"))) return;
    setCancelOrderBusy(orderId);
    try {
      const res = await API.put(
        "/orders/status",
        isGuest
          ? { order_id: orderId, new_status: "Cancelled", email: guestEmail }
          : { order_id: orderId, new_status: "Cancelled" }
      );
      if (res.data?.payment_status === "Refunded") {
        showToast(t("lookup.cancel_order_refund_note"), "success");
      } else {
        showToast(t("lookup.cancel_order_success"), "success");
      }
      setOrders((prevOrders: T[]) =>
        prevOrders.map((order) =>
          order.id === orderId
            ? { ...order, status: "Cancelled", payment_status: res.data?.payment_status || order.payment_status }
            : order
        )
      );
      onOrderChanged?.();
    } catch (err: unknown) {
      const axErr = err as AxiosErr;
      showToast(translateApiMessage(axErr.response?.data?.message) || t("lookup.cancel_order_error"), "error");
    } finally {
      setCancelOrderBusy(null);
    }
  };

  return { handleRepay, handleCancelReturn, handleCancelOrder };
}
