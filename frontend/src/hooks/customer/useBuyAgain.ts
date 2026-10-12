import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "../../context/ToastContext";
import { useLanguage } from "../../context/LanguageContext";
import { CartContext } from "../../context/CartContext";
import { buyAgainFromOrder, applySubstitutions, SubstitutionSuggestion, VariantChoice } from "../../utils/buyAgainUtils";
import { useRequiredContext } from "../useRequiredContext";

/**
 * "Buy Again": thêm lại các sản phẩm (không phải quà) của đơn vào giỏ với giá/tồn kho hiện tại
 * rồi chuyển tới trang giỏ hàng. Dùng chung cho tra cứu đơn (guest) và trang profile.
 *
 * @param setBusyOrder  Báo cho màn hình biết đơn nào đang xử lý (null = xong).
 *                      Guest: bật/tắt `loading`; Profile: lưu `buyingAgainId`.
 */
export function useBuyAgain<T extends { id: number | string }>(setBusyOrder: (order: T | null) => void) {
  const { showToast } = useToast();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { setCart } = useRequiredContext(CartContext, 'CartContext');

  // Gợi ý variant thay thế (modal chọn biến thể khác khi hết hàng)
  const [buyAgainSuggestions, setBuyAgainSuggestions] = useState<SubstitutionSuggestion[] | null>(null);

  const handleBuyAgain = async (order: T) => {
    setBusyOrder(order);
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
      setBusyOrder(null);
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

  return { buyAgainSuggestions, handleBuyAgain, handleConfirmBuyAgainSubstitutions, handleCloseBuyAgainModal };
}
