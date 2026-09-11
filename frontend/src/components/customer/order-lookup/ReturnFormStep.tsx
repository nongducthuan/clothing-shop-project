import React from "react";
import { useLanguage } from "../../../context/LanguageContext";

export default function ReturnFormStep({
  returnForm, setReturnForm, selectedOrder, formatCurrency,
  handleReturnSubmit, loading, onCancel
}) {
  const { t } = useLanguage();
  const inputCls = "w-full p-2.5 border border-gray-300 dark:border-slate-600 rounded-lg text-sm outline-none focus:ring-2 focus:ring-violet-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 placeholder:text-gray-400 dark:placeholder:text-slate-500";

  return (
    <form onSubmit={handleReturnSubmit} className="space-y-4">
      <div className="bg-violet-50 dark:bg-violet-900/30 p-3 rounded-lg text-xs sm:text-sm text-violet-700 dark:text-violet-300 mb-4 flex flex-wrap justify-between items-center gap-1 border border-violet-100 dark:border-violet-700">
        <span>{t("lookup.order_code")} <strong>#{selectedOrder?.id}</strong></span>
        <span>{t("lookup.total")} <strong>{formatCurrency(selectedOrder?.total_price)}</strong></span>
      </div>

      <div>
        <label className="block text-xs font-bold text-gray-500 dark:text-slate-400 uppercase mb-1">{t("lookup.reason_label")}</label>
        <select
          required
          className={inputCls}
          value={returnForm.reason_code}
          onChange={(e) => setReturnForm({ ...returnForm, reason_code: e.target.value })}
        >
          <option value="">{t("lookup.reason_placeholder")}</option>
          <option value="Damaged">{t("lookup.reason_damaged")}</option>
          <option value="Wrong item">{t("lookup.reason_wrong_item")}</option>
          <option value="Not as described">{t("lookup.reason_not_as_described")}</option>
          <option value="Change mind">{t("lookup.reason_change_mind")}</option>
        </select>
      </div>

      <div>
        <label className="block text-xs font-bold text-gray-500 dark:text-slate-400 uppercase mb-1">{t("lookup.desc_label")}</label>
        <textarea
          required
          rows={3}
          className={inputCls}
          placeholder={t("lookup.desc_placeholder")}
          value={returnForm.description}
          onChange={(e) => setReturnForm({ ...returnForm, description: e.target.value })}
        ></textarea>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="col-span-1 sm:col-span-2">
          <label className="block text-[11px] font-bold text-gray-500 dark:text-slate-400 uppercase">{t("lookup.refund_info")}</label>
        </div>
        <input
          type="text" placeholder={t("lookup.bank_name")} required
          className={inputCls}
          value={returnForm.bank_name}
          onChange={(e) => setReturnForm({ ...returnForm, bank_name: e.target.value })}
        />
        <input
          type="text" placeholder={t("lookup.bank_acc")} required
          className={inputCls}
          value={returnForm.bank_acc}
          onChange={(e) => setReturnForm({ ...returnForm, bank_acc: e.target.value })}
        />
        <input
          type="text" placeholder={t("lookup.bank_owner")} required
          className={`col-span-1 sm:col-span-2 p-2.5 border border-gray-300 dark:border-slate-600 rounded-lg text-sm outline-none focus:ring-2 focus:ring-violet-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 placeholder:text-gray-400 dark:placeholder:text-slate-500`}
          value={returnForm.bank_owner}
          onChange={(e) => setReturnForm({ ...returnForm, bank_owner: e.target.value })}
        />
      </div>

      <div>
        <label className="block text-xs font-bold text-gray-500 dark:text-slate-400 uppercase mb-1">
          {t("lookup.images_label")}
        </label>
        <input
          type="file"
          multiple
          accept="image/*"
          className="w-full text-xs sm:text-sm text-gray-500 dark:text-slate-400 file:mr-3 file:py-2 file:px-3 sm:file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-violet-50 dark:file:bg-violet-900/40 file:text-violet-700 dark:file:text-violet-300 hover:file:bg-violet-100 dark:hover:file:bg-violet-900/60"
          onChange={(e) => setReturnForm({ ...returnForm, images: Array.from(e.target.files) })}
        />
        {returnForm.images && returnForm.images.length > 0 && (
          <p className="text-xs text-violet-600 dark:text-violet-400 font-medium mt-1">
            <i className="fa-solid fa-paperclip mr-1"></i> {t("lookup.files_selected").replace("{count}", returnForm.images.length)}
          </p>
        )}
        <p className="text-[10px] text-gray-400 dark:text-slate-500 mt-1">{t("lookup.images_hint")}</p>
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="button" onClick={onCancel}
          className="flex-1 px-4 py-3 border border-gray-300 dark:border-slate-600 rounded-lg text-gray-600 dark:text-slate-300 font-bold text-sm hover:bg-gray-50 dark:hover:bg-slate-700 transition text-center"
        >
          {t("lookup.cancel")}
        </button>
        <button
          type="submit" disabled={loading}
          className="flex-1 px-4 py-3 bg-violet-600 text-white rounded-lg font-bold text-sm hover:bg-violet-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <i className="fa-solid fa-circle-notch fa-spin"></i> {t("lookup.sending")}
            </>
          ) : (
            t("lookup.submit_return")
          )}
        </button>
      </div>
    </form>
  );
}
