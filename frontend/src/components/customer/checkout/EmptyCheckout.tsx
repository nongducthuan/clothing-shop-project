import React from "react";
import { useLanguage } from "../../../context/LanguageContext";

export function EmptyCheckout({ onShop }) {
  const { t } = useLanguage();
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center bg-white dark:bg-slate-900 text-center px-6">
      <div className="w-24 h-24 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mb-6">
        <i className="fa-solid fa-cart-shopping text-3xl text-slate-300 dark:text-slate-600"></i>
      </div>
      <h2 className="text-3xl font-medium text-slate-900 dark:text-slate-100 tracking-tight">{t("checkout.empty_bag", "Your cart is empty.")}</h2>
      <p className="text-slate-500 dark:text-slate-400 mt-3 mb-10 text-lg">{t("checkout.empty_desc", "Add some items before proceeding to checkout.")}</p>
      <button
        onClick={onShop}
        className="bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 px-10 py-4 rounded-full font-medium hover:bg-slate-800 dark:hover:bg-white transition-colors"
      >
        {t("cart.continue_shopping", "Continue Shopping")}
      </button>
    </div>
  );
}
