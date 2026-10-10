import { useLanguage } from "../../../context/LanguageContext";
import ReturnItemsList from "./ReturnItemsList";
import ReturnEvidenceGallery from "./ReturnEvidenceGallery";

export interface BankInfo {
  name?: string;
  bankName?: string;
  acc?: string;
  bankNumber?: string;
  owner?: string;
  [key: string]: unknown;
}

export interface ReturnItem {
  order_item_id?: number | string;
  is_gift?: boolean;
  return_quantity?: number | string;
  refund_amount?: number | string;
  image?: string;
  image_url?: string;
  order_item?: ReturnItemOrderDetail;
  [key: string]: unknown;
}

export interface ReturnItemOrderDetail {
  product?: Record<string, unknown>;
  product_name?: string;
  color_name?: string;
  size?: string;
  is_gift?: boolean;
  color?: { image_url?: string };
  product_detail?: { image_url?: string };
  [key: string]: unknown;
}

export interface ReturnOrderItem {
  id?: number | string;
  image?: string;
  image_url?: string;
  color_image?: string;
  product_image?: string;
  [key: string]: unknown;
}

export interface ReturnOrder {
  status?: string;
  return_reason?: string;
  return_reason_code?: string;
  refund_amount?: number;
  refund_bank_info?: BankInfo;
  return_items?: ReturnItem[];
  return_images?: string[];
  items?: ReturnOrderItem[];
  [key: string]: unknown;
}

