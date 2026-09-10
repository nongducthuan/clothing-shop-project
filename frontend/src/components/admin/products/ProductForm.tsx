import React from "react";
import { useLanguage } from "../../../context/LanguageContext";

export default function ProductForm({
  form,
  setForm,
  categories,
  editingId,
  uploading,
  mobileFormOpen,
  handleSubmit,
  handleFileUpload,
  resetForm
}) {
  const { t, getLocalizedText } = useLanguage();

  // Hàm chặn sự kiện lăn chuột làm thay đổi số
  const handleWheel = (e) => {
    e.target.blur();
  };

  return (
    <>
      {/* CSS ẩn nút tăng/giảm (spinners) của thẻ input type="number" */}
      <style>{`
        .no-spinner::-webkit-inner-spin-button,
        .no-spinner::-webkit-outer-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
        .no-spinner {
          -moz-appearance: textfield;
        }
      `}</style>

      <div className={`lg:col-span-4 ${mobileFormOpen ? "block" : "hidden lg:block"}`}>
        <div className="bg-white dark:bg-slate-800 p-6 md:p-8 rounded-[2rem] border border-slate-200/80 dark:border-slate-700 shadow-sm lg:sticky lg:top-24 transition-all duration-300">
          <h3 className="text-xl font-extrabold mb-6 text-slate-800 dark:text-slate-100 flex items-center gap-3 leading-none">
            {editingId ? (
              <><i className="fa-solid fa-pen-to-square text-violet-500 dark:text-violet-400"></i> {t("admin.edit_product")}</>
            ) : (
              <><i className="fa-solid fa-plus-circle text-violet-500 dark:text-violet-400"></i> {t("admin.create_product")}</>
            )}
          </h3>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            {/* Name Input VI / EN */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 ml-1">{t("admin.name_vi_label")}</label>
                <input
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700/60 border border-slate-200/80 dark:border-slate-600 focus:bg-white dark:focus:bg-slate-700 focus:border-violet-500 dark:focus:border-violet-400 focus:ring-4 focus:ring-violet-500/10 rounded-2xl transition-all duration-300 outline-none text-slate-800 dark:text-slate-100 font-medium placeholder:text-slate-400 dark:placeholder:text-slate-500"
                  value={form.name_vi || ""}
                  onChange={(e) => setForm({ ...form, name_vi: e.target.value, name: e.target.value })}
                  placeholder={t("admin.name_vi_placeholder")}
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 ml-1">{t("admin.name_en_label")}</label>
                <input
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700/60 border border-slate-200/80 dark:border-slate-600 focus:bg-white dark:focus:bg-slate-700 focus:border-violet-500 dark:focus:border-violet-400 focus:ring-4 focus:ring-violet-500/10 rounded-2xl transition-all duration-300 outline-none text-slate-800 dark:text-slate-100 font-medium placeholder:text-slate-400 dark:placeholder:text-slate-500"
                  value={form.name_en || ""}
                  onChange={(e) => setForm({ ...form, name_en: e.target.value })}
                  placeholder={t("admin.name_en_placeholder")}
                />
              </div>
            </div>
            {/* Hidden legacy single-name field kept for backward compat */}
            <input type="hidden" value={form.name} readOnly />

            {/* Prices Row: Cost Price & Selling Price */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 ml-1">{t("admin.original_price")} (đ)</label>
                <input
                  type="number"
                  onWheel={handleWheel}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700/60 border border-slate-200/80 dark:border-slate-600 focus:bg-white dark:focus:bg-slate-700 focus:border-violet-500 dark:focus:border-violet-400 focus:ring-4 focus:ring-violet-500/10 rounded-2xl transition-all duration-300 outline-none text-slate-800 dark:text-slate-100 font-medium no-spinner placeholder:text-slate-400 dark:placeholder:text-slate-500"
                  value={form.import_price || ""}
                  onChange={(e) => setForm({ ...form, import_price: e.target.value === "" ? "" : +e.target.value })}
                  placeholder={t("admin.original_price_placeholder")}
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 ml-1">{t("admin.price")} (đ)</label>
                <input
                  type="number"
                  onWheel={handleWheel}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700/60 border border-slate-200/80 dark:border-slate-600 focus:bg-white dark:focus:bg-slate-700 focus:border-violet-500 dark:focus:border-violet-400 focus:ring-4 focus:ring-violet-500/10 rounded-2xl transition-all duration-300 outline-none text-slate-800 dark:text-slate-100 font-medium no-spinner placeholder:text-slate-400 dark:placeholder:text-slate-500"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value === "" ? "" : +e.target.value })}
                  placeholder={t("admin.price_placeholder")}
                  required
                />
              </div>
            </div>

            {/* Gender & Category Row */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 ml-1">{t("admin.gender")}</label>
                <select
                  className="w-full px-3.5 py-3 bg-slate-50 dark:bg-slate-700/60 border border-slate-200/80 dark:border-slate-600 focus:bg-white dark:focus:bg-slate-700 focus:border-violet-500 dark:focus:border-violet-400 focus:ring-4 focus:ring-violet-500/10 rounded-2xl transition-all duration-300 outline-none text-slate-800 dark:text-slate-100 font-medium appearance-none cursor-pointer text-sm"
                  value={form.gender}
                  onChange={(e) => setForm({ ...form, gender: e.target.value, category_id: "" })}
                >
                  <option value="unisex">{t("gender.unisex")}</option>
                  <option value="male">{t("gender.male")}</option>
                  <option value="female">{t("gender.female")}</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 ml-1">{t("admin.category")}</label>
                <select
                  className="w-full px-3.5 py-3 bg-slate-50 dark:bg-slate-700/60 border border-slate-200/80 dark:border-slate-600 focus:bg-white dark:focus:bg-slate-700 focus:border-violet-500 dark:focus:border-violet-400 focus:ring-4 focus:ring-violet-500/10 rounded-2xl transition-all duration-300 outline-none text-slate-800 dark:text-slate-100 font-medium appearance-none cursor-pointer text-sm"
                  value={form.category_id}
                  onChange={(e) => setForm({ ...form, category_id: e.target.value })}
                  required
                >
                  <option value="">{t("admin.select_category")}</option>
                  {categories
                    .filter((c) => c.gender === form.gender)
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {getLocalizedText(c, "name")}
                      </option>
                    ))}
                </select>
              </div>
            </div>

            {/* Image Upload */}
            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 ml-1">{t("admin.main_image")}</label>
              <div className="relative mb-3">
                <input
                  type="file"
                  onChange={handleFileUpload}
                  accept="image/*"
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
                <div className="w-full px-4 py-3 bg-violet-50/50 dark:bg-violet-950/30 border border-dashed border-violet-200 dark:border-violet-800 rounded-2xl flex items-center justify-center gap-2 text-violet-600 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-950/50 transition-colors duration-300">
                  <i className="fa-solid fa-cloud-arrow-up"></i>
                  <span className="font-semibold text-sm">{t("admin.upload_images")}</span>
                </div>
              </div>
              <input
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700/60 border border-slate-200/80 dark:border-slate-600 focus:bg-white dark:focus:bg-slate-700 focus:border-violet-500 dark:focus:border-violet-400 focus:ring-4 focus:ring-violet-500/10 rounded-2xl transition-all duration-300 outline-none text-slate-500 dark:text-slate-400 text-sm font-medium mb-1"
                value={form.image_url}
                onChange={(e) => setForm({ ...form, image_url: e.target.value })}
                placeholder={t("admin.paste_image_url")}
              />
              {uploading && <span className="text-xs font-bold text-violet-500 animate-pulse ml-1"><i className="fa-solid fa-spinner fa-spin mr-1"></i> {t("common.loading")}</span>}
            </div>

            {/* Description VI / EN */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 ml-1">{t("admin.description_vi_label")}</label>
                <textarea
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700/60 border border-slate-200/80 dark:border-slate-600 focus:bg-white dark:focus:bg-slate-700 focus:border-violet-500 dark:focus:border-violet-400 focus:ring-4 focus:ring-violet-500/10 rounded-2xl transition-all duration-300 outline-none text-slate-800 dark:text-slate-100 font-medium resize-none placeholder:text-slate-400 dark:placeholder:text-slate-500"
                  rows={3}
                  value={form.description_vi || ""}
                  onChange={(e) => setForm({ ...form, description_vi: e.target.value })}
                  placeholder={t("admin.description_vi_placeholder_vi")}
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 ml-1">{t("admin.description_en_label")}</label>
                <textarea
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700/60 border border-slate-200/80 dark:border-slate-600 focus:bg-white dark:focus:bg-slate-700 focus:border-violet-500 dark:focus:border-violet-400 focus:ring-4 focus:ring-violet-500/10 rounded-2xl transition-all duration-300 outline-none text-slate-800 dark:text-slate-100 font-medium resize-none placeholder:text-slate-400 dark:placeholder:text-slate-500"
                  rows={3}
                  value={form.description_en || ""}
                  onChange={(e) => setForm({ ...form, description_en: e.target.value })}
                  placeholder={t("admin.description_en_placeholder_en")}
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={uploading}
                className={`flex-1 py-3.5 rounded-full font-bold text-white transition-all duration-300 shadow-sm ${
                  uploading
                    ? "bg-violet-300 cursor-not-allowed"
                    : editingId
                      ? "bg-yellow-500 hover:bg-yellow-600 hover:-translate-y-0.5 hover:shadow-md"
                      : "bg-violet-600 hover:bg-violet-700 hover:-translate-y-0.5 hover:shadow-md"
                }`}
              >
                {editingId ? t("admin.save_changes") : t("admin.create_product")}
              </button>
              {editingId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-6 py-3.5 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold rounded-full hover:bg-slate-200 dark:hover:bg-slate-600 transition-all duration-300"
                >
                  {t("common.cancel")}
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </>
  );
}

