import { Link } from "react-router-dom";
import { useLanguage } from "../../../context/LanguageContext";

export default function OrderSummary({ state, actions, helpers, onCheckout }) {
  const {
    user, tier, discount, voucherCode, appliedVoucher, voucherMessage, isApplying,
    subtotal, membershipDiscount, voucherDiscount, finalTotal, totalQuantity
  } = state;
  const { setVoucherCode, handleApplyVoucher, handleRemoveVoucher } = actions;
  const { formatPrice } = helpers;
  const { t, language } = useLanguage();
  const getLocalizedTierName = (tierName: string) => {
    if (!tierName) return "";
    if (language === "vi") {
      const map: Record<string, string> = {
        Normal: "Thường",
        Bronze: "Đồng",
        Silver: "Bạc",
        Gold: "Vàng",
        Diamond: "Kim Cương",
      };
      return map[tierName] || tierName;
    }
    return tierName;
  };

  return (
    <div className="bg-slate-50 dark:bg-slate-800 p-6 sm:p-8 rounded-[2rem] min-w-0 box-border overflow-hidden">
      <h3 className="text-xl font-medium text-slate-900 dark:text-slate-100 mb-6">{t("cart.summary", "Summary")}</h3>

      {/* Auth / Tier Info */}
      {user ? (
        <div className="mb-6 space-y-1">
          <p className="text-sm font-medium text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <i className="fa-solid fa-circle-user text-slate-400"></i> {t("cart.member_label", "Thành viên")} {getLocalizedTierName(tier)}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400">{t("cart.saving_label", "Saving")} {Math.round(discount)}%{t("cart.saving_desc", "% on this order.")}</p>
        </div>
      ) : (
        <div className="mb-6">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            <Link to="/login" className="font-medium text-slate-900 dark:text-slate-100 hover:underline">{t("cart.login_link", "Log in")}</Link> {t("cart.login_for_discount", "to receive up to 10% membership discount.")}
          </p>
        </div>
      )}

      {/* Voucher Input */}
      <div className="mb-8">
        <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-3">
          {t("cart.voucher_code", "Voucher Code")}
        </label>
        <div className="flex gap-2 min-w-0">
          <input
            type="text"
            value={voucherCode}
            onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
            placeholder={t("cart.enter_code", "Enter code")}
            disabled={appliedVoucher !== null}
            className="flex-1 min-w-0 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-3 text-sm focus:outline-none focus:border-slate-900 dark:focus:border-slate-400 font-medium uppercase transition-colors text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500"
          />
          {appliedVoucher ? (
            <button onClick={handleRemoveVoucher} className="px-5 py-3 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 rounded-xl text-sm font-medium hover:bg-rose-100 dark:hover:bg-rose-950/60 transition-colors shrink-0">
              {t("cart.remove", "Remove")}
            </button>
          ) : (
            <button onClick={handleApplyVoucher} disabled={isApplying || !voucherCode.trim()} className="px-5 py-3 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-xl text-sm font-medium hover:bg-slate-800 dark:hover:bg-white disabled:opacity-50 transition-colors shrink-0">
              {isApplying ? '...' : t("cart.apply", "APPLY")}
            </button>
          )}
        </div>
        {voucherMessage.text && (
          <p className={`text-xs mt-3 ${voucherMessage.type === 'error' ? 'text-rose-500' : 'text-emerald-600 font-medium'}`}>
            {voucherMessage.text}
          </p>
        )}
      </div>

      {/* Breakdown */}
      <div className="space-y-4 border-t border-slate-200 dark:border-slate-700 pt-6 mb-6">
        <div className="flex justify-between text-slate-600 dark:text-slate-400 text-sm">
          <span>{t("cart.subtotal", "Subtotal")} ({totalQuantity} {t("cart.items", "items")})</span>
          <span className="font-medium text-slate-900 dark:text-slate-100">{formatPrice(subtotal)}</span>
        </div>

        {membershipDiscount > 0 && (
          <div className="flex justify-between text-slate-600 dark:text-slate-400 text-sm">
            <span>{t("cart.member_discount", "Member Discount")}</span>
            <span className="font-medium text-slate-900 dark:text-slate-100">-{formatPrice(membershipDiscount)}</span>
          </div>
        )}

        {voucherDiscount > 0 && (
          <div className="flex justify-between text-slate-600 dark:text-slate-400 text-sm">
            <span>{t("cart.voucher_label", "Voucher")} ({appliedVoucher.code})</span>
            <span className="font-medium text-emerald-600 dark:text-emerald-400">-{formatPrice(voucherDiscount)}</span>
          </div>
        )}

        <div className="flex justify-between text-slate-600 dark:text-slate-400 text-sm">
          <span>{t("cart.shipping_label", "Shipping")}</span>
          <span className="font-medium text-slate-900 dark:text-slate-100">{t("checkout.free", "Free")}</span>
        </div>
      </div>

      {/* Total & Checkout */}
      <div className="border-t border-slate-200 dark:border-slate-700 pt-6">
        <div className="flex justify-between items-end mb-6 sm:mb-8">
          <span className="text-base font-medium text-slate-900 dark:text-slate-100">{t("cart.total", "Total")}</span>
          <span className="text-2xl sm:text-3xl font-medium text-slate-900 dark:text-slate-100">{formatPrice(finalTotal)}</span>
        </div>

        <button
          onClick={onCheckout}
          className="w-full bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 h-14 rounded-full font-semibold text-base hover:bg-slate-800 dark:hover:bg-white transition-all active:scale-[0.98] shadow-md flex items-center justify-center"
        >
          {t("cart.checkout", "Checkout")}
        </button>
      </div>
    </div>
  );
}
