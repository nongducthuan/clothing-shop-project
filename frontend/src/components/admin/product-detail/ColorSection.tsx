import React from "react";
import { getImageUrl } from "../../../utils/imageUtils";
import { useLanguage } from "../../../context/LanguageContext";

export default function ColorSection({
  colors,
  selectedColorId,
  onSelectColor,
  onDeleteColor,
  colorForm,
  setColorForm,
  onUploadImage,
  onAddColor,
  isUploading
}) {
  const { t, getLocalizedText } = useLanguage();
  return (
    <>
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 5px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background-color: #e2e8f0; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background-color: #cbd5e1; }

        /* Custom Color Input Styling */
        input[type="color"]::-webkit-color-swatch-wrapper { padding: 0; }
        input[type="color"]::-webkit-color-swatch { border: none; border-radius: 50%; }
      `}</style>

      {/* Đổi h-[800px] thành h-fit để tránh khoảng trắng thừa */}
      <div className="lg:col-span-4 bg-white dark:bg-slate-800 p-6 md:p-8 shadow-sm rounded-[2rem] border border-slate-200/80 dark:border-slate-700 flex flex-col h-fit">
        <h4 className="font-extrabold text-lg text-slate-800 dark:text-slate-100 mb-6 flex items-center gap-3 m-0 leading-none">
          <div className="w-8 h-8 bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 rounded-full flex items-center justify-center text-sm">
            1
          </div>
          {t("admin.pd_color_section")}
        </h4>

        {/* Scrollable Color List (Giới hạn max-height để nếu có nhiều màu thì tự cuộn) */}
        <div className="max-h-[350px] overflow-y-auto custom-scrollbar pr-2 space-y-3 mb-6">
          {colors.map((color) => {
            const isSelected = selectedColorId === color.id;
            return (
              <div
                key={color.id}
                onClick={() => onSelectColor(color.id)}
                className={`p-3 rounded-2xl border flex items-center justify-between cursor-pointer transition-all duration-300 ${isSelected
                  ? "border-indigo-500 bg-indigo-50/50 dark:bg-indigo-900/20 shadow-sm"
                  : "border-slate-200/80 dark:border-slate-600/60 bg-white dark:bg-slate-700/40 hover:border-slate-300 dark:hover:border-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700/60"
                  }`}
              >
                <div className="flex items-center gap-4">
                  {/* Image Thumbnail */}
                  <div className={`w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 ${isSelected ? "border-2 border-indigo-200 dark:border-indigo-500" : "bg-slate-100 dark:bg-slate-600"}`}>
                    {color.image_url ? (
                      <img
                        src={getImageUrl(color.image_url)}
                        className="w-full h-full object-cover"
                        alt={getLocalizedText(color, "color_name") || color.color_name}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-300 dark:text-slate-500">
                        <i className="fa-solid fa-image"></i>
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div>
                    <p className={`font-black text-sm truncate ${isSelected ? "text-indigo-800 dark:text-indigo-300" : "text-slate-700 dark:text-slate-200"}`}>
                      {getLocalizedText(color, "color_name") || color.color_name}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="w-3 h-3 rounded-full border border-slate-200 dark:border-slate-600 shadow-sm" style={{ backgroundColor: color.color_code }}></span>
                      <span className="text-[10px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider">{color.color_code}</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={(e) => { e.stopPropagation(); onDeleteColor(color.id); }}
                  className="w-8 h-8 flex items-center justify-center text-rose-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-full transition-colors flex-shrink-0"
                  title={t("admin.pd_delete_color_title")}
                >
                  <i className="fa-solid fa-trash text-sm"></i>
                </button>
              </div>
            );
          })}
          {colors.length === 0 && (
            <div className="text-center py-6 text-slate-400 italic text-sm border-2 border-dashed border-slate-200/80 dark:border-slate-700 rounded-2xl">
              {t("admin.pd_no_colors")}
            </div>
          )}
        </div>

        {/* Add New Color Form */}
        <div className="bg-slate-50 dark:bg-slate-700/40 p-5 rounded-[1.5rem] border border-slate-200/80 dark:border-slate-600/60">
          <h5 className="font-bold text-xs uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-4 flex items-center gap-2 m-0 leading-none">
            <i className="fa-solid fa-plus-circle text-indigo-400"></i> {t("admin.pd_add_color")}
          </h5>

          <div className="space-y-3">
            <div className="flex gap-3">
              {/* Color Picker Box */}
              <div className="relative w-12 h-12 flex-shrink-0 rounded-xl overflow-hidden border-2 border-white dark:border-slate-600 shadow-sm ring-1 ring-slate-200 dark:ring-slate-600 cursor-pointer group">
                <input
                  type="color"
                  className="absolute inset-0 w-[200%] h-[200%] -top-1/2 -left-1/2 cursor-pointer"
                  value={colorForm.color_code}
                  onChange={(e) => setColorForm({ ...colorForm, color_code: e.target.value })}
                />
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/20 pointer-events-none transition-opacity">
                  <i className="fa-solid fa-pen text-white text-xs"></i>
                </div>
              </div>

              {/* Name Inputs (VI / EN) */}
              <div className="flex-1 space-y-2">
                <input
                  className="w-full px-4 py-2 bg-white dark:bg-slate-700/60 border border-slate-200/80 dark:border-slate-600 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 rounded-xl transition-all outline-none text-sm font-bold text-slate-700 dark:text-slate-100"
                  placeholder={t("admin.pd_color_name_vi_placeholder")}
                  value={colorForm.color_name_vi}
                  onChange={(e) => setColorForm({ ...colorForm, color_name_vi: e.target.value })}
                />
                <input
                  className="w-full px-4 py-2 bg-white dark:bg-slate-700/60 border border-slate-200/80 dark:border-slate-600 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 rounded-xl transition-all outline-none text-sm font-bold text-slate-700 dark:text-slate-100"
                  placeholder={t("admin.pd_color_name_en_placeholder")}
                  value={colorForm.color_name_en}
                  onChange={(e) => setColorForm({ ...colorForm, color_name_en: e.target.value })}
                />
              </div>
            </div>

            {/* Image Upload Row */}
            <div className="flex flex-col gap-3">
              {/* Nút Upload đã kết nối hàm onUploadImage */}
              <div className="relative w-full">
                <input 
                  type="file" 
                  className="absolute inset-0 opacity-0 z-10 cursor-pointer" 
                  onChange={(e) => e.target.files?.[0] && onUploadImage(e.target.files[0])}
                />
                <div className="w-full py-3 bg-indigo-50 dark:bg-indigo-900/20 border-2 border-dashed border-indigo-200 dark:border-indigo-800/50 rounded-xl flex flex-col items-center justify-center gap-1 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-all">
                  <i className="fa-solid fa-cloud-arrow-up text-lg"></i>
                  <span className="text-[11px] font-bold uppercase">
                    {colorForm.image_url ? t("admin.pd_change_image") : t("admin.pd_upload_image")}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="h-[1px] flex-1 bg-slate-200 dark:bg-slate-600"></div>
                <span className="text-[10px] font-bold text-slate-400">{t("admin.pd_or")}</span>
                <div className="h-[1px] flex-1 bg-slate-200 dark:bg-slate-600"></div>
              </div>

              {/* Ô URL bên dưới */}
              <input
                className="w-full px-4 py-2 bg-white dark:bg-slate-700/60 border border-slate-200/80 dark:border-slate-600 rounded-xl text-xs text-slate-800 dark:text-slate-100"
                placeholder={t("admin.pd_image_url_placeholder")}
                value={colorForm.image_url || ""}
                onChange={(e) => setColorForm({ ...colorForm, image_url: e.target.value })}
              />
            </div>

            {isUploading && (
              <p className="text-xs font-bold text-indigo-500 animate-pulse text-center">
                <i className="fa-solid fa-spinner fa-spin mr-1"></i> {t("admin.pd_uploading")}
              </p>
            )}

            <button
              onClick={onAddColor}
              disabled={isUploading}
              className="w-full py-3 bg-slate-800 dark:bg-slate-700 text-white rounded-xl font-bold text-sm tracking-wider uppercase hover:bg-indigo-600 dark:hover:bg-indigo-500 transition-all shadow-sm disabled:opacity-50 mt-2"
            >
              {t("admin.pd_save_color")}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
