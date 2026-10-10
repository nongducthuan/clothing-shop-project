import { useLanguage } from "../../../context/LanguageContext";
import { formatCurrency } from "../../../utils/currencyUtils";
import ReturnItemsSelector from "../return/ReturnItemsSelector";
import ReturnBankInfoFields from "../return/ReturnBankInfoFields";
import ReturnEvidenceUpload from "../return/ReturnEvidenceUpload";
import type { ReturnSelectableItem, ReturnSelectedItems } from "../return/ReturnItemsSelector";

export default function ReturnRequestModal({ state, actions }: { state: Record<string, unknown>; actions: Record<string, unknown> }) {
  const { t, getReturnReasonLabel, language } = useLanguage();
  const returnData = state.returnData as Record<string, unknown>;
  const returnOrder = state.returnOrder as Record<string, unknown>;
  const setShowReturnModal = actions.setShowReturnModal as (show: boolean) => void;
  const handleReturnDataChange = actions.handleReturnDataChange as (field: string, value: unknown) => void;
  const handleSubmitReturn = actions.handleSubmitReturn as () => void;

  const items = (returnOrder?.items as ReturnSelectableItem[]) || [];
  const selectedItems = (returnData?.selectedItems as ReturnSelectedItems) || {};

  if (!state.showReturnModal) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in" onClick={() => setShowReturnModal(false)}>
      <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 w-full max-w-lg rounded-[2rem] shadow-xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="px-8 py-6 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80">
          <h3 className="font-medium text-slate-900 dark:text-slate-100 text-lg">{t("lookup.return_title", "Yêu cầu đổi trả")}</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{t("lookup.order_no", "Đơn hàng #{id}").replace("{id}", String(state.returnOrderId))}</p>
        </div>

        <div className="p-6 max-h-[75vh] overflow-y-auto space-y-5 custom-scrollbar">
          {items.length > 0 && (
            <ReturnItemsSelector
              items={items}
              selectedItems={selectedItems}
              onChange={(next) => handleReturnDataChange("selectedItems", next)}
              formatCurrency={(value, lang) => formatCurrency(value, lang || language)}
            />
          )}

          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2 ml-1">{t("lookup.reason_label", "Lý do đổi trả")}</label>
            <select
              required
              className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-slate-100 rounded-2xl p-4 text-sm outline-none focus:border-slate-900 dark:focus:border-slate-400 transition-colors"
              value={(returnData.reason as string) || ""}
              onChange={(e) => handleReturnDataChange("reason", e.target.value)}
            >
              <option value="">{t("lookup.reason_placeholder", "Chọn lý do")}</option>
              <option value="Damaged">{getReturnReasonLabel("Damaged")}</option>
              <option value="Wrong item">{getReturnReasonLabel("Wrong item")}</option>
              <option value="Not as described">{getReturnReasonLabel("Not as described")}</option>
              <option value="Change mind">{getReturnReasonLabel("Change mind")}</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2 ml-1">{t("lookup.desc_label", "Ghi chú thêm")}</label>
            <textarea
              required
              rows={3}
              className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-2xl p-4 text-sm outline-none focus:border-slate-900 dark:focus:border-slate-400 transition-colors resize-none"
              placeholder={t("lookup.desc_placeholder", "Mô tả vấn đề...")}
              value={(returnData.note as string) || ""}
              onChange={(e) => handleReturnDataChange("note", e.target.value)}
            />
          </div>

          <ReturnEvidenceUpload
            variant="card"
            files={returnData.images as File[] | FileList | null}
            onChange={(files) => handleReturnDataChange("images", files)}
          />

          <ReturnBankInfoFields
            variant="card"
            values={{
              bankName: String(returnData.bankName || ""),
              bankNumber: String(returnData.bankNumber || ""),
              accountHolder: String(returnData.accountHolder || ""),
            }}
            onChange={(field, value) => handleReturnDataChange(field, value)}
          />

          <div className="flex gap-4 pt-2">
            <button type="button" onClick={() => setShowReturnModal(false)} className="flex-1 py-3.5 text-slate-600 dark:text-slate-300 font-medium bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-full hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors text-sm">
              {t("lookup.cancel", "Hủy")}
            </button>
            <button type="button" onClick={handleSubmitReturn} className="flex-1 py-3.5 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-medium rounded-full hover:bg-slate-800 dark:hover:bg-white transition-colors text-sm shadow-md">
              {t("lookup.submit_return", "Gửi yêu cầu")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
