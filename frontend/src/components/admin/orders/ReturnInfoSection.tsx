import React from "react";
import { getImageUrl } from "../../../utils/imageUtils";
import { useLanguage } from "../../../context/LanguageContext";
import { balanceReturnItemsRefund } from "../../../utils/orderUtils";

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
  const { t, getLocalizedText, getLocalizedLabel } = useLanguage();
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
        {getReturnBadge(order.status)}
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


      {order.refund_amount > 0 && (
        <div className="bg-amber-100/60 dark:bg-amber-950/50 p-3 rounded-2xl flex justify-between items-center text-xs font-bold text-amber-900 dark:text-amber-200 border border-amber-200 dark:border-amber-800">
          <span>{t("admin.requested_refund_amount", "Tiền hoàn yêu cầu:")}</span>
          <span className="text-sm font-extrabold text-rose-600 dark:text-rose-400">
            {formatCurrency ? formatCurrency(order.refund_amount) : `${Number(order.refund_amount).toLocaleString()}đ`}
          </span>
        </div>
      )}

      {order.return_items && order.return_items.length > 0 && (
        <div className="pt-2 border-t border-amber-200/60 dark:border-amber-800/40 space-y-2">
          <span className="block text-[10px] font-extrabold text-amber-900/70 dark:text-amber-300/80 uppercase tracking-wider">
            {t("admin.items_to_return", "Sản phẩm muốn trả")} ({order.return_items.length})
          </span>
          <div className="space-y-1.5">
            {balanceReturnItemsRefund(order.return_items, order.refund_amount).map((ri: ReturnItem, idx: number) => {
              const orderItem = ri.order_item;
              const pName = String(getLocalizedText(orderItem?.product, "name") || orderItem?.product?.name || getLocalizedText(orderItem, "product_name") || orderItem?.product_name || `Item #${ri.order_item_id}`);
              const cName = String(getLocalizedText(orderItem, "color_name") || orderItem?.color_name || "");
              const sizeName = orderItem?.size;
              const isGift = Boolean(orderItem?.is_gift || ri.is_gift);

              const originalItem = order.items?.find((item: ReturnOrderItem) => item.id === ri.order_item_id);
              const rawImg = originalItem?.image || originalItem?.image_url || originalItem?.color_image || originalItem?.product_image || orderItem?.color?.image_url || (orderItem?.product as { image_url?: string } | undefined)?.image_url || ri.image || ri.image_url;
              const imageUrl = rawImg ? getImageUrl(rawImg) : getImageUrl(null);

              return (
                <div key={idx} className="bg-white dark:bg-slate-700 px-3 py-2.5 rounded-xl text-xs flex items-center justify-between gap-3 border border-amber-100 dark:border-slate-600 shadow-xs">

                  <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-lg overflow-hidden shrink-0 ${isGift ? 'border-2 border-white dark:border-amber-900/50 shadow-sm' : 'bg-gray-50 dark:bg-slate-800 border border-amber-50 dark:border-slate-600'}`}>
                    <img
                      src={imageUrl}
                      onError={(e) => {
                        (e.target as HTMLImageElement).onerror = null;
                        (e.target as HTMLImageElement).src = getImageUrl(null);
                      }}
                      alt={pName}
                      className="w-full h-full object-cover"
                    />
                  </div>


                  <div className="flex flex-col gap-0.5 min-w-0 w-full sm:flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span
                        className="font-medium text-slate-800 dark:text-slate-200 leading-snug line-clamp-2"
                        title={pName}
                      >
                        {pName}
                      </span>
                      {isGift && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-500 dark:text-slate-300 shrink-0">
                          <i className="fa-solid fa-gift" />
                          {t("lookup.gift_item_badge", "Quà tặng")}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5 mt-1 text-[11px] font-medium text-slate-500 dark:text-slate-400">
                      {cName && (
                        <span className="bg-white dark:bg-slate-700 border border-slate-200/80 dark:border-slate-600 px-1.5 py-0.5 rounded text-slate-600 dark:text-slate-300">
                          {t("admin.color_label", "Màu")}: {cName}
                        </span>
                      )}
                      {sizeName && (
                        <span className="bg-white dark:bg-slate-700 border border-slate-200/80 dark:border-slate-600 px-1.5 py-0.5 rounded text-slate-600 dark:text-slate-300">
                          {t("admin.size_label", "Size")}: {sizeName}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right shrink-0 flex flex-col items-end justify-center self-end sm:self-auto mt-1 sm:mt-0">
                    <p className={`font-semibold text-sm whitespace-nowrap leading-tight ${isGift ? "text-slate-700 dark:text-slate-300" : "text-slate-900 dark:text-slate-100"}`}>
                      {isGift ? (formatCurrency ? formatCurrency(0) : "0đ") : (formatCurrency && ri.refund_amount != null ? formatCurrency(ri.refund_amount) : `${Number(ri.refund_amount || 0).toLocaleString()}đ`)}
                    </p>
                    {ri.refund_amount != null && (
                      <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500 mt-0.5 whitespace-nowrap">
                        {isGift ? `${formatCurrency ? formatCurrency(0) : "0đ"} × ${ri.return_quantity}` : `${formatCurrency ? formatCurrency(Math.round(Number(ri.refund_amount) / Number(ri.return_quantity))) : `${Math.round(Number(ri.refund_amount) / Number(ri.return_quantity)).toLocaleString()}đ`} × ${ri.return_quantity}`}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}


      {order.return_images && order.return_images.length > 0 && (
        <div className="pt-3 border-t border-amber-200/60 dark:border-amber-900/40">
          <span className="block text-[10px] font-extrabold text-amber-900/70 dark:text-amber-200/70 uppercase mb-2.5 tracking-wider">
            {t("admin.evidence_attachments", "Ảnh minh chứng")} ({order.return_images.length})
          </span>
          <div className="flex flex-wrap gap-3">
            {(order.return_images as string[]).map((img: string, idx: number) => {
              const fullImgUrl = getImageUrl(img);
              return (
                <div key={idx} className="relative group">
                  <img
                    src={fullImgUrl}
                    alt={`${t("admin.evidence_attachments", "Ảnh minh chứng")} ${idx + 1}`}
                    className="w-20 h-20 object-cover rounded-xl border-2 border-white dark:border-slate-600 shadow-md cursor-pointer hover:scale-105 transition-transform duration-300"
                    onClick={() => window.open(fullImgUrl, '_blank')}
                  />
                  <div className="absolute inset-0 bg-black/20 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                    <i className="fa-solid fa-magnifying-glass-plus text-white text-xs"></i>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
