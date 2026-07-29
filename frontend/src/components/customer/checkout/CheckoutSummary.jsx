// components/client/checkout/CheckoutSummary.jsx
import React from "react";

export function CheckoutSummary({ state, helpers }) {
  const { cart, earnedGifts, giftDetails, subtotal, membershipDiscount, tier, voucherDiscount, appliedVoucher, finalTotal } = state;
  const { getImageUrl, formatPrice } = helpers;

  return (
    <div className="bg-slate-50 p-8 rounded-[2rem]">
      <h3 className="text-xl font-medium text-slate-900 mb-6">Order Summary</h3>

      {/* Items List */}
      <div className="space-y-4 mb-8">
        {cart.map((item, idx) => (
          <div key={idx} className="flex gap-4 items-center">
            <div className="w-16 h-20 bg-white rounded-xl overflow-hidden flex-shrink-0 border border-slate-200 relative">
              <img src={getImageUrl(item)} className="w-full h-full object-cover" alt={item.name} />
              <span className="absolute top-0 right-0 bg-slate-900 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-bl-lg">
                {item.quantity}
              </span>
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-medium text-slate-900 line-clamp-1">{item.name}</h4>
              <p className="text-xs text-slate-500 mt-0.5">{item.color} / {item.size}</p>
              <p className="text-sm font-medium text-slate-900 mt-1">{formatPrice(item.price)}</p>
            </div>
          </div>
        ))}

        {/* Gifts List */}
        {earnedGifts.map((gift, idx) => {
          const detail = giftDetails[gift.giftProductId];
          return (
            <div key={`gift-${idx}`} className="flex gap-4 items-center bg-white p-3 rounded-2xl border border-slate-100">
              <div className="w-16 h-20 bg-slate-50 rounded-xl overflow-hidden flex-shrink-0 border border-slate-100 relative">
                <img src={detail ? getImageUrl(detail) : ""} className="w-full h-full object-cover" alt="gift" />
                <span className="absolute top-0 right-0 bg-rose-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-bl-lg">
                  {gift.quantity}
                </span>
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-medium text-slate-900 line-clamp-1">{detail?.name || "Loading gift..."}</h4>
                <span className="inline-block bg-rose-50 text-rose-600 text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider mt-1">
                  {gift.promoName}
                </span>
                <p className="text-sm font-medium text-slate-900 mt-1">Free</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Price Breakdown */}
      <div className="space-y-3 border-t border-slate-200 pt-6 mb-6">
        <div className="flex justify-between text-slate-600 text-sm">
          <span>Subtotal</span>
          <span className="font-medium text-slate-900">{formatPrice(subtotal)}</span>
        </div>

        {membershipDiscount > 0 && (
          <div className="flex justify-between text-slate-600 text-sm">
            <span>Member ({tier})</span>
            <span className="font-medium text-slate-900">-{formatPrice(membershipDiscount)}</span>
          </div>
        )}

        {voucherDiscount > 0 && (
          <div className="flex justify-between text-slate-600 text-sm">
            <span>Voucher ({appliedVoucher?.code})</span>
            <span className="font-medium text-emerald-600">-{formatPrice(voucherDiscount)}</span>
          </div>
        )}

        <div className="flex justify-between text-slate-600 text-sm">
          <span>Shipping</span>
          <span className="font-medium text-slate-900">Free</span>
        </div>
      </div>

      <div className="border-t border-slate-200 pt-6 flex justify-between items-end">
        <span className="text-base font-medium text-slate-900">Total</span>
        <span className="text-3xl font-medium text-slate-900">{formatPrice(finalTotal)}</span>
      </div>
    </div>
  );
}
