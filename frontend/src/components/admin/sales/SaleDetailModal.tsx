import React from "react";
import { useLanguage } from "../../../context/LanguageContext";

export default function SaleDetailModal({ detailModal, onClose }) {
  const { getLocalizedText, t } = useLanguage();
  if (!detailModal.isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl max-w-md w-full overflow-hidden flex flex-col border border-slate-100 dark:border-slate-700">
        <div className="pt-8 px-8 pb-4 flex justify-between items-center">
          <h3 className="font-bold text-slate-800 dark:text-slate-100 uppercase text-xs tracking-[0.2em]">
            {detailModal.title}
          </h3>
          <button
            onClick={onClose}
            className="p-2 bg-slate-50 dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 rounded-xl text-slate-400 dark:text-slate-300 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="px-8 pb-8 overflow-y-auto max-h-[60vh] custom-scrollbar">
          <div className="space-y-3">
            {detailModal.data.map((item, index) => (
              <div key={index} className="flex items-center justify-between bg-slate-50/50 dark:bg-slate-700/40 border border-slate-100 dark:border-slate-600 p-4 rounded-2xl">
                <div className="flex items-center gap-4">
                  <div className="w-2 h-2 bg-blue-500 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.6)]"></div>
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{getLocalizedText(item, "name") || item.name}</span>
                </div>
                {item.gender && (
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                    (item.gender || '').toLowerCase() === 'men' || (item.gender || '').toLowerCase() === 'male' ? 'bg-blue-100 dark:bg-blue-950/40 text-blue-600 dark:text-blue-300' :
                    (item.gender || '').toLowerCase() === 'women' || (item.gender || '').toLowerCase() === 'female' ? 'bg-pink-100 dark:bg-pink-950/40 text-pink-600 dark:text-pink-300' :
                    'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-300'
                  }`}>
                    {(item.gender || '').toLowerCase() === 'male' || (item.gender || '').toLowerCase() === 'men' ? t("gender.male", "Nam") :
                     (item.gender || '').toLowerCase() === 'female' || (item.gender || '').toLowerCase() === 'women' ? t("gender.female", "Nữ") :
                     t("gender.unisex", "Unisex")}
                  </span>
                )}
              </div>
            ))}
            {detailModal.data.length === 0 && (
              <p className="text-center text-gray-400 dark:text-slate-500 text-xs italic py-4">{t("admin.no_data")}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
