import { useState } from "react";
import API from "../../services/apiClient";
import { useToast } from "../../context/ToastContext";
import { useLanguage } from "../../context/LanguageContext";
import { formatCurrency as formatCurrencyUtil } from "../../utils/currencyUtils";

type AxiosErr = { response?: { data?: { message?: string } } };

export function useOrderLookup() {
  const { showToast } = useToast();
  const { t, language } = useLanguage();
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [paymentModalOrder, setPaymentModalOrder] = useState<any>(null);
  const [returnForm, setReturnForm] = useState<{
    reason_code: string;
    description: string;
    bank_name: string;
    bank_acc: string;
    bank_owner: string;
    images?: File[];
    selectedItems?: Record<number, { selected: boolean; return_quantity: number | string }>;
  }>({
    reason_code: "",
    description: "",
    bank_name: "",
    bank_acc: "",
    bank_owner: "",
    images: [],
    selectedItems: {}
  });

  /**
   * Expands or collapses the item details for a specific order.
   */
  const toggleOrder = (orderId: number | string) => {
    setExpandedOrder(expandedOrder === orderId ? null : orderId);
  };

  /**
   * Triggers the OTP sending process to the user's email.
   */
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await API.post("/orders/otp/send", { email, lang: language });
      setStep(2);
    } catch (err: unknown) {
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
      setStep(3);
    } catch (err: unknown) {
      showToast(t("lookup.otp_invalid"), "error");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenPaymentModal = (order: any) => {
    setPaymentModalOrder(order);
  };

  const handleClosePaymentModal = () => {
    setPaymentModalOrder(null);
  };

  /**
   * Initiates repayment / payment method change for pending orders.
   */
  const handleRepay = async (order: { id: number | string; email?: string; payment_method?: string }, newMethod?: string) => {
    setLoading(true);
    try {
      const res = await API.post(`/orders/${order.id}/repay`, {
        email: order.email || email,
        new_payment_method: newMethod || order.payment_method
      });
      if (res.data.payUrl) {
        window.location.href = res.data.payUrl;
      } else {
        showToast(res.data.message || t("lookup.payment_updated"), "success");
        setPaymentModalOrder(null);
        if (email && otp) {
          try {
            const refreshRes = await API.post("/orders/otp/verify", { email, code: otp });
            if (refreshRes.data?.orders) setOrders(refreshRes.data.orders);
          } catch {
            // Ignore OTP re-verification error on background refresh
          }
        }
      }
    } catch (err: unknown) {
      const axErr = err as AxiosErr;
      showToast(axErr.response?.data?.message || t("lookup.payment_error"), "error");
    } finally {
      setLoading(false);
    }
  };

  /**
   * Opens the return form for a specific order.
   */
  const openReturnForm = (order: { id: number | string; items?: any[] }) => {
    setSelectedOrder(order);
    const initialSelectedItems: Record<number, { selected: boolean; return_quantity: number }> = {};
    if (order?.items) {
      order.items.forEach((item: any) => {
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
    setLoading(true);

    try {
      // 1. Create an empty FormData object
      const formData = new FormData();

      // 2. Append text data fields
      formData.append("reason_code", returnForm.reason_code);
      formData.append("description", returnForm.description);
      formData.append("email", email); // Required to authenticate Guest

      // Build returnItems list
      const returnItems: { order_item_id: number; return_quantity: number }[] = [];
      if (returnForm.selectedItems) {
        Object.entries(returnForm.selectedItems).forEach(([itemIdStr, val]: [string, any]) => {
          const qty = Number(val.return_quantity) || 1;
          if (val.selected && qty > 0) {
            returnItems.push({
              order_item_id: Number(itemIdStr),
              return_quantity: qty
            });
          }
        });
      }

      if (returnItems.length === 0) {
        showToast(t("lookup.no_items_selected_err", "Vui lòng chọn ít nhất 1 sản phẩm để trả."), "warning");
        setLoading(false);
        return;
      }

      formData.append("returnItems", JSON.stringify(returnItems));

      // 3. Package bank info into JSON string and append
      const refund_bank_info = {
        name: returnForm.bank_name,
        acc: returnForm.bank_acc,
        owner: returnForm.bank_owner
      };
      formData.append("refund_bank_info", JSON.stringify(refund_bank_info));

      // 4. IMPORTANT: Iterate through images array and append each file to FormData
      if (returnForm.images && returnForm.images.length > 0) {
        returnForm.images.forEach((file) => {
          formData.append("images", file);
        });
      }

      // 5. Send API request with FormData
      await API.post(`/orders/${selectedOrder.id}/return`, formData);

      // 6. Update UI (Hide the Return button)
      setOrders(prevOrders =>
        prevOrders.map(order => {
          if (order.id === selectedOrder.id) {
            return {
              ...order,
              status: 'Return Requested',
              return_request: { id: 'pending' } // optimistic: show "processing" message
            };
          }
          return order;
        })
      );

      // 7. Reset form and show success message
      showToast(t("lookup.return_success"), "success");
      setStep(3); // Return to order list
      setSelectedOrder(null);
      setReturnForm({
        reason_code: "",
        description: "",
        bank_name: "",
        bank_acc: "",
        bank_owner: "",
        images: [] // Reset image array
      });

    } catch (err: unknown) {
      const axErr = err as AxiosErr;
      console.error("Error submitting return request:", err);
      showToast(axErr.response?.data?.message || t("lookup.return_error"), "error");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelReturn = async (orderId: number | string) => {
    if (!window.confirm(t("lookup.cancel_return_confirm"))) return;
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      await API.delete(`/orders/${orderId}/return`, {
        data: { email },
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      showToast(t("lookup.return_cancelled"), "success");
      setOrders((prevOrders: any[]) =>
        prevOrders.map((order) =>
          order.id === orderId
            ? { ...order, status: "Delivered", return_request: null }
            : order
        )
      );
    } catch (err: unknown) {
      const axErr = err as AxiosErr;
      showToast(axErr.response?.data?.message || t("lookup.cancel_return_error"), "error");
    } finally {
      setLoading(false);
    }
  };

  /**
   * Formats a number into Vietnamese Dong currency format.
   */
  const formatCurrency = (val: number | string) => formatCurrencyUtil(val, language);

  // Reset function to go back to the very beginning
  const resetLookup = () => {
    setStep(1);
    setOrders([]);
    setOtp("");
    setEmail("");
  };

  return {
    state: {
      step, email, otp, orders, loading, expandedOrder, selectedOrder, returnForm, paymentModalOrder
    },
    actions: {
      setStep, setEmail, setOtp, setReturnForm,
      toggleOrder, handleSendOtp, handleVerifyOtp, handleOpenPaymentModal, handleClosePaymentModal, handleRepay, openReturnForm, handleReturnSubmit, handleCancelReturn, resetLookup
    },
    helpers: {
      formatCurrency
    }
  };
}

