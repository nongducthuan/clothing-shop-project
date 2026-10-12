import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ModernStatusBadge, PaymentStatusBadge } from "./OrderBadges";
import OrderDetailHeader from "./order-detail/OrderDetailHeader";
import OrderDetailReturnInfo from "./order-detail/OrderDetailReturnInfo";
import OrderDetailItems from "./order-detail/OrderDetailItems";
import OrderDetailSummary from "./order-detail/OrderDetailSummary";
import OrderDetailActions from "./order-detail/OrderDetailActions";
import { useLanguage } from "../../../context/LanguageContext";
import { useToast } from "../../../context/ToastContext";
import { CartContext } from "../../../context/CartContext.tsx";
import { buyAgainFromOrder, applySubstitutions, SubstitutionSuggestion, VariantChoice } from "../../../utils/buyAgainUtils";
import BuyAgainVariantModal from "../common/BuyAgainVariantModal";
import { useRequiredContext } from "../../../hooks/useRequiredContext";
import { useAutoCancelCountdown } from "../../../hooks/useAutoCancelCountdown";
import type { ProfileOrder } from "../../../hooks/customer/profileTypes";

export default function OrderDetailModal({ order, onClose, onOpenPaymentModal, actions, state, helpers }: {
  order: ProfileOrder | null; onClose: () => void; onOpenPaymentModal?: (order: ProfileOrder) => void;
  actions: { handleCancelOrder: (id: number) => void; handleOpenReturnModal: (order: ProfileOrder) => void; handleCancelReturn: (id: number) => void };
  state: { cancellingOrderId: number | null; buyingAgainId?: number | null };
  helpers: { formatCurrency: (amount: number | string | null | undefined) => string; getImgUrl: (path: string | null | undefined) => string };
}) {
  const { t } = useLanguage();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const { setCart } = useRequiredContext(CartContext, 'CartContext');
  const [buyingAgain, setBuyingAgain] = useState(false);
  const [substitutions, setSubstitutions] = useState<SubstitutionSuggestion[] | null>(null);

  // Countdown for Pending+Unpaid online orders (hook must be called unconditionally)
  const isOnlinePendingUnpaid =
    order?.payment_status === "Unpaid" &&
    order?.status === "Pending" &&
    ["momo", "vnpay"].includes(order?.payment_method ?? "");
  const countdown = useAutoCancelCountdown(isOnlinePendingUnpaid ? order?.created_at : null);

  if (!order) return null;
  const { formatCurrency, getImgUrl } = helpers;

  // "Buy Again": re-add this order's items (current prices/stock) into the cart
  const handleBuyAgain = async () => {
    if (!order) return;
    setBuyingAgain(true);
    try {
      const summary = await buyAgainFromOrder(order as Parameters<typeof buyAgainFromOrder>[0], setCart);
      if (summary.addedCount > 0) {
        if (summary.skippedNames.length > 0) {
          showToast(t("orders.buy_again_partial").replace("{count}", String(summary.addedCount)).replace("{skipped}", summary.skippedNames.join(", ")), "warning");
        } else {
          showToast(t("orders.buy_again_success").replace("{count}", String(summary.addedCount)), "success");
        }
      }
      if (summary.substitutions.length > 0) {
        // Mở modal cho khách chọn variant thay thế — điều hướng giỏ hàng sau khi xác nhận
        setSubstitutions(summary.substitutions);
        return;
      }
      if (summary.addedCount === 0) {
        showToast(summary.skippedNames.length ? t("orders.buy_again_none") : t("orders.buy_again_empty"), "warning");
        return;
      }
      onClose();
      navigate("/cart");
    } catch (error) {
      console.error("Buy again error:", error);
      showToast(t("orders.buy_again_none"), "error");
    } finally {
      setBuyingAgain(false);
    }
  };

  // Xác nhận các variant thay thế đã chọn trong BuyAgainVariantModal
  const handleConfirmSubstitutions = (selections: Array<{ suggestion: SubstitutionSuggestion; choice: VariantChoice }>) => {
    applySubstitutions(setCart, selections);
    if (selections.length > 0) {
      showToast(t("orders.buy_again_substituted", "Đã thêm sản phẩm thay thế vào giỏ hàng"), "success");
    }
    setSubstitutions(null);
    onClose();
    navigate("/cart");
  };

  return (
    <>
    <div
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 w-full max-w-md sm:max-w-xl rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >

        <OrderDetailHeader order={order} onClose={onClose} />

        <div className="p-4 sm:p-6 overflow-y-auto custom-scrollbar space-y-5 sm:space-y-6">

          <div className="flex flex-wrap gap-2 items-center">
            <ModernStatusBadge status={order.status} />
            <PaymentStatusBadge status={order.payment_status ?? "Unpaid"} orderStatus={order.status} />
          </div>

          <OrderDetailReturnInfo order={order} formatCurrency={formatCurrency} getImgUrl={getImgUrl} />

          <OrderDetailItems order={order} formatCurrency={formatCurrency} getImgUrl={getImgUrl} />

          <OrderDetailSummary order={order} formatCurrency={formatCurrency} />

          <OrderDetailActions
            order={order}
            onClose={onClose}
            onOpenPaymentModal={onOpenPaymentModal}
            actions={actions}
            state={state}
            isOnlinePendingUnpaid={isOnlinePendingUnpaid}
            countdown={countdown}
            handleBuyAgain={handleBuyAgain}
            buyingAgain={buyingAgain}
          />

        </div>
      </div>
    </div>

      {substitutions && substitutions.length > 0 && (
        <BuyAgainVariantModal
          substitutions={substitutions}
          onConfirm={handleConfirmSubstitutions}
          onClose={() => setSubstitutions(null)}
        />
      )}
    </>
  );
}
