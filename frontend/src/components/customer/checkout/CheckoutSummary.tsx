import React from "react";
import { useLanguage } from "../../../context/LanguageContext";
import { Sparkles } from "lucide-react";

export function CheckoutSummary({ state, helpers }) {
  const { cart, earnedGifts, giftDetails, subtotal, membershipDiscount, tier, voucherDiscount, appliedVoucher, shippingFee, isFreeShipping, finalTotal } = state;
  const { getImageUrl, formatPrice } = helpers;
  const { t, getLocalizedText, getLocalizedTierName } = useLanguage();

  return (
    <div className="bg-slate-50 dark:bg-slate-800 p-8 rounded-[2rem]">
      <h3 className="text-xl font-medium text-slate-900 dark:text-slate-100 mb-6">{t("checkout.order_summary", "Order Summary")}</h3>

      {/* Items List */}
      <div className="space-y-4 mb-8">
        {cart.map((item, idx) => {
          const productName = getLocalizedText(item, "name") || item.name;
          const colorName = getLocalizedText(item, "color_name") || item.color;

          return (
            <div key={idx} className="flex gap-4 items-center">
              <div className="w-16 h-20 bg-white dark:bg-slate-700 rounded-xl overflow-hidden flex-shrink-0 border border-slate-200 dark:border-slate-600 relative">
                <img src={getImageUrl(item)} className="w-full h-full object-cover" alt={productName} />
                <span className="absolute top-0 right-0 bg-slate-900 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-bl-lg">
                  {item.quantity}
                </span>
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-medium text-slate-900 dark:text-slate-100 line-clamp-1">{productName}</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {colorName ? `${t("cart.color_label", "Color:")} ${colorName} | ` : ""}
                  {t("cart.size_label", "Size:")} {item.size}
                </p>
                <p className="text-sm font-medium text-slate-900 dark:text-slate-100 mt-1">{formatPrice(item.price)}</p>
              </div>
            </div>
          );
        })}

        {/* Gifts List */}
        {earnedGifts.map((gift, idx) => {
          const detail = giftDetails[gift.giftProductId];
          let variantText = "";
          let colorImageUrl = detail?.image_url;
          if (detail && detail.colors && detail.colors.length > 0) {
            let chosenColor = detail.colors.find(c => c.id === gift.color_id);
            let chosenSize = chosenColor?.sizes?.find(s => s.id === gift.size_id);

            if (!chosenColor) {
              for (const c of detail.colors) {
                const s = c.sizes?.find(sz => sz.stock > 0);
                if (s) {
                  chosenColor = c;
                  chosenSize = s;
                  break;
                }
              }
            }
            if (!chosenColor) {
              chosenColor = detail.colors[0];
              chosenSize = chosenColor?.sizes?.[0];
            }
            if (chosenColor && chosenSize) {
              variantText = `${t("cart.color_label", "Color:")} ${getLocalizedText(chosenColor, "color_name") || chosenColor.color_name} | ${t("cart.size_label", "Size:")} ${chosenSize.size}`;
              colorImageUrl = chosenColor.image_url || detail.image_url;
            }
          }

          return (
            <div key={`gift-${idx}`} className="flex gap-4 items-center bg-white dark:bg-slate-700 p-3 rounded-2xl border border-slate-100 dark:border-slate-600">
              <div className="w-16 h-20 bg-slate-50 dark:bg-slate-800 rounded-xl overflow-hidden flex-shrink-0 border border-slate-100 dark:border-slate-600 relative">
                <img src={colorImageUrl ? getImageUrl(colorImageUrl) : ""} className="w-full h-full object-cover" alt={t("cart.free_gift", "gift")} />
                <span className="absolute top-0 right-0 bg-rose-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-bl-lg">
                  {gift.quantity}
                </span>
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-medium text-slate-900 dark:text-slate-100 line-clamp-1">
                  {detail ? getLocalizedText(detail, "name") : t("cart.loading_gift", "Loading gift...")}
                </h4>
                {variantText && <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{variantText}</p>}
                <span className="inline-flex items-center gap-1 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider mt-1">
                  <i className="fa-solid fa-gift text-rose-500 dark:text-rose-400"></i> {t("cart.free_gift", "Free Gift")} ({gift.promo ? (getLocalizedText(gift.promo, 'name') || gift.promoName) : gift.promoName})
                </span>
                <p className="text-sm font-medium text-slate-900 dark:text-slate-100 mt-1">{t("checkout.free", "Free")}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Price Breakdown */}
      <div className="space-y-3 border-t border-slate-200 dark:border-slate-700 pt-6 mb-6">
        <div className="flex justify-between text-slate-600 dark:text-slate-400 text-sm">
          <span>{t("checkout.subtotal", "Subtotal")}</span>
          <span className="font-medium text-slate-900 dark:text-slate-100">{formatPrice(subtotal)}</span>
        </div>

        {membershipDiscount > 0 && (
          <div className="flex justify-between text-slate-600 dark:text-slate-400 text-sm">
            <span>{t("checkout.member_label", "Thành viên")} ({getLocalizedTierName(tier)})</span>
            <span className="font-medium text-slate-900 dark:text-slate-100">-{formatPrice(membershipDiscount)}</span>
          </div>
        )}

        {voucherDiscount > 0 && (
          <div className="flex justify-between text-slate-600 dark:text-slate-400 text-sm">
            <span>{t("checkout.voucher_label", "Voucher")} ({appliedVoucher?.code})</span>
            <span className="font-medium text-emerald-600 dark:text-emerald-400">-{formatPrice(voucherDiscount)}</span>
          </div>
        )}

        <div className="flex justify-between text-slate-600 dark:text-slate-400 text-sm">
          <span className="flex items-center gap-1.5">
            {t("checkout.shipping_label", "Shipping")}
          </span>
          {isFreeShipping ? (
            <span className="font-medium text-emerald-600 dark:text-emerald-400">{t("checkout.free", "Free")}</span>
          ) : shippingFee > 0 ? (
            <span className="font-medium text-slate-900 dark:text-slate-100">{formatPrice(shippingFee)}</span>
          ) : (
            <span className="font-medium text-slate-400 dark:text-slate-500 text-xs italic">{t("checkout.calculate_shipping", "Enter address to calculate")}</span>
          )}
        </div>
      </div>

      <div className="border-t border-slate-200 dark:border-slate-700 pt-6 flex justify-between items-end">
        <span className="text-base font-medium text-slate-900 dark:text-slate-100">{t("cart.total", "Total")}</span>
        <span className="text-3xl font-medium text-slate-900 dark:text-slate-100">{formatPrice(finalTotal)}</span>
      </div>
    </div>
  );
}
