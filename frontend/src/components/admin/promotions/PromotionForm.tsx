import React, { useRef } from "react";
import { useLanguage } from "../../../context/LanguageContext";

interface PromotionFormData {
  name: string;
  name_vi: string;
  name_en: string;
  description_vi: string;
  description_en: string;
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

interface PromotionProduct {
  id: number;
  name: string;
  category_id: number;
  gender?: string;
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
    setFormData: React.Dispatch<React.SetStateAction<any>>;
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
  const { t, getLocalizedText } = useLanguage();

  const getGenderLabel = (gender: string): string => {
    const g = (gender || "").toLowerCase();
    if (g === "men" || g === "male") return "Nam";
    if (g === "women" || g === "female") return "Nữ";
    return "Unisex";
  };

  const startDateRef = useRef<HTMLInputElement>(null);
  const endDateRef = useRef<HTMLInputElement>(null);

  const handleWheel = (e: React.WheelEvent<HTMLInputElement>) => (e.target as HTMLInputElement).blur();

  const renderProductSelector = (type: "buy" | "get") => {
    const isBuyType = type === "buy";
    const currentSearchTerm = isBuyType ? searchBuyTerm : searchGetTerm;
    const setSearch = isBuyType ? setSearchBuyTerm : setSearchGetTerm;
    const currentSelectedId = isBuyType ? formData.buy_product_id : formData.gift_product_id;
    const fieldName = isBuyType ? "buy_product_id" : "gift_product_id";
    const activeColorClasses = isBuyType 
      ? { border: "border-indigo-500", bg: "bg-indigo-50", text: "text-indigo-700", check: "text-indigo-500" } 
      : { border: "border-purple-500", bg: "bg-purple-50", text: "text-purple-700", check: "text-purple-500" };

    const filteredProducts = products.filter((p) => {
      const catName = getCategoryName(p.category_id);
      const pLocalName = getLocalizedText(p, "name") || p.name || "";
      const searchLower = currentSearchTerm.toLowerCase();
      return (
        pLocalName.toLowerCase().includes(searchLower) ||
        catName.toLowerCase().includes(searchLower) ||
        getGenderLabel(p.gender).toLowerCase().includes(searchLower) ||
        (p.gender || "").toLowerCase().includes(searchLower)
      );
    });

    return (
      <div className="space-y-3 mt-3">
        <div className="relative">
          <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
          <input
            type="text"
            placeholder={isBuyType ? t("admin.promo_search_buy_ph") : t("admin.promo_search_gift_ph")}
            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-700/60 border border-slate-200/80 dark:border-slate-600 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 transition-all outline-none text-slate-800 dark:text-slate-100"
            value={currentSearchTerm}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div
          className={`grid grid-cols-1 gap-2 max-h-[250px] overflow-y-auto pr-2 border border-slate-200/50 dark:border-slate-600/50 bg-white/30 dark:bg-slate-700/20 rounded-2xl p-2 custom-scrollbar
          ${isBuyType ? "[&::-webkit-scrollbar-thumb]:bg-indigo-200" : "[&::-webkit-scrollbar-thumb]:bg-purple-200"}`}
        >
          {filteredProducts.map((p) => {
            const isSelected = currentSelectedId === p.id;
            const displayCatName = getCategoryName(p.category_id);
            const stockAmount = getProductStock(p);

            return (
              <div
                key={p.id}
                onClick={() => setFormData((prev) => ({ ...prev, [fieldName]: p.id }))}
                className={`p-3 rounded-2xl border flex items-center justify-between cursor-pointer transition-all duration-200 ${
                  isSelected
                    ? `${activeColorClasses.border} ${activeColorClasses.bg} shadow-sm`
                    : "border-slate-200/80 dark:border-slate-600/60 bg-white dark:bg-slate-700/40 hover:border-slate-300 dark:hover:border-slate-500"
                }`}
              >
                <div className="flex flex-col gap-1.5 overflow-hidden pr-2">
                  <span className={`text-[11px] font-black truncate ${isSelected ? activeColorClasses.text : "text-slate-700 dark:text-slate-200"}`}>
                    {getLocalizedText(p, "name") || p.name}
                  </span>
                  <div className="flex gap-1.5 flex-wrap items-center">
                    <span className="text-[9px] px-1.5 py-0.5 bg-slate-100 dark:bg-slate-600 text-slate-500 dark:text-slate-300 rounded font-bold uppercase tracking-tighter">
                      {displayCatName}
                    </span>
                    {p.gender && (
                      <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-tighter ${getGenderStyle(p.gender)}`}>
                        {getGenderLabel(p.gender)}
                      </span>
                    )}
                    <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-tighter ${stockAmount > 0 ? "bg-amber-100 text-amber-600" : "bg-red-100 text-red-600"}`}>
                      {t("admin.promo_stock")}: {stockAmount}
                    </span>
                  </div>
                </div>
                <div className="ml-1 flex-shrink-0">
                  <i className={`fa-solid ${isSelected ? `fa-check-circle ${activeColorClasses.check} text-lg` : "fa-circle text-slate-200 dark:text-slate-600 text-lg"}`}></i>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

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
                {t("admin.promo_name_label")} (VI) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name_vi"
                required
                value={(formData as any).name_vi || ""}
                onChange={(e) => { handleInputChange(e as any); setFormData((prev: any) => ({ ...prev, name: (e.target as HTMLInputElement).value })); }}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700/60 border border-slate-200/80 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-indigo-500 text-sm outline-none transition-all text-slate-800 dark:text-slate-100"
                placeholder={t("admin.promo_name_vi_placeholder")}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                {t("admin.promo_name_label")} (EN)
              </label>
              <input
                type="text"
                name="name_en"
                value={(formData as any).name_en || ""}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700/60 border border-slate-200/80 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-indigo-500 text-sm outline-none transition-all text-slate-800 dark:text-slate-100"
                placeholder={t("admin.promo_name_en_placeholder")}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                {t("admin.description_vi_label")}
              </label>
              <input
                type="text"
                name="description_vi"
                value={(formData as any).description_vi || ""}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700/60 border border-slate-200/80 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-indigo-500 text-sm outline-none transition-all text-slate-800 dark:text-slate-100"
                placeholder={t("admin.description_vi_placeholder_vi")}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                {t("admin.description_en_label")}
              </label>
              <input
                type="text"
                name="description_en"
                value={(formData as any).description_en || ""}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700/60 border border-slate-200/80 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-indigo-500 text-sm outline-none transition-all text-slate-800 dark:text-slate-100"
                placeholder={t("admin.description_en_placeholder_en")}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="p-6 bg-indigo-50/50 dark:bg-indigo-900/20 rounded-3xl border border-indigo-100 dark:border-indigo-800/50">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-base font-bold text-indigo-800 dark:text-indigo-300 flex items-center gap-2 m-0 leading-none">
                  <span className="bg-indigo-200 dark:bg-indigo-700 text-indigo-800 dark:text-indigo-200 w-6 h-6 rounded-full flex items-center justify-center text-xs">1</span>
                  {t("admin.promo_buy_title")}
                </h3>
                <div className="flex items-center gap-2">
                  <label className="text-xs font-semibold text-indigo-500 dark:text-indigo-400 uppercase tracking-wider">{t("admin.promo_qty_buy")} <span className="text-red-500">*</span></label>
                  <input
                    type="number"
                    name="buy_quantity"
                    required
                    min="1"
                    onWheel={handleWheel}
                    value={formData.buy_quantity}
                    onChange={handleInputChange}
                    className="w-20 px-3 py-2 bg-white dark:bg-slate-700 border border-indigo-200 dark:border-indigo-700 rounded-xl focus:ring-2 focus:ring-indigo-500 text-sm text-center font-bold no-spinner outline-none transition-all text-slate-800 dark:text-slate-100"
                  />
                </div>
              </div>
              {renderProductSelector("buy")}
            </div>

            <div className="p-6 bg-purple-50/50 dark:bg-purple-900/20 rounded-3xl border border-purple-100 dark:border-purple-800/50">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-base font-bold text-purple-800 dark:text-purple-300 flex items-center gap-2 m-0 leading-none">
                  <span className="bg-purple-200 dark:bg-purple-700 text-purple-800 dark:text-purple-200 w-6 h-6 rounded-full flex items-center justify-center text-xs">2</span>
                  {t("admin.promo_gift_title")}
                </h3>
                <div className="flex items-center gap-2">
                  <label className="text-xs font-semibold text-purple-500 dark:text-purple-400 uppercase tracking-wider">{t("admin.promo_qty_gift")} <span className="text-red-500">*</span></label>
                  <input
                    type="number"
                    name="gift_quantity"
                    required
                    min="1"
                    onWheel={handleWheel}
                    value={formData.gift_quantity}
                    onChange={handleInputChange}
                    className="w-20 px-3 py-2 bg-white dark:bg-slate-700 border border-purple-200 dark:border-purple-700 rounded-xl focus:ring-2 focus:ring-purple-500 text-sm text-center font-bold no-spinner outline-none transition-all text-slate-800 dark:text-slate-100"
                  />
                </div>
              </div>
              {renderProductSelector("get")}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div
              className="p-3 bg-slate-50 dark:bg-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl cursor-pointer transition-colors border border-transparent focus-within:border-indigo-200 focus-within:ring-2 focus-within:ring-indigo-500"
              onClick={() => startDateRef.current?.showPicker()}
            >
              <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1 cursor-pointer">{t("admin.promo_start")} <span className="text-red-500">*</span></label>
              <input
                ref={startDateRef}
                type="datetime-local"
                name="start_date"
                required
                value={formData.start_date}
                onChange={handleInputChange}
                className="w-full bg-transparent border-none p-0 text-sm font-medium text-slate-700 dark:text-slate-200 outline-none cursor-pointer"
              />
            </div>

            <div
              className="p-3 bg-slate-50 dark:bg-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl cursor-pointer transition-colors border border-transparent focus-within:border-indigo-200 focus-within:ring-2 focus-within:ring-indigo-500"
              onClick={() => endDateRef.current?.showPicker()}
            >
              <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1 cursor-pointer">{t("admin.end_label")} <span className="text-red-500">*</span></label>
              <input
                ref={endDateRef}
                type="datetime-local"
                name="end_date"
                required
                value={formData.end_date}
                onChange={handleInputChange}
                className="w-full bg-transparent border-none p-0 text-sm font-medium text-slate-700 dark:text-slate-200 outline-none cursor-pointer"
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

