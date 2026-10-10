import React, { useRef } from "react";
import { useLanguage } from "../../../context/LanguageContext";
import { formatDisplayDateTime } from "../../../utils/dateUtils";
import PromotionProductPair, { type PromotionProduct } from "./PromotionProductPair";

export interface PromotionFormData {
  name: string;
  name_vi: string;
  name_en: string;
  buy_product_id: number | string | null;
  gift_product_id: number | string | null;
  buy_quantity: number | string;
  gift_quantity: number | string;
  start_date: string;
  end_date: string;
  max_gift_per_order: number | string;
  total_gift_limit: number | string;
  priority: number | string;
  is_stackable: boolean;
}

interface PromotionFormProps {
  state: {
    formData: PromotionFormData;
    isLoading: boolean;
    editingId: number | null;
    products: PromotionProduct[];
    searchBuyTerm: string;
    searchGetTerm: string;
  };
  actions: {
    handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    handleSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
    handleResetForm: () => void;
    setSearchBuyTerm: (v: string) => void;
    setSearchGetTerm: (v: string) => void;
    setFormData: React.Dispatch<React.SetStateAction<PromotionFormData>>;
  };
  helpers: {
    getCategoryName: (id: number) => string;
    getProductStock: (p: PromotionProduct) => number;
    getGenderStyle: (gender: string) => string;
  };
}

