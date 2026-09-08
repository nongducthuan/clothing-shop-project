import React from "react";
import { useNavigate } from "react-router-dom";
import { getImageUrl, PLACEHOLDER_IMG } from "../../../utils/imageUtils";
import { useLanguage } from "../../../context/LanguageContext";

const GENDER_CONFIG = {
  male: { label: "Male", colorClass: "bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-950/50 dark:text-blue-400 dark:border-blue-800" },
  female: { label: "Female", colorClass: "bg-rose-50 text-rose-600 border-rose-100 dark:bg-rose-950/50 dark:text-rose-400 dark:border-rose-800" },
  unisex: { label: "Unisex", colorClass: "bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-950/50 dark:text-emerald-400 dark:border-emerald-800" },
};

const formatCurrency = (amount: number) => Number(amount).toLocaleString("vi-VN") + "đ";


interface ProductCardProps {
  product: {
    id: number | string;
    name: string;
    name_vi?: string;
    name_en?: string;
    description?: string;
    description_vi?: string;
    description_en?: string;
    price: number;
    sale_percent?: number;
    gender?: 'male' | 'female' | 'unisex';
    image_url?: string;
  };
  promotion?: {
    buy_quantity: number;
    gift_quantity: number;
  } | null;
}

export default function ProductCard({ product, promotion }: ProductCardProps) {
  const navigate = useNavigate();
  const { getLocalizedText, t } = useLanguage();

  const isSale = product.sale_percent > 0;
  const salePrice = product.price * (1 - product.sale_percent / 100);
  const genderInfo = GENDER_CONFIG[product.gender] || GENDER_CONFIG.unisex;

  const productName = getLocalizedText(product, 'name');
  const productDesc = getLocalizedText(product, 'description');
  const genderLabel = t(`gender.${product.gender}`, genderInfo.label);

  return (
    <div
      onClick={() => navigate(`/products/${product.id}`)}
      className="group flex flex-col bg-white dark:bg-slate-800 rounded-2xl sm:rounded-3xl overflow-hidden cursor-pointer border border-slate-100 dark:border-slate-700 transition-all duration-500 hover:shadow-xl hover:border-slate-200 dark:hover:border-slate-600 hover:-translate-y-1.5"
    >
      <div className="relative w-full aspect-[4/5] bg-slate-50 dark:bg-slate-900 overflow-hidden">
        <img
          src={getImageUrl(product.image_url)}
          alt={productName}
          className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
          onError={(e) => {
            (e.target as HTMLImageElement).onerror = null;
            (e.target as HTMLImageElement).src = PLACEHOLDER_IMG;
          }}
        />

        {isSale && (
          <div className="absolute top-4 sm:top-6 -left-10 sm:-left-9 w-32 sm:w-36 -rotate-45 bg-rose-500 text-white text-center text-[9px] sm:text-[10px] font-black py-1 sm:py-1.5 uppercase tracking-widest shadow-md z-10">
            -{Math.round(product.sale_percent)}% OFF
          </div>
        )}

        <div className="absolute top-2 right-2 sm:top-4 sm:right-4 z-10">
          <span className={`px-2 py-1 sm:px-3 sm:py-1.5 rounded-full text-[9px] sm:text-[10px] font-bold uppercase tracking-wider sm:tracking-widest border shadow-sm backdrop-blur-md bg-white/90 dark:bg-slate-800/90 ${genderInfo.colorClass}`}>
            {genderLabel}
          </span>
        </div>

        {promotion && (
          <div className="absolute bottom-2 right-2 sm:bottom-4 sm:right-4 z-10">
            <span className="px-2 py-1 sm:px-3 sm:py-1.5 rounded-full text-[9px] sm:text-[10px] font-bold uppercase tracking-wider sm:tracking-widest bg-slate-900/90 dark:bg-slate-700/90 backdrop-blur-md text-white shadow-md">
              BUY {promotion.buy_quantity} GET {promotion.gift_quantity}
            </span>
          </div>
        )}
      </div>

      <div className="p-3 sm:p-5 flex flex-col flex-grow bg-white dark:bg-slate-800 min-w-0">
        <h3
          className="font-medium text-sm sm:text-base text-slate-900 dark:text-slate-100 line-clamp-1 mb-1 transition-colors group-hover:text-violet-600 dark:group-hover:text-violet-400 break-words"
          title={productName}
        >
          {productName}
        </h3>

        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 line-clamp-2 mb-3 sm:mb-4 flex-grow leading-relaxed">
          {productDesc || t("product.no_desc", "No description available for this item.")}
        </p>

        <div className="mt-auto">
          {isSale ? (
            <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
              <span className="text-base sm:text-lg font-semibold text-rose-500">
                {formatCurrency(salePrice)}
              </span>
              <span className="text-xs sm:text-sm font-medium text-slate-400 line-through decoration-slate-300">
                {formatCurrency(product.price)}
              </span>
            </div>
          ) : (
            <span className="text-base sm:text-lg font-semibold text-slate-900">
              {formatCurrency(product.price)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

