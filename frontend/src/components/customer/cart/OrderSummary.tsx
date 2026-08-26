import { Link } from "react-router-dom";

export default function OrderSummary({ state, actions, helpers, onCheckout }) {
  const {
    user, tier, discount, voucherCode, appliedVoucher, voucherMessage, isApplying,
    subtotal, membershipDiscount, voucherDiscount, finalTotal, totalQuantity
  } = state;
  const { setVoucherCode, handleApplyVoucher, handleRemoveVoucher } = actions;
  const { formatPrice } = helpers;

  return (
    <div className="bg-slate-50 p-6 sm:p-8 rounded-[2rem] min-w-0 box-border overflow-hidden">
      <h3 className="text-xl font-medium text-slate-900 mb-6">Summary</h3>

      {/* Auth / Tier Info */}
      {user ? (
        <div className="mb-6 space-y-1">
          <p className="text-sm font-medium text-slate-900 flex items-center gap-2">
            <i className="fa-solid fa-circle-user text-slate-400"></i> {tier} Member
          </p>
          <p className="text-xs text-slate-500">Saving {Math.round(discount)}% on this order.</p>
        </div>
      ) : (
        <div className="mb-6">
          <p className="text-sm text-slate-500">
            <Link to="/login" className="font-medium text-slate-900 hover:underline">Log in</Link> to receive up to 10% membership discount.
          </p>
        </div>
      )}

      {/* Voucher Input */}
      <div className="mb-8">
        <label className="block text-xs font-medium text-slate-500 uppercase tracking-widest mb-3">
          Promo Code
        </label>
        <div className="flex gap-2 min-w-0">
          <input
            type="text"
            value={voucherCode}
            onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
            placeholder="Enter code"
            disabled={appliedVoucher !== null}
            className="flex-1 min-w-0 bg-white border border-slate-200 rounded-xl px-3 py-3 text-sm focus:outline-none focus:border-slate-900 font-medium uppercase transition-colors"
          />
          {appliedVoucher ? (
            <button onClick={handleRemoveVoucher} className="px-5 py-3 bg-rose-50 text-rose-600 rounded-xl text-sm font-medium hover:bg-rose-100 transition-colors shrink-0">
              Remove
            </button>
          ) : (
            <button onClick={handleApplyVoucher} disabled={isApplying || !voucherCode.trim()} className="px-5 py-3 bg-slate-900 text-white rounded-xl text-sm font-medium hover:bg-slate-800 disabled:opacity-50 transition-colors shrink-0">
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
      <div className="space-y-4 border-t border-slate-200 pt-6 mb-6">
        <div className="flex justify-between text-slate-600 text-sm">
          <span>Subtotal ({totalQuantity} items)</span>
          <span className="font-medium text-slate-900">{formatPrice(subtotal)}</span>
        </div>

        {membershipDiscount > 0 && (
          <div className="flex justify-between text-slate-600 text-sm">
            <span>Member Discount</span>
            <span className="font-medium text-slate-900">-{formatPrice(membershipDiscount)}</span>
          </div>
        )}

        {voucherDiscount > 0 && (
          <div className="flex justify-between text-slate-600 text-sm">
            <span>Voucher ({appliedVoucher.code})</span>
            <span className="font-medium text-emerald-600">-{formatPrice(voucherDiscount)}</span>
          </div>
        )}

        <div className="flex justify-between text-slate-600 text-sm">
          <span>Shipping</span>
          <span className="font-medium text-slate-900">Free</span>
        </div>
      </div>

      {/* Total & Checkout */}
      <div className="border-t border-slate-200 pt-6">
        <div className="flex justify-between items-end mb-6 sm:mb-8">
          <span className="text-base font-medium text-slate-900">Total</span>
          <span className="text-2xl sm:text-3xl font-medium text-slate-900">{formatPrice(finalTotal)}</span>
        </div>

        <button
          onClick={onCheckout}
          className="w-full bg-slate-900 text-white h-14 rounded-full font-semibold text-base hover:bg-slate-800 transition-all active:scale-[0.98] shadow-md flex items-center justify-center"
        >
          Checkout
        </button>
      </div>
    </div>
  );
}
