import { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../services/apiClient";
import { useToast } from "../../context/ToastContext";
import { useLanguage } from "../../context/LanguageContext";
import { formatCurrency as formatCurrencyUtil } from "../../utils/currencyUtils";
import { getPromotionBuyProductIds, isPromotionBuyItem } from "../../utils/promotionUtils";
import { CartContext } from "../../context/CartContext";
import { buyAgainFromOrder, applySubstitutions, SubstitutionSuggestion, VariantChoice } from "../../utils/buyAgainUtils";
import type { ReturnFormData } from "../../components/customer/order-lookup/ReturnFormStep";

type AxiosErr = { response?: { data?: { message?: string } } };

interface LookupOrderItem {
  id: number;
  product_id?: number;
  is_gift?: boolean;
  quantity?: number;
  product_name?: string;
  product_name_vi?: string;
  product_name_en?: string;
  color_name?: string;
  color_name_vi?: string;
  color_name_en?: string;
  color?: string;
  size?: string;
  payable_amount?: number | string | null;
  price?: number;
  [key: string]: unknown;
}

interface LookupOrder {
  id: number | string;
  status?: string;
  email?: string;
  items?: LookupOrderItem[];
  payment_status?: string;
  return_request?: unknown;
  payment_method?: string;
  [key: string]: unknown;
}

type ReturnItemVal = { selected: boolean; return_quantity: number | string };

interface OptimisticReturnItem {
  order_item_id: number;
  return_quantity: number;
  refund_amount: number;
  product_name?: string | null;
  product_name_vi?: string | null;
  product_name_en?: string | null;
  color_name?: string | null;
  color_name_vi?: string | null;
  color_name_en?: string | null;
  size?: string | null;
  is_gift: boolean;
}

export function useOrderLookup() {
  const { showToast } = useToast();
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const { setCart } = useContext(CartContext);
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [paymentModalOrder, setPaymentModalOrder] = useState<LookupOrder | null>(null);

  // Buy Again substitution suggestions (variant replacement modal)
  const [buyAgainSuggestions, setBuyAgainSuggestions] = useState<SubstitutionSuggestion[] | null>(null);
  const [returnForm, setReturnForm] = useState<ReturnFormData>({
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

  const handleOpenPaymentModal = (order: LookupOrder) => {
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
  const openReturnForm = (order: LookupOrder) => {
    setSelectedOrder(order);
    const initialSelectedItems: Record<number, { selected: boolean; return_quantity: number }> = {};
    if (order?.items) {
      order.items.forEach((item: LookupOrderItem) => {
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
      const buyProductIds = getPromotionBuyProductIds(selectedOrder?.items);
      const returnItems: { order_item_id: number; return_quantity: number }[] = [];
      if (returnForm.selectedItems) {
        Object.entries(returnForm.selectedItems).forEach(([itemIdStr, val]: [string, ReturnItemVal]) => {
          if (val.selected) {
            // Chỉ sản phẩm X của Buy X Get Y mới bắt buộc hoàn trả toàn bộ số lượng
            const itemInOrder = (selectedOrder?.items || [] as LookupOrderItem[]).find((i) => i.id === Number(itemIdStr));
            const qty = isPromotionBuyItem(itemInOrder, buyProductIds)
              ? (itemInOrder?.quantity || Number(val.return_quantity) || 1)
              : (Number(val.return_quantity) || 1);
            if (qty > 0) {
              returnItems.push({
                order_item_id: Number(itemIdStr),
                return_quantity: qty
              });
            }
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
      if (selectedOrder) {
        await API.post(`/orders/${selectedOrder.id}/return`, formData);
      }

      // 6. Update UI (Hide the Return button)
      // Build optimistic return_request đầy đủ (giống profile sau fetchOrders)
      // để box "Thông tin yêu cầu đổi trả" hiện ngay, không phải chờ verify OTP lại.
      const optimisticItems: OptimisticReturnItem[] = [];
      let optimisticRefund = 0;
      const orderItems = selectedOrder?.items || [];
      returnItems.forEach((ri: { order_item_id: number; return_quantity: number }) => {
        const orderItem = (orderItems as LookupOrderItem[]).find((i) => i.id === Number(ri.order_item_id));
        if (!orderItem || orderItem.is_gift) return;
        const qty = Number(orderItem.quantity) || 1;
        const unitPayable = orderItem.payable_amount !== null && orderItem.payable_amount !== undefined && orderItem.payable_amount !== ''
          ? (Number(orderItem.payable_amount) || 0) / qty
          : (Number(orderItem.price) || 0);
        const itemRefund = Math.round(unitPayable * Number(ri.return_quantity) * 100) / 100;
        optimisticRefund += itemRefund;
        optimisticRefund = Math.round(optimisticRefund * 100) / 100;
        optimisticItems.push({
          order_item_id: orderItem.id,
          return_quantity: ri.return_quantity,
          refund_amount: itemRefund,
          product_name: orderItem.product_name ?? null,
          product_name_vi: orderItem.product_name_vi ?? null,
          product_name_en: orderItem.product_name_en ?? null,
          color_name: orderItem.color_name ?? orderItem.color ?? null,
          color_name_vi: orderItem.color_name_vi ?? null,
          color_name_en: orderItem.color_name_en ?? null,
          size: orderItem.size ?? null,
          is_gift: false,
        });
      });
      setOrders(prevOrders =>
        prevOrders.map(order => {
          if (order.id === selectedOrder.id) {
            return {
              ...order,
              status: 'Return Requested',
              return_request: {
                id: 'pending',
                status: 'Pending',
                reason_code: returnForm.reason_code,
                description: returnForm.description,
                admin_response: null,
                refund_amount: optimisticRefund,
                items: optimisticItems,
              }
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
      setOrders((prevOrders: LookupOrder[]) =>
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
   * Guest cancels an order (allowed only while Pending/Confirmed).
   * Backend verifies ownership via email and handles stock/revenue/refund flags.
   */
  const handleCancelOrder = async (orderId: number | string) => {
    if (!window.confirm(t("lookup.cancel_order_confirm"))) return;
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await API.put(
        "/orders/status",
        { order_id: orderId, new_status: "Cancelled", email },
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      );
      if (res.data?.payment_status === "Refunded") {
        showToast(t("lookup.cancel_order_refund_note"), "success");
      } else {
        showToast(t("lookup.cancel_order_success"), "success");
      }
      setOrders((prevOrders: LookupOrder[]) =>
        prevOrders.map((order) =>
          order.id === orderId
            ? { ...order, status: "Cancelled", payment_status: res.data?.payment_status || order.payment_status }
            : order
        )
      );
    } catch (err: unknown) {
      const axErr = err as AxiosErr;
      showToast(axErr.response?.data?.message || t("lookup.cancel_order_error"), "error");
    } finally {
      setLoading(false);
    }
  };

  /**
   * Formats a number into Vietnamese Dong currency format.
   */
  const formatCurrency = (val: number | string) => formatCurrencyUtil(val, language);

  /**
   * "Buy Again": re-add the order's non-gift items (current prices/stock) into
   * the cart and navigate to the cart page.
   */
  const handleBuyAgain = async (order: LookupOrder) => {
    setLoading(true);
    try {
      const summary = await buyAgainFromOrder(order as Parameters<typeof buyAgainFromOrder>[0], setCart);
      if (summary.addedCount > 0) {
        if (summary.skippedNames.length > 0) {
          showToast(
            t("orders.buy_again_partial").replace("{count}", String(summary.addedCount)).replace("{skipped}", summary.skippedNames.join(", ")),
            "warning"
          );
        } else {
          showToast(t("orders.buy_again_success").replace("{count}", String(summary.addedCount)), "success");
        }
      }
      if (summary.substitutions.length > 0) {
        // Mở modal cho khách chọn variant thay thế — điều hướng giỏ hàng sau khi xác nhận
        setBuyAgainSuggestions(summary.substitutions);
        return;
      }
      if (summary.addedCount === 0) {
        showToast(summary.skippedNames.length ? t("orders.buy_again_none") : t("orders.buy_again_empty"), "warning");
        return;
      }
      navigate("/cart");
    } catch (error) {
      console.error("Buy again error:", error);
      showToast(t("orders.buy_again_none"), "error");
    } finally {
      setLoading(false);
    }
  };

  // Xác nhận các variant thay thế đã chọn trong BuyAgainVariantModal
  const handleConfirmBuyAgainSubstitutions = (selections: Array<{ suggestion: SubstitutionSuggestion; choice: VariantChoice }>) => {
    applySubstitutions(setCart, selections);
    if (selections.length > 0) {
      showToast(t("orders.buy_again_substituted", "Đã thêm sản phẩm thay thế vào giỏ hàng"), "success");
    }
    setBuyAgainSuggestions(null);
    navigate("/cart");
  };

  const handleCloseBuyAgainModal = () => setBuyAgainSuggestions(null);

  // Reset function to go back to the very beginning
  const resetLookup = () => {
    setStep(1);
    setOrders([]);
    setOtp("");
    setEmail("");
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

