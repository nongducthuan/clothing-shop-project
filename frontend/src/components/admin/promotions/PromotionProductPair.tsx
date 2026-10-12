import React from "react";
import ProductSelector from "./ProductSelector";

export interface PromotionProduct {
  id: number;
  name: string;
  category_id: number;
  gender?: string;
  [key: string]: unknown;
}

interface Props {
  products: PromotionProduct[];
  searchBuyTerm: string;
  searchGetTerm: string;
  buyProductId: number | string | null;
  giftProductId: number | string | null;
  buyQuantity: number | string;
  giftQuantity: number | string;
  setSearchBuyTerm: (v: string) => void;
  setSearchGetTerm: (v: string) => void;
  setBuyProductId: (id: number | string | null) => void;
  setGiftProductId: (id: number | string | null) => void;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleWheel: (e: React.WheelEvent<HTMLInputElement>) => void;
  t: (key: string) => string;
  getCategoryName: (id: number) => string;
  getProductStock: (p: PromotionProduct) => number;
  getGenderStyle: (gender: string) => string;
}

export default function PromotionProductPair({ products, searchBuyTerm, searchGetTerm, buyProductId, giftProductId, buyQuantity, giftQuantity, setSearchBuyTerm, setSearchGetTerm, setBuyProductId, setGiftProductId, handleInputChange, handleWheel, t, getCategoryName, getProductStock, getGenderStyle }: Props) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      <div className="p-6 bg-indigo-50/50 dark:bg-indigo-900/20 rounded-3xl border border-indigo-100 dark:border-indigo-800/50">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-base font-bold text-indigo-800 dark:text-indigo-300 flex items-center gap-2 m-0 leading-none"><span className="bg-indigo-200 dark:bg-indigo-700 text-indigo-800 dark:text-indigo-200 w-6 h-6 rounded-full flex items-center justify-center text-xs">1</span>{t("admin.promo_buy_title")}</h3>
          <div className="flex items-center gap-2"><label className="text-xs font-semibold text-indigo-500 dark:text-indigo-400 uppercase tracking-wider">{t("admin.promo_qty_buy")}</label><input type="number" name="buy_quantity" required min="1" onWheel={handleWheel} value={buyQuantity} onChange={handleInputChange} className="w-20 px-3 py-2 bg-white dark:bg-slate-700 border border-indigo-200 dark:border-indigo-700 rounded-xl focus:ring-2 focus:ring-indigo-500 text-sm text-center font-bold no-spinner outline-none transition-all text-slate-800 dark:text-slate-100" /></div>
        </div>
        <ProductSelector type="buy" products={products} searchTerm={searchBuyTerm} selectedId={buyProductId} setSearchTerm={setSearchBuyTerm} setSelectedId={setBuyProductId} getCategoryName={getCategoryName} getProductStock={getProductStock} getGenderStyle={getGenderStyle} />
      </div>
      <div className="p-6 bg-purple-50/50 dark:bg-purple-900/20 rounded-3xl border border-purple-100 dark:border-purple-800/50">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-base font-bold text-purple-800 dark:text-purple-300 flex items-center gap-2 m-0 leading-none"><span className="bg-purple-200 dark:bg-purple-700 text-purple-800 dark:text-purple-200 w-6 h-6 rounded-full flex items-center justify-center text-xs">2</span>{t("admin.promo_gift_title")}</h3>
          <div className="flex items-center gap-2"><label className="text-xs font-semibold text-purple-500 dark:text-purple-400 uppercase tracking-wider">{t("admin.promo_qty_gift")}</label><input type="number" name="gift_quantity" required min="1" onWheel={handleWheel} value={giftQuantity} onChange={handleInputChange} className="w-20 px-3 py-2 bg-white dark:bg-slate-700 border border-purple-200 dark:border-purple-700 rounded-xl focus:ring-2 focus:ring-purple-500 text-sm text-center font-bold no-spinner outline-none transition-all text-slate-800 dark:text-slate-100" /></div>
        </div>
        <ProductSelector type="get" products={products} searchTerm={searchGetTerm} selectedId={giftProductId} setSearchTerm={setSearchGetTerm} setSelectedId={setGiftProductId} getCategoryName={getCategoryName} getProductStock={getProductStock} getGenderStyle={getGenderStyle} />
      </div>
    </div>
  );
}
