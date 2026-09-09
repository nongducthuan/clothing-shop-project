import { Link } from "react-router-dom";

export default function OrderSummary({ state, actions, helpers, onCheckout }) {
  const {
    user, tier, discount, voucherCode, appliedVoucher, voucherMessage, isApplying,
    subtotal, membershipDiscount, voucherDiscount, finalTotal, totalQuantity
  } = state;
  const { setVoucherCode, handleApplyVoucher, handleRemoveVoucher } = actions;
  const { formatPrice } = helpers;

  return (
    <div className="bg-slate-50 dark:bg-slate-800 p-6 sm:p-8 rounded-[2rem] min-w-0 box-border overflow-hidden">
      <h3 className="text-xl font-medium text-slate-900 dark:text-slate-100 mb-6">Summary</h3>

      {/* Auth / Tier Info */}
      {user ? (
        <div className="mb-6 space-y-1">
          <p className="text-sm font-medium text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <i className="fa-solid fa-circle-user text-slate-400"></i> {tier} Member
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400">Saving {Math.round(discount)}% on this order.</p>
        </div>
      ) : (
        <div className="mb-6">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            <Link to="/login" className="font-medium text-slate-900 dark:text-slate-100 hover:underline">Log in</Link> to receive up to 10% membership discount.
          </p>
        </div>
      )}

      {/* Voucher Input */}
      <div className="mb-8">
        <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-3">
          Voucher Code
        </label>
        <div className="flex gap-2 min-w-0">
          <input
            type="text"
            value={voucherCode}
            onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
            placeholder="Enter code"
            disabled={appliedVoucher !== null}
            className="flex-1 min-w-0 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-3 text-sm focus:outline-none focus:border-slate-900 dark:focus:border-slate-400 font-medium uppercase transition-colors text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500"
          />
          {appliedVoucher ? (
            <button onClick={handleRemoveVoucher} className="px-5 py-3 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 rounded-xl text-sm font-medium hover:bg-rose-100 dark:hover:bg-rose-950/60 transition-colors shrink-0">
              Remove
            </button>
          ) : (
            <button onClick={handleApplyVoucher} disabled={isApplying || !voucherCode.trim()} className="px-5 py-3 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-xl text-sm font-medium hover:bg-slate-800 dark:hover:bg-white disabled:opacity-50 transition-colors shrink-0">
              {isApplying ? '...' : 'APPLY'}
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
          <span>Subtotal ({totalQuantity} items)</span>
          <span className="font-medium text-slate-900 dark:text-slate-100">{formatPrice(subtotal)}</span>
        </div>

        {membershipDiscount > 0 && (
          <div className="flex justify-between text-slate-600 dark:text-slate-400 text-sm">
            <span>Member Discount</span>
            <span className="font-medium text-slate-900 dark:text-slate-100">-{formatPrice(membershipDiscount)}</span>
          </div>
        )}

        {voucherDiscount > 0 && (
          <div className="flex justify-between text-slate-600 dark:text-slate-400 text-sm">
            <span>Voucher ({appliedVoucher.code})</span>
            <span className="font-medium text-emerald-600 dark:text-emerald-400">-{formatPrice(voucherDiscount)}</span>
          </div>
        )}

        <div className="flex justify-between text-slate-600 dark:text-slate-400 text-sm">
          <span>Shipping</span>
          <span className="font-medium text-slate-900 dark:text-slate-100">Free</span>
        </div>
      </div>

      {/* Total & Checkout */}
      <div className="border-t border-slate-200 dark:border-slate-700 pt-6">
        <div className="flex justify-between items-end mb-6 sm:mb-8">
          <span className="text-base font-medium text-slate-900 dark:text-slate-100">Total</span>
          <span className="text-2xl sm:text-3xl font-medium text-slate-900 dark:text-slate-100">{formatPrice(finalTotal)}</span>
        </div>

        <button
          onClick={onCheckout}
          className="w-full bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 h-14 rounded-full font-semibold text-base hover:bg-slate-800 dark:hover:bg-white transition-all active:scale-[0.98] shadow-md flex items-center justify-center"
        >
          Checkout
        </button>
      </div>
    </div>
  );
}
