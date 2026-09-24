import { useState, useEffect, useContext, useMemo } from "react";
import { AuthContext } from "../../context/AuthContext.tsx";
import { useNavigate, useSearchParams } from "react-router-dom";
import API from "../../services/apiClient.ts";
import { getImageUrl } from "../../utils/imageUtils";
import { useToast } from "../../context/ToastContext";
import { useLanguage } from "../../context/LanguageContext";
import { formatCurrency as formatCurrencyUtil } from "../../utils/currencyUtils";
import { getPromotionBuyProductIds, isPromotionBuyItem } from "../../utils/promotionUtils";
import { CartContext } from "../../context/CartContext.tsx";
import { buyAgainFromOrder, applySubstitutions, SubstitutionSuggestion, VariantChoice } from "../../utils/buyAgainUtils";

const TIER_CONFIG = {
  Normal: { next: 5000000, color: "text-slate-400", bg: "bg-slate-100", icon: "fa-shield-halved", label: "Bronze" },
  Bronze: { next: 10000000, color: "text-orange-500", bg: "bg-orange-100", icon: "fa-medal", label: "Silver" },
  Silver: { next: 15000000, color: "text-zinc-400", bg: "bg-zinc-100", icon: "fa-award", label: "Gold" },
  Gold: { next: 20000000, color: "text-yellow-500", bg: "bg-yellow-100", icon: "fa-crown", label: "Diamond" },
  Diamond: { next: null, color: "text-cyan-500", bg: "bg-cyan-100", icon: "fa-gem", label: "Maximum" },
};

type AxiosErr = { response?: { data?: { message?: string } } };

interface ProfileOrderItem {
  id: number;
  product_id?: number;
  is_gift?: boolean;
  quantity?: number;
  [key: string]: unknown;
}

interface ProfileOrder {
  id: number;
  status: string;
  email?: string;
  items?: ProfileOrderItem[];
  payment_status?: string;
  return_request?: unknown;
  [key: string]: unknown;
}

type ReturnDataState = {
  reason: string;
  note: string;
  bankName: string;
  bankNumber: string;
  accountHolder: string;
  images: File[];
  selectedItems: Record<number, { selected: boolean; return_quantity: number }>;
};

type ReturnItemVal = { selected: boolean; return_quantity: number | string };

const INITIAL_RETURN_DATA: ReturnDataState = {
  reason: "",
  note: "",
  bankName: "",
  bankNumber: "",
  accountHolder: "",
  images: [],
  selectedItems: {},
};

