import { useState } from "react";
import API from "../../services/apiClient";
import { useToast } from "../../context/ToastContext";
import { useLanguage } from "../../context/LanguageContext";
import { formatCurrency as formatCurrencyUtil } from "../../utils/currencyUtils";
import { buildReturnItems, buildReturnFormData, buildOptimisticReturnRequest } from "../../utils/returnRequestUtils";
import type { OrderLookupOrder } from "../../components/customer/order-lookup/OrderRowTypes";
import type { ReturnOrderItem } from "../../utils/returnRequestUtils";
import type { ReturnFormData } from "../../components/customer/order-lookup/ReturnFormStep";
import { useBuyAgain } from "./useBuyAgain";
import { useOrderActions } from "./useOrderActions";

type AxiosErr = { response?: { data?: { message?: string } } };

type LookupOrder = OrderLookupOrder;

export function useOrderLookup() {
  const { showToast } = useToast();
  const { t, language, translateApiMessage } = useLanguage();
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [orders, setOrders] = useState<LookupOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedOrder, setExpandedOrder] = useState<number | string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<LookupOrder | null>(null);
  const [paymentModalOrder, setPaymentModalOrder] = useState<LookupOrder | null>(null);

  const [returnForm, setReturnForm] = useState<ReturnFormData>({
    reason_code: "",
    description: "",
    bank_name: "",
    bank_acc: "",
    bank_owner: "",
    images: [],
    selectedItems: {}
  });

  // Buy Again + các thao tác trên đơn (dùng chung với trang profile). Guest: "bận" = bật `loading`.
  const {
    buyAgainSuggestions, handleBuyAgain, handleConfirmBuyAgainSubstitutions, handleCloseBuyAgainModal,
  } = useBuyAgain<LookupOrder>((order) => setLoading(order !== null));

  const { handleRepay, handleCancelReturn, handleCancelOrder } = useOrderActions({
    setOrders,
    guestEmail: email,
    setRepayBusy: setLoading,
    setCancelOrderBusy: (orderId) => setLoading(orderId !== null),
    setCancelReturnBusy: setLoading,
    // Sau repay không redirect: đóng modal rồi verify OTP lại để làm mới danh sách
    onRepaySuccess: async () => {
      setPaymentModalOrder(null);
      if (email && otp) {
        try {
          const refreshRes = await API.post("/orders/otp/verify", { email, code: otp });
          if (refreshRes.data?.orders) setOrders(refreshRes.data.orders);
        } catch {
          // Ignore OTP re-verification error on background refresh
        }
      }
    },
    messages: { repaySuccess: t("lookup.payment_updated"), repayError: t("lookup.payment_error") },
  });

  const toggleOrder = (orderId: number | string) => {
    setExpandedOrder(expandedOrder === orderId ? null : orderId);
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await API.post("/orders/otp/send", { email, lang: language });
      setStep(2);
    } catch {
      showToast(t("lookup.otp_send_error"), "error");
    } finally {
      setLoading(false);
    }
  };

  /**
   * Verifies the OTP and retrieves the list of orders if valid.
   */
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await API.post("/orders/otp/verify", { email, code: otp });
      setOrders(res.data.orders);
      if (res.data.guestOrderAccessToken) {
        sessionStorage.setItem('guestOrderAccessToken', res.data.guestOrderAccessToken);
      }
      setStep(3);
    } catch {
      showToast(t("lookup.otp_invalid"), "error");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenPaymentModal = (order: LookupOrder) => {
    setPaymentModalOrder(order);
  };

  const handleClosePaymentModal = () => {
    setPaymentModalOrder(null);
  };

  /**
   * Opens the return form for a specific order.
   */
  const openReturnForm = (order: LookupOrder) => {
    setSelectedOrder(order);
    const initialSelectedItems: Record<number, { selected: boolean; return_quantity: number }> = {};
    if (order?.items) {
      order.items.forEach((item: ReturnOrderItem) => {
        initialSelectedItems[item.id] = {
          selected: !item.is_gift,
          return_quantity: item.quantity || 1
        };
      });
    }
    setReturnForm({
      reason_code: "",
      description: "",
      bank_name: "",
      bank_acc: "",
      bank_owner: "",
      images: [],
      selectedItems: initialSelectedItems
    });
    setStep(4);
  };

  /**
   * Submits the return request with attached images and bank info.
   */
  const handleReturnSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;
    setLoading(true);

    try {
      const returnItems = buildReturnItems(returnForm.selectedItems, selectedOrder?.items);

      if (returnItems.length === 0) {
        showToast(t("lookup.no_items_selected_err", "Vui lòng chọn ít nhất 1 sản phẩm để trả."), "warning");
        setLoading(false);
        return;
      }

      const formData = buildReturnFormData({
        reasonCode: returnForm.reason_code,
        description: returnForm.description,
        email, // Required to authenticate Guest
        returnItems,
        bankFieldName: "refund_bank_info",
        bankInfo: {
          name: returnForm.bank_name,
          acc: returnForm.bank_acc,
          owner: returnForm.bank_owner
        },
        images: returnForm.images,
      });

      await API.post(`/orders/${selectedOrder.id}/return`, formData);

      // Cập nhật UI: ẩn nút trả hàng và hiện ngay box "Thông tin yêu cầu đổi trả"
      // (không phải chờ verify OTP lại)
      const optimisticReturnRequest = buildOptimisticReturnRequest(
        selectedOrder, returnItems, returnForm.reason_code, returnForm.description
      );
      setOrders(prevOrders =>
        prevOrders.map(order => {
          if (order.id === selectedOrder.id) {
            return {
              ...order,
              status: 'Return Requested',
              return_request: optimisticReturnRequest as unknown as OrderLookupOrder["return_request"]
            };
          }
          return order;
        })
      );

      // Reset form and show success message
      showToast(t("lookup.return_success"), "success");
      setStep(3); // Return to order list
      setSelectedOrder(null);
      setReturnForm({
        reason_code: "",
        description: "",
        bank_name: "",
        bank_acc: "",
        bank_owner: "",
        images: [],
        selectedItems: {}
      });

    } catch (err: unknown) {
      const axErr = err as AxiosErr;
      console.error("Error submitting return request:", err);
      showToast(translateApiMessage(axErr.response?.data?.message) || t("lookup.return_error"), "error");
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (val: number | string | null | undefined) => formatCurrencyUtil(val, language);

  const resetLookup = () => {
    setStep(1);
    setOrders([]);
    setOtp("");
    setEmail("");
    sessionStorage.removeItem('guestOrderAccessToken');
  };

  return {
    state: {
      step, email, otp, orders, loading, expandedOrder, selectedOrder, returnForm, paymentModalOrder, buyAgainSuggestions
    },
    actions: {
      setStep, setEmail, setOtp, setReturnForm,
      toggleOrder, handleSendOtp, handleVerifyOtp, handleOpenPaymentModal, handleClosePaymentModal, handleRepay, openReturnForm, handleReturnSubmit, handleCancelReturn, handleCancelOrder, handleBuyAgain, handleConfirmBuyAgainSubstitutions, handleCloseBuyAgainModal, resetLookup
    },
    helpers: {
      formatCurrency
    }
  };
}