export default function PromotionForm({ state, actions, helpers }: PromotionFormProps) {
  const { formData, isLoading, editingId, products, searchBuyTerm, searchGetTerm } = state;
  const { handleInputChange, handleSubmit, handleResetForm, setSearchBuyTerm, setSearchGetTerm, setFormData } = actions;
  const { getCategoryName, getProductStock, getGenderStyle } = helpers;
  const { t } = useLanguage();

  const startDateRef = useRef<HTMLInputElement>(null);
  const endDateRef = useRef<HTMLInputElement>(null);

  const handleWheel = (e: React.WheelEvent<HTMLInputElement>) => (e.target as HTMLInputElement).blur();

  return (
    <>
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 5px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background-color: #e2e8f0; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background-color: #cbd5e1; }

        .no-spinner::-webkit-inner-spin-button,
        .no-spinner::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
        .no-spinner { -moz-appearance: textfield; }

        ::-webkit-calendar-picker-indicator { cursor: pointer; opacity: 0.6; transition: opacity 0.2s; }
        ::-webkit-calendar-picker-indicator:hover { opacity: 1; }
      `}</style>

      <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-200/80 dark:border-slate-700 overflow-hidden">
        <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-6 px-8 flex justify-between items-center">
          <h2 className="text-xl font-bold text-white flex items-center gap-2 m-0 leading-none">
            <i className="fa-solid fa-gift text-purple-100"></i>
            {editingId ? t("admin.promo_form_title_edit") : t("admin.promo_form_title")}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                {t("admin.promo_name_label")} (VI)
              </label>
              <input
                type="text"
                name="name_vi"
                required
                value={formData.name_vi || ""}
                onChange={(e) => { handleInputChange(e); setFormData((prev) => ({ ...prev, name: (e.target as HTMLInputElement).value })); }}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700/60 border border-slate-200/80 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-indigo-500 text-sm outline-none transition-all text-slate-800 dark:text-slate-100"
                placeholder={t("admin.ex_promo_name_vi")}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                {t("admin.promo_name_label")} (EN)
              </label>
              <input
                type="text"
                name="name_en"
                value={formData.name_en || ""}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700/60 border border-slate-200/80 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-indigo-500 text-sm outline-none transition-all text-slate-800 dark:text-slate-100"
                placeholder={t("admin.ex_promo_name_en")}
              />
            </div>
          </div>

          <PromotionProductPair
            products={products}
            searchBuyTerm={searchBuyTerm}
            searchGetTerm={searchGetTerm}
            buyProductId={formData.buy_product_id}
            giftProductId={formData.gift_product_id}
            buyQuantity={formData.buy_quantity}
            giftQuantity={formData.gift_quantity}
            setSearchBuyTerm={setSearchBuyTerm}
            setSearchGetTerm={setSearchGetTerm}
            setBuyProductId={(id) => setFormData((prev) => ({ ...prev, buy_product_id: id }))}
            setGiftProductId={(id) => setFormData((prev) => ({ ...prev, gift_product_id: id }))}
            handleInputChange={handleInputChange}
            handleWheel={handleWheel}
            t={(key) => t(key)}
            getCategoryName={getCategoryName}
            getProductStock={getProductStock}
            getGenderStyle={getGenderStyle}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div
              className="relative p-3 bg-slate-50 dark:bg-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl cursor-pointer transition-colors border border-transparent focus-within:border-indigo-200 focus-within:ring-2 focus-within:ring-indigo-500"
              onClick={() => startDateRef.current?.showPicker()}
            >
              <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1 cursor-pointer pointer-events-none">{t("admin.start_label")}</label>
              <div className="flex items-center justify-between pointer-events-none">
                <span className={`text-xs font-semibold ${formData.start_date ? 'text-slate-700 dark:text-slate-200' : 'text-slate-400 dark:text-slate-400'}`}>
                  {formatDisplayDateTime(formData.start_date)}
                </span>
                <i className="fa-regular fa-calendar text-slate-400 text-xs"></i>
              </div>
              <input
                ref={startDateRef}
                type="datetime-local"
                name="start_date"
                required
                value={formData.start_date}
                onChange={handleInputChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
            </div>

            <div
              className="relative p-3 bg-slate-50 dark:bg-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl cursor-pointer transition-colors border border-transparent focus-within:border-indigo-200 focus-within:ring-2 focus-within:ring-indigo-500"
              onClick={() => endDateRef.current?.showPicker()}
            >
              <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1 cursor-pointer pointer-events-none">{t("admin.end_label")}</label>
              <div className="flex items-center justify-between pointer-events-none">
                <span className={`text-xs font-semibold ${formData.end_date ? 'text-slate-700 dark:text-slate-200' : 'text-slate-400 dark:text-slate-400'}`}>
                  {formatDisplayDateTime(formData.end_date)}
                </span>
                <i className="fa-regular fa-calendar text-slate-400 text-xs"></i>
              </div>
              <input
                ref={endDateRef}
                type="datetime-local"
                name="end_date"
                required
                value={formData.end_date}
                onChange={handleInputChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
              <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">{t("admin.promo_limit_per_order")}</label>
              <input
                type="number"
                name="max_gift_per_order"
                onWheel={handleWheel}
                value={formData.max_gift_per_order}
                onChange={handleInputChange}
                className="w-full bg-transparent border-none p-0 text-sm font-medium text-slate-700 dark:text-slate-200 outline-none no-spinner"
                placeholder={t("admin.promo_limit_per_ph")}
              />
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
              <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">{t("admin.promo_limit_total")}</label>
              <input
                type="number"
                name="total_gift_limit"
                onWheel={handleWheel}
                value={formData.total_gift_limit}
                onChange={handleInputChange}
                className="w-full bg-transparent border-none p-0 text-sm font-medium text-slate-700 dark:text-slate-200 outline-none no-spinner"
                placeholder={t("admin.promo_limit_total_ph")}
              />
            </div>
          </div>

          <div className="flex flex-col md:flex-row items-center justify-between gap-6 pt-6 border-t border-slate-100 dark:border-slate-700">
            <div className="flex items-center gap-8 w-full md:w-auto">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 text-center">{t("admin.promo_priority")}</label>
                <input
                  type="number"
                  name="priority"
                  onWheel={handleWheel}
                  value={formData.priority}
                  onChange={handleInputChange}
                  className="w-24 px-4 py-2.5 bg-slate-50 dark:bg-slate-700/60 border border-slate-200/80 dark:border-slate-600 rounded-xl text-sm text-center font-bold outline-none no-spinner focus:ring-2 focus:ring-indigo-500 transition-all text-slate-800 dark:text-slate-100"
                  placeholder="0"
                />
              </div>
              <div className="flex flex-col justify-center h-full pt-4">
                <label className="flex items-center cursor-pointer">
                  <div className="relative">
                    <input type="checkbox" name="is_stackable" checked={formData.is_stackable} onChange={handleInputChange} className="sr-only" />
                    <div className={`block w-10 h-6 rounded-full transition-colors ${formData.is_stackable ? "bg-indigo-500" : "bg-slate-300 dark:bg-slate-600"}`}></div>
                    <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${formData.is_stackable ? "transform translate-x-4" : ""}`}></div>
                  </div>
                  <div className="ml-3 text-sm font-semibold text-slate-700 dark:text-slate-200">
                    {t("admin.promo_stackable")}
                    <span className="block text-[10px] font-normal text-slate-400 dark:text-slate-400">{t("admin.promo_stackable_desc")}</span>
                  </div>
                </label>
              </div>
            </div>

            <div className="flex gap-4 w-full md:w-auto">
              {editingId && (
                <button type="button" onClick={handleResetForm} className="w-full md:w-auto px-6 py-3 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-bold rounded-xl shadow-sm transition-all whitespace-nowrap uppercase tracking-wider text-xs">
                  {t("common.cancel")}
                </button>
              )}
              <button type="submit" disabled={isLoading} className="w-full md:w-auto px-8 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold rounded-xl shadow-md shadow-purple-200 transition-all whitespace-nowrap uppercase tracking-wider text-xs">
                {isLoading ? t("common.loading") : editingId ? t("admin.save_changes") : t("admin.add_new_promotion")}
              </button>
            </div>
          </div>
        </form>
      </div>
    </>
  );
}
