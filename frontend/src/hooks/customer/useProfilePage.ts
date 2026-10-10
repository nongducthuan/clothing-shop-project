import { useState, useEffect, useMemo } from "react";
import { AuthContext } from "../../context/AuthContext.tsx";
import { useNavigate, useSearchParams } from "react-router-dom";
import { getImageUrl } from "../../utils/imageUtils";
import { useToast } from "../../context/ToastContext";
import { useLanguage } from "../../context/LanguageContext";
import { formatCurrency as formatCurrencyUtil } from "../../utils/currencyUtils";
import { TIER_CONFIG } from "../../constants/tierConfig";
import { useBuyAgain } from "./useBuyAgain";
import { useOrderActions } from "./useOrderActions";
import { useProfileSettings } from "./useProfileSettings";
import { useProfileOrders } from "./useProfileOrders";
import { useRequiredContext } from "../useRequiredContext";
import { useReturnRequestForm } from "./useReturnRequestForm";
import type { ProfileOrder } from "./profileTypes";

/**
 * Trang Profile của khách. Hook này chỉ ghép các hook con lại:
 * - useProfileSettings    : cập nhật số điện thoại + đổi mật khẩu
 * - useProfileOrders      : danh sách đơn hàng
 * - useReturnRequestForm  : modal + form đổi trả
 * - useBuyAgain / useOrderActions: mua lại, huỷ đơn, thanh toán lại (dùng chung với trang tra cứu)
 * và giữ phần điều phối: tab đang mở, kết quả thanh toán trả về từ cổng, tiến độ hạng thành viên.
 */
export function useProfilePage() {
  const { showToast } = useToast();
  const { t, language } = useLanguage();
  const { user, logout, tier, refreshUser } = useRequiredContext(AuthContext, 'AuthContext');
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const activeTab = searchParams.get("tab") === "orders" ? "orders" : "info";
  const setActiveTab = (tab: string) => {
    setSearchParams({ tab });
  };

  const { orders, setOrders, loadingOrders, selectedOrder, setSelectedOrder, fetchOrders } =
    useProfileOrders(Boolean(user) && activeTab === "orders");

  const returnForm = useReturnRequestForm(orders as ProfileOrder[], () => { fetchOrders(); });

  const [paymentModalOrder, setPaymentModalOrder] = useState<ProfileOrder | null>(null);
  const [repayLoading, setRepayLoading] = useState(false);

  const [cancellingOrderId, setCancellingOrderId] = useState<number | null>(null);

  const [buyingAgainId, setBuyingAgainId] = useState<number | null>(null);

  // Cập nhật số điện thoại + đổi mật khẩu
  const settings = useProfileSettings();

  const currentConfig = TIER_CONFIG[tier as keyof typeof TIER_CONFIG] || TIER_CONFIG.Normal;
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

  // Buy Again + các thao tác trên đơn (dùng chung với trang tra cứu đơn của guest)
  const {
    buyAgainSuggestions, handleBuyAgain, handleConfirmBuyAgainSubstitutions, handleCloseBuyAgainModal,
  } = useBuyAgain<ProfileOrder>((order) => setBuyingAgainId(order ? order.id : null));

  const { handleRepay, handleCancelReturn, handleCancelOrder } = useOrderActions({
    setOrders,
    setRepayBusy: setRepayLoading,
    setCancelOrderBusy: (orderId) => setCancellingOrderId(orderId as number | null),
    onOrderChanged: () => { fetchOrders(); },
    // Sau repay không redirect: đóng modal rồi tải lại danh sách đơn
    onRepaySuccess: () => {
      setPaymentModalOrder(null);
      fetchOrders();
    },
    messages: {
      repaySuccess: t("profile.repay_success", "Cập nhật phương thức thanh toán thành công!"),
      repayError: t("profile.repay_error", "Không thể xử lý yêu cầu thanh toán lúc này."),
    },
  });

  const handleOpenPaymentModal = (order: ProfileOrder) => {
    setPaymentModalOrder(order);
  };

  const handleClosePaymentModal = () => {
    setPaymentModalOrder(null);
  };

  const formatCurrency = (val: string | number | null | undefined) => formatCurrencyUtil(val, language);
  const getImgUrl = (path: string | null | undefined) => getImageUrl(path);

  return {
    state: {
      user, tier, phone: settings.phone, activeTab, orders, loadingOrders, selectedOrder,
      showReturnModal: returnForm.showReturnModal, returnOrderId: returnForm.returnOrderId,
      returnOrder: returnForm.returnOrder, returnData: returnForm.returnData,
      currentConfig, totalSpent, safeProgress,
      currentPassword: settings.currentPassword, newPassword: settings.newPassword,
      confirmPassword: settings.confirmPassword, isChangingPassword: settings.isChangingPassword,
      paymentModalOrder, repayLoading, cancellingOrderId, buyingAgainId, buyAgainSuggestions
    },
    actions: {
      setActiveTab, setPhone: settings.setPhone, logout, setSelectedOrder,
      handleOpenPaymentModal, handleClosePaymentModal, handleRepay,
      handleOpenReturnModal: returnForm.handleOpenReturnModal,
      setShowReturnModal: returnForm.setShowReturnModal,
      handleSubmitReturn: returnForm.handleSubmitReturn,
      handleCancelReturn,
      handleReturnDataChange: returnForm.handleReturnDataChange,
      updateProfile: settings.updateProfile,
      handleCancelOrder, handleBuyAgain, handleConfirmBuyAgainSubstitutions, handleCloseBuyAgainModal,
      setCurrentPassword: settings.setCurrentPassword, setNewPassword: settings.setNewPassword,
      setConfirmPassword: settings.setConfirmPassword, changePassword: settings.changePassword
    },
    helpers: {
      formatCurrency, getImgUrl
    }
  };
}
