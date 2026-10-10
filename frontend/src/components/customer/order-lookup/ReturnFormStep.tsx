import React from "react";
import { useLanguage } from "../../../context/LanguageContext";
import ReturnItemsSelector from "../return/ReturnItemsSelector";
import ReturnBankInfoFields from "../return/ReturnBankInfoFields";
import ReturnEvidenceUpload from "../return/ReturnEvidenceUpload";

export interface ReturnFormData {
  reason_code: string;
  description: string;
  bank_name: string;
  bank_acc: string;
  bank_owner: string;
  images?: File[];
  selectedItems?: Record<number | string, { selected: boolean; return_quantity: string | number }>;
  [key: string]: unknown;
}

export interface ReturnFormOrderItem {
  id?: number;
  quantity?: number;
  is_gift?: boolean;
  product_name?: string;
  image_url?: string | null;
  payable_amount?: number | string;
  product_id?: number;
  color?: string;
  size?: string;
  [key: string]: unknown;
}

export interface ReturnFormOrder {
  id?: number | string;
  total_price?: number | string;
  items?: ReturnFormOrderItem[];
  [key: string]: unknown;
}

export default function ReturnFormStep({
  returnForm, setReturnForm, selectedOrder, formatCurrency,
  handleReturnSubmit, loading, onCancel
}: {
  returnForm: ReturnFormData;
  setReturnForm: React.Dispatch<React.SetStateAction<ReturnFormData>>;
  selectedOrder: ReturnFormOrder | null;
  formatCurrency: (val: number | string) => string;
  handleReturnSubmit: (e: React.FormEvent) => void;
  loading: boolean;
  onCancel: () => void;
}) {
  const { t } = useLanguage();
  const inputCls = "w-full p-2.5 border border-gray-300 dark:border-slate-600 rounded-lg text-sm outline-none focus:ring-2 focus:ring-violet-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 placeholder:text-gray-400 dark:placeholder:text-slate-500";
  const items = selectedOrder?.items || [];
  const selectedItems = returnForm.selectedItems || {};

  return (
    <form onSubmit={handleReturnSubmit} className="space-y-4">
      <div className="bg-slate-50 dark:bg-slate-700/40 p-3 rounded-lg text-xs sm:text-sm text-slate-600 dark:text-slate-300 mb-4 flex flex-wrap justify-between items-center gap-1 border border-slate-200 dark:border-slate-600">
        <span>{t("lookup.order_code")} <strong className="text-slate-900 dark:text-slate-100">#{String(selectedOrder?.id)}</strong></span>
        <span>{t("lookup.total")} <strong className="text-slate-900 dark:text-slate-100">{formatCurrency(Number(selectedOrder?.total_price))}</strong></span>
      </div>

      {items.length > 0 && (
        <ReturnItemsSelector
          items={items}
          selectedItems={selectedItems}
          onChange={(nextSelectedItems) => setReturnForm({ ...returnForm, selectedItems: nextSelectedItems })}
          formatCurrency={(value) => formatCurrency(value)}
        />
      )}

      <div>
        <label className="block text-xs font-bold text-gray-500 dark:text-slate-400 uppercase mb-1">{t("lookup.reason_label")}</label>
        <select required className={inputCls} value={returnForm.reason_code} onChange={(e) => setReturnForm({ ...returnForm, reason_code: e.target.value })}>
          <option value="">{t("lookup.reason_placeholder")}</option>
          <option value="Damaged">{t("lookup.reason_damaged")}</option>
          <option value="Wrong item">{t("lookup.reason_wrong_item")}</option>
          <option value="Not as described">{t("lookup.reason_not_as_described")}</option>
          <option value="Change mind">{t("lookup.reason_change_mind")}</option>
        </select>
      </div>

      <div>
        <label className="block text-xs font-bold text-gray-500 dark:text-slate-400 uppercase mb-1">{t("lookup.desc_label")}</label>
        <textarea required rows={3} className={inputCls} placeholder={t("lookup.desc_placeholder")} value={returnForm.description} onChange={(e) => setReturnForm({ ...returnForm, description: e.target.value })} />
      </div>

      <ReturnBankInfoFields
        values={{
          bankName: returnForm.bank_name,
          bankNumber: returnForm.bank_acc,
          accountHolder: returnForm.bank_owner,
        }}
        onChange={(field, value) => {
          const map = { bankName: "bank_name", bankNumber: "bank_acc", accountHolder: "bank_owner" } as const;
          setReturnForm({ ...returnForm, [map[field]]: value });
        }}
      />

      <ReturnEvidenceUpload
        files={returnForm.images}
        onChange={(files) => setReturnForm({ ...returnForm, images: files })}
      />

      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onCancel} className="flex-1 px-4 py-3 border border-gray-300 dark:border-slate-600 rounded-lg text-gray-600 dark:text-slate-300 font-bold text-sm hover:bg-gray-50 dark:hover:bg-slate-700 transition text-center">
          {t("lookup.cancel")}
        </button>
        <button type="submit" disabled={loading} className="flex-1 px-4 py-3 bg-violet-600 text-white rounded-lg font-bold text-sm hover:bg-violet-700 transition disabled:opacity-50 flex items-center justify-center gap-2">
          {loading ? <><i className="fa-solid fa-circle-notch fa-spin"></i> {t("lookup.sending")}</> : t("lookup.submit_return")}
        </button>
      </div>
    </form>
  );
}