export function useProfilePage() {
  const { showToast } = useToast();
  const { t, language } = useLanguage();
  const { user, logout, tier, refreshUser } = useContext(AuthContext);
  const { setCart } = useContext(CartContext);
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const activeTab = searchParams.get("tab") === "orders" ? "orders" : "info";
  const setActiveTab = (tab: string) => {
    setSearchParams({ tab });
  };

  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [phone, setPhone] = useState(user?.phone || "");

  const [showReturnModal, setShowReturnModal] = useState(false);
  const [returnOrderId, setReturnOrderId] = useState(null);
  const [returnOrder, setReturnOrder] = useState<ProfileOrder | null>(null);
  const [returnData, setReturnData] = useState<ReturnDataState>({
    ...INITIAL_RETURN_DATA,
    selectedItems: {}
  });

  const [paymentModalOrder, setPaymentModalOrder] = useState(null);
  const [repayLoading, setRepayLoading] = useState(false);

  // Cancel Order State (track which order is being cancelled to disable its button)
  const [cancellingOrderId, setCancellingOrderId] = useState<number | null>(null);

  // Buy Again State (track which order is being re-added to the cart)
  const [buyingAgainId, setBuyingAgainId] = useState<number | null>(null);

  // Buy Again substitution suggestions (variant replacement modal)
  const [buyAgainSuggestions, setBuyAgainSuggestions] = useState<SubstitutionSuggestion[] | null>(null);

  const currentConfig = TIER_CONFIG[tier] || TIER_CONFIG.Normal;
  const totalSpent = Number(user?.total_spent || 0);
  const safeProgress = useMemo(() => {
    const rawProgress = currentConfig.next ? (totalSpent / currentConfig.next) * 100 : 100;
    return Math.min(rawProgress, 100);
  }, [totalSpent, currentConfig.next]);

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }

    refreshUser();

    const paymentResult = searchParams.get("resultCode");
    if (paymentResult) {
      if (paymentResult === "0") {
        showToast(t("profile.order_paid"), "success");
        fetchOrders(); // Refresh orders to show 'Paid' status
      } else {
        showToast(t("profile.payment_failed"), "error");
      }
      const newParams = new URLSearchParams(searchParams);
      newParams.delete("resultCode");
      setSearchParams(newParams);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, navigate]);

  const [hasFetchedOrders, setHasFetchedOrders] = useState(false);

  useEffect(() => {
    if (user && activeTab === "orders" && !hasFetchedOrders) {
      fetchOrders();
    }
  }, [activeTab, user, hasFetchedOrders]);

  const fetchOrders = async () => {
    setLoadingOrders(true);
    setHasFetchedOrders(true);
    try {
      const token = localStorage.getItem("token");
      const response = await API.get("/orders", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setOrders(response.data);
    } catch (error) {
      console.error("Order Fetch Error:", error);
    } finally {
      setLoadingOrders(false);
    }
  };

  const handleOpenPaymentModal = (order: ProfileOrder) => {
    setPaymentModalOrder(order);
  };

  const handleClosePaymentModal = () => {
    setPaymentModalOrder(null);
  };

  const handleRepay = async (order: ProfileOrder, newMethod?: string) => {
    setRepayLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await API.post(
        `/orders/${order.id}/repay`,
        { email: order.email, new_payment_method: newMethod || order.payment_method },
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      );

      if (response.data?.payUrl) {
        window.location.href = response.data.payUrl;
      } else {
        showToast(response.data?.message || "Payment method updated successfully!", "success");
        setPaymentModalOrder(null);
        fetchOrders();
      }
    } catch (error: unknown) {
      console.error("Repay error:", error);
      const err = error as AxiosErr;
      showToast(err.response?.data?.message || "Unable to process payment request right now.", "error");
    } finally {
      setRepayLoading(false);
    }
  };

  const handleOpenReturnModal = (orderOrId: ProfileOrder | number) => {
    const targetOrder = typeof orderOrId === 'object' ? orderOrId : (orders as ProfileOrder[]).find((o) => o.id === orderOrId);
    const orderId = targetOrder ? targetOrder.id : orderOrId;

    setReturnOrderId(orderId);
    setReturnOrder(targetOrder || null);

    // Initial selectedItems: select all non-gift items by default
    const initialSelectedItems: Record<number, { selected: boolean; return_quantity: number }> = {};
    if (targetOrder?.items) {
      targetOrder.items.forEach((item: ProfileOrderItem) => {
        initialSelectedItems[item.id] = {
          selected: !item.is_gift,
          return_quantity: item.quantity || 1
        };
      });
    }

    setReturnData({
      ...INITIAL_RETURN_DATA,
      selectedItems: initialSelectedItems
    });
    setShowReturnModal(true);
  };

  const handleSubmitReturn = async () => {
    const { bankName, bankNumber, accountHolder, reason, note, images, selectedItems } = returnData;

    if (!bankName || !bankNumber || !accountHolder) {
      showToast(t("profile.fill_bank"), "warning");
      return;
    }

    if (!reason) {
      showToast(t("lookup.no_reason_selected_err", "Vui lòng chọn lý do đổi trả."), "warning");
      return;
    }

    if (!note || !String(note).trim()) {
      showToast(t("lookup.desc_required_err", "Vui lòng mô tả chi tiết vấn đề."), "warning");
      return;
    }

    const currentOrder = returnOrder || (orders as ProfileOrder[]).find((o) => o.id === returnOrderId);
    if (!currentOrder?.email) {
      showToast(t("profile.order_email_not_found"), "error");
      return;
    }

    // Build returnItems list
    const buyProductIds = getPromotionBuyProductIds(currentOrder?.items);
    const returnItems: { order_item_id: number; return_quantity: number }[] = [];
    if (selectedItems) {
      Object.entries(selectedItems).forEach(([itemIdStr, val]: [string, ReturnItemVal]) => {
        if (val.selected) {
          // Chỉ sản phẩm X của Buy X Get Y mới bắt buộc hoàn trả toàn bộ số lượng
          const itemInOrder = (currentOrder?.items || [] as ProfileOrderItem[]).find((i) => i.id === Number(itemIdStr));
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
      return;
    }

    const formData = new FormData();
    formData.append("reason_code", reason);
    formData.append("description", note);
    formData.append("email", currentOrder.email);
    formData.append("bankInfo", JSON.stringify({ name: bankName, acc: bankNumber, owner: accountHolder }));
    formData.append("returnItems", JSON.stringify(returnItems));

    if (images?.length > 0) {
      Array.from(images).forEach((file) => formData.append("images", file));
    }

    try {
      const response = await API.post(
        `/orders/${returnOrderId}/return`,
        formData,
        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
      );

      if (response.status === 200 || response.status === 201) {
        showToast(t("profile.return_submitted"), "success");
        setShowReturnModal(false);
        fetchOrders();
      }
    } catch (error: unknown) {
      console.error("Connection error:", error);
      const err = error as AxiosErr;
      showToast(err.response?.data?.message || t("profile.connect_error"), "error");
    }
  };

  const handleCancelReturn = async (orderId: number) => {
    if (!window.confirm(t("lookup.cancel_return_confirm"))) return;
    try {
      const token = localStorage.getItem("token");
      await API.delete(`/orders/${orderId}/return`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      showToast(t("lookup.return_cancelled"), "success");
      setOrders((prevOrders: ProfileOrder[]) =>
        prevOrders.map((order) =>
          order.id === orderId
            ? { ...order, status: "Delivered", return_request: null }
            : order
        )
      );
      fetchOrders();
    } catch (error: unknown) {
      const err = error as AxiosErr;
      showToast(err.response?.data?.message || t("lookup.cancel_return_error"), "error");
    }
  };

  // Customer cancels their own order (allowed only while Pending/Confirmed)
  // Backend handles: stock restore, revenue guard, and marks 'Refunded' for paid online orders
  const handleCancelOrder = async (orderId: number) => {
    if (!window.confirm(t("lookup.cancel_order_confirm"))) return;
    setCancellingOrderId(orderId);
    try {
      const token = localStorage.getItem("token");
      const res = await API.put(
        "/orders/status",
        { order_id: orderId, new_status: "Cancelled" },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data?.payment_status === "Refunded") {
        showToast(t("lookup.cancel_order_refund_note"), "success");
      } else {
        showToast(t("lookup.cancel_order_success"), "success");
      }
      setOrders((prevOrders: ProfileOrder[]) =>
        prevOrders.map((o) =>
          o.id === orderId
            ? { ...o, status: "Cancelled", payment_status: res.data?.payment_status || o.payment_status }
            : o
        )
      );
      fetchOrders();
    } catch (error: unknown) {
      const err = error as AxiosErr;
      showToast(err.response?.data?.message || t("lookup.cancel_order_error"), "error");
    } finally {
      setCancellingOrderId(null);
    }
  };

  // "Buy Again": re-add this order's items (current prices/stock) into the cart
  const handleBuyAgain = async (order: ProfileOrder) => {
    setBuyingAgainId(order.id);
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
      setBuyingAgainId(null);
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

  const handleReturnDataChange = (field, value) => setReturnData((prev) => ({ ...prev, [field]: value }));
  const formatCurrency = (val) => formatCurrencyUtil(val, language);
  const getImgUrl = (path) => getImageUrl(path);

  const updateProfile = async () => {
    try {
      const token = localStorage.getItem("token");
      await API.put(
        "/auth/profile",
        { phone },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      showToast(t("profile.profile_updated"), "success");
      refreshUser();
    } catch (error) {
      console.error("Update profile error:", error);
      showToast(t("profile.update_failed") + (error.response?.data?.message || ""), "error");
    }
  };

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const changePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      showToast(t("profile.fill_password"), "warning");
      return;
    }
    if (newPassword.length < 6) {
      showToast(t("profile.password_too_short"), "warning");
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast(t("profile.password_mismatch"), "warning");
      return;
    }

    setIsChangingPassword(true);
    try {
      const token = localStorage.getItem("token");
      await API.put(
        "/auth/password",
        { currentPassword, newPassword },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      showToast(t("profile.password_changed"), "success");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      console.error("Change password error:", error);
      showToast(error.response?.data?.message || t("profile.password_failed"), "error");
    } finally {
      setIsChangingPassword(false);
    }
  };

  return {
    state: {
      user, tier, phone, activeTab, orders, loadingOrders, selectedOrder,
      showReturnModal, returnOrderId, returnOrder, returnData, currentConfig, totalSpent, safeProgress,
      currentPassword, newPassword, confirmPassword, isChangingPassword,
      paymentModalOrder, repayLoading, cancellingOrderId, buyingAgainId, buyAgainSuggestions
    },
    actions: {
      setActiveTab, setPhone, logout, setSelectedOrder,
      handleOpenPaymentModal, handleClosePaymentModal, handleRepay,
      handleOpenReturnModal, setShowReturnModal,
      handleSubmitReturn, handleCancelReturn, handleReturnDataChange, updateProfile,
      handleCancelOrder, handleBuyAgain, handleConfirmBuyAgainSubstitutions, handleCloseBuyAgainModal,
      setCurrentPassword, setNewPassword, setConfirmPassword, changePassword
    },
    helpers: {
      formatCurrency, getImgUrl
    }
  };
}