export default function ReturnInfoSection({
  order,
  formatCurrency,
}: {
  order: ReturnOrder;
  formatCurrency?: (val: number | string) => string;
}) {
  const { t, getLocalizedLabel } = useLanguage();
  const bankInfo = order.refund_bank_info;

  const getReturnBadge = (status: string) => {
    if (status === "Return Approved" || status === "Return_Approved") {
      return (
        <span className="text-[10px] font-extrabold uppercase tracking-widest bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 px-2.5 py-1 rounded-full border border-emerald-300/40 dark:border-emerald-900/40 whitespace-nowrap inline-flex items-center shrink-0">
          {t("admin.return_approved_badge", "Đã chấp nhận đổi trả")}
        </span>
      );
    }
    if (status === "Return Rejected" || status === "Return_Rejected") {
      return (
        <span className="text-[10px] font-extrabold uppercase tracking-widest bg-rose-100 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 px-2.5 py-1 rounded-full border border-rose-300/40 dark:border-rose-900/40 whitespace-nowrap inline-flex items-center shrink-0">
          {t("admin.return_rejected_badge", "Đã từ chối đổi trả")}
        </span>
      );
    }
    // Nhánh còn lại = yêu cầu CHƯA có quyết định (Return Requested, hoặc đơn cũ
    // Delivered + return_status Pending sau khi hoàn tác duyệt nhầm) → cùng nhãn
    // "Chờ duyệt đổi trả" với badge trạng thái yêu cầu (order_status.return_pending).
    return (
      <span className="text-[10px] font-extrabold uppercase tracking-widest bg-amber-200/60 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 px-2.5 py-1 rounded-full border border-amber-300/40 dark:border-amber-900/40 whitespace-nowrap inline-flex items-center shrink-0">
        {t("admin.return_pending_badge", "Chờ duyệt đổi trả")}
      </span>
    );
  };

  return (
    <div className="bg-gradient-to-r from-amber-50/60 via-orange-50/40 to-amber-50/60 dark:from-amber-950/30 dark:via-orange-950/20 dark:to-amber-950/30 p-5 sm:p-6 rounded-[1.75rem] border border-amber-200/60 dark:border-amber-900/40 text-sm shadow-sm space-y-4">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <h5 className="font-extrabold text-amber-900 dark:text-amber-200 text-[11px] sm:text-xs uppercase tracking-wider flex items-center gap-2 m-0 leading-none whitespace-nowrap">
          <span className="w-7 h-7 rounded-full bg-amber-100/80 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 flex items-center justify-center text-xs shadow-xs shrink-0">
            <i className="fa-solid fa-rotate-left"></i>
          </span>
          {t("admin.return_request_details", "Thông tin yêu cầu đổi trả")}
        </h5>
        {getReturnBadge(order.status || "")}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-stretch">

        <div className="bg-white dark:bg-slate-700 p-5 rounded-2xl shadow-sm flex flex-col justify-start space-y-4">
          <div>
            <span className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-400 mb-1">
              {t("admin.return_reason", "Lý do đổi trả")}
            </span>
            <span className="inline-block bg-slate-100 dark:bg-slate-600 text-slate-800 dark:text-slate-200 text-xs font-extrabold px-3 py-1 rounded-lg border border-slate-200/60 dark:border-slate-500/60">
              {getLocalizedLabel("returnReason", (order.reason_code as string) || (order.return_reason_code as string)) || t("admin.not_specified", "Chưa xác định")}
            </span>
          </div>

          <div className="flex-1 flex flex-col">
            <span className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-400 mb-1">
              {t("admin.customer_note", "Ghi chú từ khách hàng")}
            </span>
            <div className="flex-1 bg-slate-50 dark:bg-slate-600 rounded-xl p-3.5 text-xs text-slate-600 dark:text-slate-200 leading-relaxed min-h-[50px] flex items-start">
              {(order.description as string) || t("admin.no_description", "Không có ghi chú")}
            </div>
          </div>

          {(() => {
            const rawResponse = order.admin_response as string | undefined;
            const legacyResponses = ["Approved", "Rejected", "Rejected by admin", "Manually approved by admin", "Manually rejected by admin"];
            const displayResponse = rawResponse && legacyResponses.includes(rawResponse)
              ? t(`api_msg.${rawResponse}`, rawResponse)
              : rawResponse;
            const isApproved = order.status === "Return Approved" || order.status === "Return_Approved";
            if (!displayResponse && !isApproved) return null;
            return (
              <div>
                <span className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-400 mb-1">
                  {t("admin.admin_response", "Phản hồi từ Admin")}
                </span>
                <div className={`rounded-xl p-3.5 text-xs leading-relaxed min-h-[50px] flex items-center gap-2 ${isApproved && !displayResponse
                  ? "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-200 border border-emerald-200/60 dark:border-emerald-800/50 font-semibold"
                  : "bg-amber-50 dark:bg-amber-900/30 text-amber-900 dark:text-amber-200"
                  }`}>
                  {isApproved && !displayResponse && <i className="fa-solid fa-circle-check shrink-0"></i>}
                  {(displayResponse as string) || t("order_details.return_approved_note", "Đã chấp nhận đổi trả — chờ hoàn tiền.")}
                </div>
              </div>
            );
          })()}
        </div>

        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-white p-4 rounded-2xl shadow-lg relative overflow-hidden flex flex-col gap-4">
          <div className="absolute -right-4 -bottom-4 text-white/5 text-8xl pointer-events-none">
            <i className="fa-solid fa-building-columns"></i>
          </div>

          <div className="flex justify-between items-center relative z-10">
            <span className="text-[9px] uppercase font-bold text-slate-400 tracking-widest flex items-center gap-1.5">
              <i className="fa-solid fa-credit-card text-indigo-400"></i> {t("admin.refund_account", "Tài khoản nhận tiền hoàn")}
            </span>
            <i className="fa-solid fa-wifi text-slate-500 text-xs rotate-90"></i>
          </div>

          {bankInfo ? (
            <div className="relative z-10 flex flex-col gap-4 flex-1 justify-center">
              <div>
                <span className="block text-[9px] uppercase font-bold text-slate-500 tracking-widest mb-0.5">
                  {t("admin.bank_name_label", "Ngân hàng")}
                </span>
                <p className="text-[11px] font-bold text-slate-300 tracking-wide">
                  {bankInfo.name || bankInfo.bankName || "—"}
                </p>
              </div>
              <div>
                <span className="block text-[9px] uppercase font-bold text-slate-500 tracking-widest mb-0.5">
                  {t("admin.account_number_label", "Số tài khoản")}
                </span>
                <p className="text-base font-mono font-bold tracking-[0.15em] text-indigo-200 drop-shadow-sm">
                  {bankInfo.acc || bankInfo.bankNumber || "•••• •••• ••••"}
                </p>
              </div>
              <div className="pt-2 border-t border-white/10 flex justify-between items-center text-xs">
                <div>
                  <span className="block text-[9px] uppercase font-bold text-slate-500 tracking-widest mb-0.5">
                    {t("admin.account_owner_label", "Chủ tài khoản")}
                  </span>
                  <span className="font-bold text-slate-200 uppercase tracking-wider truncate max-w-[70%]" title={bankInfo.owner}>
                    {bankInfo.owner || t("admin.not_available", "N/A")}
                  </span>
                </div>
                <span className="text-[9px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-mono uppercase tracking-wider shrink-0">
                  {t("admin.verified", "Đã xác thực")}
                </span>
              </div>
            </div>
          ) : (
            <p className="text-xs italic text-slate-400 relative z-10 flex-1 flex items-center">
              {t("admin.missing_bank_info", "Chưa cung cấp thông tin ngân hàng")}
            </p>
          )}
        </div>
      </div>

      {(order.refund_amount ?? 0) > 0 && (
        <div className="bg-amber-100/60 dark:bg-amber-950/50 p-3 rounded-2xl flex justify-between items-center text-xs font-bold text-amber-900 dark:text-amber-200 border border-amber-200 dark:border-amber-800">
          <span>{t("admin.requested_refund_amount", "Tiền hoàn yêu cầu:")}</span>
          <span className="text-sm font-extrabold text-rose-600 dark:text-rose-400">
            {formatCurrency ? formatCurrency(order.refund_amount ?? 0) : `${Number(order.refund_amount ?? 0).toLocaleString()}đ`}
          </span>
        </div>
      )}

      <ReturnItemsList order={order} formatCurrency={formatCurrency} />

      <ReturnEvidenceGallery images={order.return_images} />
    </div>
  );
}
