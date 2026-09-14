import React from "react";
import { getImageUrl } from "../../../utils/imageUtils";
import { useLanguage } from "../../../context/LanguageContext";

export default function CategoryForm({
  form,
  setForm,
  handleChange,
  handleSubmit,
  loading,
  editingId,
  resetForm,
  recommendNames,
  categoryImages,
}) {
  const { t, language } = useLanguage();

  return (
    <div className="flex flex-col h-full">
      <h3 className="text-xl font-extrabold mb-6 text-slate-800 dark:text-slate-100 flex items-center gap-3 m-0 leading-none">
        {editingId ? (
          <><i className="fa-solid fa-pen-to-square text-violet-500 dark:text-violet-400"></i> {t("admin.edit_category")}</>
        ) : (
          <><i className="fa-solid fa-plus-circle text-violet-500 dark:text-violet-400"></i> {t("admin.add_new_category")}</>
        )}
      </h3>

      <form onSubmit={handleSubmit} className="space-y-6 flex-1">
        {/* Category Name VI / EN */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 ml-1">{t("admin.name_vi_label")}</label>
            <input
              name="name_vi"
              value={form.name_vi || ""}
              onChange={(e) => { handleChange(e); setForm((prev) => ({ ...prev, name: e.target.value })); }}
              required
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700/60 border border-slate-200/80 dark:border-slate-600 focus:bg-white dark:focus:bg-slate-700 focus:border-violet-500 dark:focus:border-violet-400 focus:ring-4 focus:ring-violet-500/10 rounded-2xl transition-all duration-300 outline-none text-slate-800 dark:text-slate-100 font-medium placeholder:text-slate-400 dark:placeholder:text-slate-500"
              placeholder={t("admin.ex_category_name_vi")}
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 ml-1">{t("admin.name_en_label")}</label>
            <input
              name="name_en"
              value={form.name_en || ""}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700/60 border border-slate-200/80 dark:border-slate-600 focus:bg-white dark:focus:bg-slate-700 focus:border-violet-500 dark:focus:border-violet-400 focus:ring-4 focus:ring-violet-500/10 rounded-2xl transition-all duration-300 outline-none text-slate-800 dark:text-slate-100 font-medium placeholder:text-slate-400 dark:placeholder:text-slate-500"
              placeholder={t("admin.ex_category_name_en")}
            />
          </div>
        </div>
        {/* Hidden legacy name */}
        <input type="hidden" name="name" value={form.name} readOnly />

          {recommendNames.length > 0 && (
            <div className="mt-3 p-4 border border-violet-100 dark:border-violet-900/50 rounded-[1.5rem] bg-violet-50/50 dark:bg-violet-950/30">
              <p className="font-bold text-xs uppercase tracking-wider text-violet-600 dark:text-violet-400 mb-3 ml-1">
                {t("admin.suggested_categories")}
              </p>
              <div className="flex flex-wrap gap-2">
                {recommendNames.map((item, idx) => {
                  const displayName = language === "vi" ? (item.name_vi || item.name) : item.name;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setForm((prev) => ({ ...prev, name: item.name, name_vi: item.name_vi || item.name, name_en: item.name }))}
                      title={item.name_vi ? `${item.name_vi} (${item.name})` : item.name}
                      className="px-4 py-1.5 bg-white dark:bg-slate-700 border border-violet-100 dark:border-violet-800 rounded-full shadow-sm hover:bg-violet-600 hover:text-white dark:hover:bg-violet-600 text-violet-700 dark:text-violet-300 text-sm font-semibold transition-colors duration-300"
                    >
                      {displayName}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

        {/* Gender Selection */}
        <div>
          <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 ml-1">{t("admin.gender")}</label>
          <select
            name="gender"
            value={form.gender}
            onChange={handleChange}
            required
            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700/60 border border-slate-200/80 dark:border-slate-600 focus:bg-white dark:focus:bg-slate-700 focus:border-violet-500 dark:focus:border-violet-400 focus:ring-4 focus:ring-violet-500/10 rounded-2xl transition-all duration-300 outline-none text-slate-800 dark:text-slate-100 font-medium appearance-none cursor-pointer"
          >
            <option value="">{t("admin.select_gender")}</option>
            <option value="male">{t("gender.male")}</option>
            <option value="female">{t("gender.female")}</option>
            <option value="unisex">{t("gender.unisex")}</option>
          </select>
        </div>

        {/* Cover Image Selection */}
        <div>
          <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 ml-1">{t("admin.cover_image")}</label>

          {editingId && categoryImages.length > 0 ? (
            <div className="grid grid-cols-4 gap-3 bg-slate-50 dark:bg-slate-700/50 p-3 rounded-[1.5rem] border border-slate-200/80 dark:border-slate-600">
              {categoryImages.map((img, idx) => {
                const imageSrc = img.image_url;
                return (
                  <div
                    key={idx}
                    onClick={() => setForm((prev) => ({ ...prev, image_url: imageSrc }))}
                    className={`relative rounded-2xl cursor-pointer overflow-hidden transition-all duration-300 ${
                      form.image_url === imageSrc
                        ? "ring-4 ring-violet-500 shadow-md scale-95"
                        : "opacity-70 hover:opacity-100 hover:scale-105"
                    }`}
                  >
                    <img
                      src={getImageUrl(imageSrc)}
                      className="w-full h-20 object-cover"
                      alt={`Preview ${idx}`}
                      onError={(e) => {
                        (e.target as HTMLImageElement).onerror = null;
                        (e.target as HTMLImageElement).src = getImageUrl(null);
                      }}
                    />
                    {form.image_url === imageSrc && (
                      <div className="absolute inset-0 bg-violet-500/20 flex items-center justify-center">
                        <i className="fa-solid fa-check-circle text-white text-xl drop-shadow-md"></i>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="px-4 py-6 bg-slate-50 dark:bg-slate-700/40 rounded-[1.5rem] border border-dashed border-slate-300 dark:border-slate-600 text-center">
              <i className="fa-solid fa-image text-slate-400 text-2xl mb-2"></i>
              <p className="text-slate-500 dark:text-slate-400 font-medium text-sm">
                {t("admin.select_category_for_image")}
              </p>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 pt-4 mt-auto">
          <button
            type="submit"
            disabled={loading}
            className={`flex-1 text-white px-6 py-3.5 rounded-full font-bold transition-all duration-300 shadow-sm flex justify-center items-center gap-2 ${
              loading
                ? "bg-violet-300 cursor-not-allowed"
                : "bg-violet-600 hover:bg-violet-700 hover:shadow-md hover:-translate-y-0.5"
            }`}
          >
            {loading ? <i className="fa-solid fa-spinner fa-spin"></i> : null}
            {editingId ? t("admin.save_changes") : t("admin.create_category")}
          </button>

          {editingId && (
            <button
              type="button"
              className="px-6 py-3.5 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold rounded-full hover:bg-slate-200 dark:hover:bg-slate-600 transition-all duration-300"
              onClick={resetForm}
            >
              {t("common.cancel")}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
