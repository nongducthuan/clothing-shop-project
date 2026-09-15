import React, { useRef } from "react";
import { useLanguage } from "../../../context/LanguageContext";
import { formatDisplayDateTime } from "../../../utils/dateUtils";

export default function VoucherForm({ formData, setFormData, onSubmit, editingId, onCancel }) {
  const { t } = useLanguage();
  // Refs để mở nhanh popup Lịch khi click vào khung bọc ngoài
  const startDateRef = useRef(null);
  const endDateRef = useRef(null);

  // Hàm chặn lăn chuột làm thay đổi số
  const handleWheel = (e) => {
    e.target.blur();
  };

  return (
    <>
      {/* CSS to hide number input spin buttons */}
      <style>{`
        .no-spinner::-webkit-inner-spin-button,
        .no-spinner::-webkit-outer-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
        .no-spinner {
          -moz-appearance: textfield;
        }
        /* Fix cho input date trên webkit để trông gọn hơn */
        ::-webkit-calendar-picker-indicator {
          cursor: pointer;
          opacity: 0.6;
          transition: opacity 0.2s;
        }
        ::-webkit-calendar-picker-indicator:hover {
          opacity: 1;
        }
      `}</style>

      <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-200/80 dark:border-slate-700 overflow-hidden h-full flex flex-col">
        <div className="bg-gradient-to-r from-indigo-500 to-indigo-700 p-4 shrink-0 flex justify-between items-center">
          <h2 className="text-sm font-bold text-white flex items-center gap-2 uppercase tracking-wider m-0 leading-none">
            <i className="fa-solid fa-ticket text-indigo-100"></i>
            {editingId ? t("admin.edit_voucher") : t("admin.form_title_voucher")}
          </h2>
        </div>

        <form onSubmit={onSubmit} className="p-6 space-y-4 flex-grow flex flex-col">
          {/* Code & Discount % */}
          <div className="grid grid-cols-2 gap-3">
            <input
              type="text"
              placeholder={t("admin.code_placeholder")}
              value={formData.code}
              className="p-4 bg-slate-50 dark:bg-slate-700/60 border border-slate-200/80 dark:border-slate-600 rounded-2xl focus:ring-2 focus:ring-indigo-500 font-black uppercase outline-none transition-all text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500"
              onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
              required
            />
            <div className="relative">
              <input
                type="number"
                placeholder={t("admin.discount_percent_placeholder")}
                value={formData.discount_percent}
                onWheel={handleWheel}
                className="w-full p-4 bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/50 rounded-2xl focus:ring-2 focus:ring-indigo-500 font-bold text-indigo-600 dark:text-indigo-400 pr-8 no-spinner outline-none transition-all placeholder:text-indigo-300 dark:placeholder:text-indigo-500"
                onChange={(e) => setFormData({ ...formData, discount_percent: e.target.value })}
                required
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 font-black text-indigo-400 dark:text-indigo-400 text-xl pointer-events-none">%</span>
            </div>
          </div>

          {/* Financial Limits */}
          <div className="grid grid-cols-2 gap-3">
            <input
              type="number"
              placeholder={t("admin.min_order_placeholder")}
              onWheel={handleWheel}
              className="w-full p-4 bg-slate-50 dark:bg-slate-700/60 border border-slate-200/80 dark:border-slate-600 rounded-xl no-spinner outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500"
              value={formData.min_order_value}
              onChange={(e) => setFormData({ ...formData, min_order_value: e.target.value })}
            />
            <input
              type="number"
              placeholder={t("admin.max_discount_placeholder")}
              onWheel={handleWheel}
              className="w-full p-4 bg-slate-50 dark:bg-slate-700/60 border border-slate-200/80 dark:border-slate-600 rounded-xl no-spinner outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500"
              value={formData.max_discount_amount}
              onChange={(e) => setFormData({ ...formData, max_discount_amount: e.target.value })}
            />
          </div>

          <input
            type="number"
            placeholder={t("admin.usage_limit_placeholder")}
            onWheel={handleWheel}
            className="w-full p-4 bg-slate-50 dark:bg-slate-700/60 border border-slate-200/80 dark:border-slate-600 rounded-2xl no-spinner outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500"
            value={formData.usage_limit}
            onChange={(e) => setFormData({ ...formData, usage_limit: e.target.value })}
          />

          {/* Validity Period */}
          <div className="grid grid-cols-2 gap-3">

            {/* Start Date */}
            <div
              className="relative p-3 bg-slate-50 dark:bg-slate-700/60 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-2xl cursor-pointer transition-colors border border-slate-200/80 dark:border-slate-600 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500"
              onClick={() => startDateRef.current?.showPicker()}
            >
              <label className="text-[10px] font-bold text-slate-400 dark:text-slate-400 uppercase block mb-1 cursor-pointer pointer-events-none">{t("admin.start_label")}</label>
              <div className="flex items-center justify-between pointer-events-none">
                <span className={`text-xs font-semibold ${formData.start_date ? 'text-slate-700 dark:text-slate-200' : 'text-slate-400 dark:text-slate-400'}`}>
                  {formatDisplayDateTime(formData.start_date)}
                </span>
                <i className="fa-regular fa-calendar text-slate-400 text-xs"></i>
              </div>
              <input
                ref={startDateRef}
                type="datetime-local"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                required
              />
            </div>

            {/* End Date */}
            <div
              className="relative p-3 bg-slate-50 dark:bg-slate-700/60 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-2xl cursor-pointer transition-colors border border-slate-200/80 dark:border-slate-600 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500"
              onClick={() => endDateRef.current?.showPicker()}
            >
              <label className="text-[10px] font-bold text-slate-400 dark:text-slate-400 uppercase block mb-1 cursor-pointer pointer-events-none">{t("admin.end_label")}</label>
              <div className="flex items-center justify-between pointer-events-none">
                <span className={`text-xs font-semibold ${formData.end_date ? 'text-slate-700 dark:text-slate-200' : 'text-slate-400 dark:text-slate-400'}`}>
                  {formatDisplayDateTime(formData.end_date)}
                </span>
                <i className="fa-regular fa-calendar text-slate-400 text-xs"></i>
              </div>
              <input
                ref={endDateRef}
                type="datetime-local"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                required
              />
            </div>

          </div>

          <div className="flex gap-3 mt-4">
            {editingId && (
              <button
                type="button"
                onClick={onCancel}
                className="flex-1 py-3 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-xl font-bold text-xs tracking-wider uppercase transition-all"
              >
                {t("common.cancel")}
              </button>
            )}
            <button
              type="submit"
              className="flex-1 py-3 bg-gradient-to-r from-indigo-500 to-indigo-700 hover:from-indigo-600 hover:to-indigo-800 text-white rounded-xl font-bold text-xs tracking-wider hover:scale-[1.01] transition-all shadow-md shadow-indigo-200/50 uppercase"
            >
              {editingId ? t("admin.update_voucher") : t("admin.create_voucher")}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
