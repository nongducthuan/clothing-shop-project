import React from "react";
import { useNavigate } from "react-router-dom";

// --- CONSTANTS & CONFIG ---

const BACKEND_URL = import.meta.env.VITE_API_URL;
const PLACEHOLDER_IMG = "https://via.placeholder.com/300x400?text=No+Image";

const GENDER_CONFIG = {
  male: { label: "Male", colorClass: "bg-blue-50 text-blue-600 border-blue-100" },
  female: { label: "Female", colorClass: "bg-rose-50 text-rose-600 border-rose-100" },
  unisex: { label: "Unisex", colorClass: "bg-emerald-50 text-emerald-600 border-emerald-100" },
};

// --- UTILS ---

/** Formats number to Vietnamese Currency string */
const formatCurrency = (amount) => Number(amount).toLocaleString("en-US") + " VND";

/** Resolves image URL with fallback logic */
const getImageUrl = (url) => {
  if (!url) return PLACEHOLDER_IMG;
  return url.startsWith("http") ? url : `${BACKEND_URL}${url}`;
};

// --- MAIN COMPONENT ---

export default function ProductCard({ product, promotion }) {
  const navigate = useNavigate();

  const isSale = product.sale_percent > 0;
  const salePrice = product.price * (1 - product.sale_percent / 100);
  const genderInfo = GENDER_CONFIG[product.gender] || GENDER_CONFIG.unisex;

  return (
    <div
      onClick={() => navigate(`/products/${product.id}`)}
      className="group flex flex-col bg-white rounded-3xl overflow-hidden cursor-pointer border border-slate-100 transition-all duration-500 hover:shadow-xl hover:border-slate-200 hover:-translate-y-1.5"
    >
      {/* IMAGE SECTION */}
      <div className="relative w-full aspect-[4/5] bg-slate-50 overflow-hidden">
        <img
          src={getImageUrl(product.image_url)}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = PLACEHOLDER_IMG;
          }}
        />

        {/* DIAGONAL SALE RIBBON */}
        {isSale && (
          <div className="absolute top-6 -left-9 w-36 -rotate-45 bg-rose-500 text-white text-center text-[10px] font-black py-1.5 uppercase tracking-widest shadow-md z-10">
            -{Math.round(product.sale_percent)}% OFF
          </div>
        )}

        {/* GENDER BADGE (TOP RIGHT) */}
        <div className="absolute top-4 right-4 z-10">
          <span className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest border shadow-sm backdrop-blur-md bg-white/90 ${genderInfo.colorClass}`}>
            {genderInfo.label}
          </span>
        </div>

        {/* BUY X GET Y BADGE (BOTTOM RIGHT) */}
        {promotion && (
          <div className="absolute bottom-4 right-4 z-10">
            <span className="px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest bg-slate-900/90 backdrop-blur-md text-white shadow-md">
              BUY {promotion.buy_quantity} GET {promotion.gift_quantity}
            </span>
          </div>
        )}
      </div>

      {/* CONTENT SECTION */}
      <div className="p-5 flex flex-col flex-grow bg-white">

        <h3
          className="font-medium text-base text-slate-900 line-clamp-1 mb-1 transition-colors group-hover:text-violet-600"
          title={product.name}
        >
          {product.name}
        </h3>

        <p className="text-sm text-slate-500 line-clamp-2 mb-4 flex-grow leading-relaxed">
          {product.description || "No further description available for this item."}
        </p>

        {/* PRICE SECTION */}
        <div className="mt-auto">
          {isSale ? (
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-lg font-semibold text-rose-500">
                {formatCurrency(salePrice)}
              </span>
              <span className="text-sm font-medium text-slate-400 line-through decoration-slate-300">
                {formatCurrency(product.price)}
              </span>
            </div>
          ) : (
            <span className="text-lg font-semibold text-slate-900">
              {formatCurrency(product.price)}
            </span>
          )}
        </div>

      </div>
    </div>
  );
}
