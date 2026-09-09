import React from "react";
import { getImageUrl } from "../../../utils/imageUtils";
import { useLanguage } from "../../../context/LanguageContext";

export default function BannerList({
  banners,
  handleEdit,
  handleDelete,
}) {
  const { t, getLocalizedText } = useLanguage();

  return (
    <div className="h-full">
      {banners.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full text-center p-12 bg-white dark:bg-slate-800 rounded-[2rem] border border-slate-200/80 dark:border-slate-700 shadow-sm">
          <div className="w-20 h-20 bg-slate-50 dark:bg-slate-700/50 rounded-full flex items-center justify-center mb-4">
            <i className="fa-solid fa-panorama text-slate-300 dark:text-slate-500 text-3xl"></i>
          </div>
          <h4 className="text-slate-800 dark:text-slate-100 font-bold text-lg mb-1">{t("admin.system_is_empty")}</h4>
          <p className="text-slate-500 dark:text-slate-400 text-sm max-w-sm">
            {t("search.no_items_desc")}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {banners.map((b) => {
            const imageSrc = getImageUrl(b.image_url);

            return (
              <div
                key={b.id}
                className="bg-slate-50/50 dark:bg-slate-700/40 rounded-[1.5rem] border border-slate-200/80 dark:border-slate-600/60 shadow-xs overflow-hidden group hover:shadow-md hover:border-violet-200 dark:hover:border-violet-500/50 transition-all duration-300 flex flex-col"
              >
                {/* Image Area */}
                <div className="relative w-full pb-[42.85%] bg-slate-100 dark:bg-slate-700 overflow-hidden">
                  <img
                    src={imageSrc}
                    alt={b.title}
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    onError={(e) =>
                      ((e.target as HTMLImageElement).src = "https://via.placeholder.com/600x250?text=No+Image+Available")
                    }
                  />
                </div>

                {/* Content Area */}
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <h5 className="font-extrabold text-slate-800 dark:text-slate-100 text-lg truncate mb-1">
                      {getLocalizedText(b, "title")}
                    </h5>
                    <p className="text-slate-500 dark:text-slate-400 text-sm truncate">
                      {getLocalizedText(b, "subtitle") || t("product.no_desc")}
                    </p>
                  </div>

                  {/* Actions (Luôn hiển thị rõ ràng) */}
                  <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-slate-200/80 dark:border-slate-600/60">
                    <button
                      onClick={() => handleEdit(b)}
                      className="w-10 h-10 flex items-center justify-center bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 rounded-full hover:bg-blue-600 hover:text-white dark:hover:bg-blue-600 dark:hover:text-white transition-all duration-300 shadow-sm"
                      title={t("common.edit")}
                    >
                      <i className="fa-solid fa-pen text-sm"></i>
                    </button>
                    <button
                      onClick={() => handleDelete(b.id)}
                      className="w-10 h-10 flex items-center justify-center bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400 rounded-full hover:bg-red-600 hover:text-white dark:hover:bg-red-600 dark:hover:text-white transition-all duration-300 shadow-sm"
                      title={t("common.delete")}
                    >
                      <i className="fa-solid fa-trash text-sm"></i>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

