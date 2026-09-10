import React from "react";
import { getImageUrl } from "../../../utils/imageUtils";
import { useLanguage } from "../../../context/LanguageContext";

export default function BannerForm({
  form,
  setForm,
  handleSubmit,
  handleFileUpload,
  uploading,
  editingId,
  onCancel,
}) {
  const { t } = useLanguage();

  return (
    <div className="flex flex-col h-full">
      <h3 className="text-xl font-extrabold mb-6 text-slate-800 dark:text-slate-100 flex items-center gap-3 m-0 leading-none">
        {editingId ? (
          <><i className="fa-solid fa-pen-to-square text-violet-500 dark:text-violet-400"></i> {t("admin.edit_banner")}</>
        ) : (
          <><i className="fa-solid fa-plus-circle text-violet-500 dark:text-violet-400"></i> {t("admin.add_new_banner")}</>
        )}
      </h3>

      <form onSubmit={handleSubmit} className="space-y-6 flex-1 flex flex-col">
        {/* Title Input VI / EN */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 ml-1">{t("admin.banner_title_vi")}</label>
            <input
              type="text"
              required
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700/60 border border-slate-200/80 dark:border-slate-600 focus:bg-white dark:focus:bg-slate-700 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 rounded-2xl transition-all duration-300 outline-none text-slate-800 dark:text-slate-100 font-medium placeholder:text-slate-400 dark:placeholder:text-slate-500"
              value={form.title_vi || ""}
              onChange={(e) => setForm({ ...form, title_vi: e.target.value, title: e.target.value })}
              placeholder={t("admin.banner_title")}
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 ml-1">{t("admin.banner_title_en")}</label>
            <input
              type="text"
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700/60 border border-slate-200/80 dark:border-slate-600 focus:bg-white dark:focus:bg-slate-700 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 rounded-2xl transition-all duration-300 outline-none text-slate-800 dark:text-slate-100 font-medium placeholder:text-slate-400 dark:placeholder:text-slate-500"
              value={form.title_en || ""}
              onChange={(e) => setForm({ ...form, title_en: e.target.value })}
              placeholder={t("admin.banner_title")}
            />
          </div>
        </div>

        {/* Subtitle Input VI / EN */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 ml-1">{t("admin.banner_subtitle_vi")}</label>
            <input
              type="text"
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700/60 border border-slate-200/80 dark:border-slate-600 focus:bg-white dark:focus:bg-slate-700 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 rounded-2xl transition-all duration-300 outline-none text-slate-800 dark:text-slate-100 font-medium placeholder:text-slate-400 dark:placeholder:text-slate-500"
              value={form.subtitle_vi || ""}
              onChange={(e) => setForm({ ...form, subtitle_vi: e.target.value, subtitle: e.target.value })}
              placeholder={t("admin.description_placeholder")}
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 ml-1">{t("admin.banner_subtitle_en")}</label>
            <input
              type="text"
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700/60 border border-slate-200/80 dark:border-slate-600 focus:bg-white dark:focus:bg-slate-700 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 rounded-2xl transition-all duration-300 outline-none text-slate-800 dark:text-slate-100 font-medium placeholder:text-slate-400 dark:placeholder:text-slate-500"
              value={form.subtitle_en || ""}
              onChange={(e) => setForm({ ...form, subtitle_en: e.target.value })}
              placeholder={t("admin.description_placeholder")}
            />
          </div>
        </div>

        {/* Image Upload & Preview */}
        <div>
          <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 ml-1">{t("admin.upload_banner_image")}</label>

          {/* File Input styling */}
          <div className="relative mb-3">
            <input
              type="file"
              onChange={handleFileUpload}
              accept="image/*"
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            />
            <div className="w-full px-4 py-3 bg-blue-50/50 dark:bg-blue-950/30 border border-dashed border-blue-200 dark:border-blue-800 rounded-2xl flex items-center justify-center gap-2 text-violet-600 dark:text-violet-400 hover:bg-blue-50 dark:hover:bg-blue-950/50 transition-colors duration-300">
              <i className="fa-solid fa-cloud-arrow-up"></i>
              <span className="font-semibold text-sm">{t("admin.upload_banner_image")}</span>
            </div>
          </div>

          {/* URL Input */}
          <input
            type="text"
            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700/60 border border-slate-200/80 dark:border-slate-600 focus:bg-white dark:focus:bg-slate-700 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 rounded-2xl transition-all duration-300 outline-none text-slate-500 dark:text-slate-400 text-sm font-medium mb-3 placeholder:text-slate-400 dark:placeholder:text-slate-500"
            value={form.imageUrl}
            onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
            placeholder={t("admin.banner_image_url_placeholder")}
          />

          {uploading && (
            <p className="text-xs font-bold text-blue-500 animate-pulse ml-1 mb-2">
              <i className="fa-solid fa-spinner fa-spin mr-1"></i> {t("common.loading")}
            </p>
          )}

          {/* Image Preview */}
          {form.imageUrl ? (
            <div className="w-full h-32 rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-700 shadow-inner border border-slate-200/80 dark:border-slate-600 relative group mt-2">
              <img
                src={getImageUrl(form.imageUrl)}
                alt="Xem trước ảnh banner"
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
             <div className="w-full h-32 rounded-2xl bg-slate-50 dark:bg-slate-700/40 border border-dashed border-slate-300 dark:border-slate-600 flex flex-col items-center justify-center text-slate-400 mt-2">
               <i className="fa-solid fa-image text-2xl mb-1"></i>
             </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 pt-4 mt-auto">
          <button
            type="submit"
            disabled={uploading}
            className={`flex-1 text-white px-6 py-3.5 rounded-full font-bold transition-all duration-300 shadow-sm flex justify-center items-center gap-2 ${
              uploading
                ? "bg-violet-300 cursor-not-allowed"
                : editingId
                  ? "bg-yellow-500 hover:bg-yellow-600 hover:shadow-md hover:-translate-y-0.5"
                  : "bg-violet-600 hover:bg-violet-700 hover:shadow-md hover:-translate-y-0.5"
            }`}
          >
            {editingId ? t("admin.save_changes") : t("admin.create_banner")}
          </button>

          {editingId && (
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-3.5 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold rounded-full hover:bg-slate-200 dark:hover:bg-slate-600 transition-all duration-300"
            >
              {t("common.cancel")}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
