import { useState } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { useLanguage } from "../../../context/LanguageContext";

/**
 * Modal hoàn tác duyệt nhầm "Return Approved" — thay thế runbook SQL trong README.
 *
 * Đây là trạng thái DUY NHẤT không có nút Undo 1-click, vì hệ thống không biết
 * hàng đã thực sự về kho hay tiền đã hoàn ra ngoài thật chưa. Admin phải gọi điện
 * xác nhận với khách rồi chọn đúng 2 dữ kiện dưới đây:
 *   - "Hàng đã về kho chưa?"  → Chưa: backend trừ lại tồn kho đã cộng nhầm lúc approve
 *   - "Tiền đã hoàn chưa?"    → Chưa: backend đưa payment Refunded về Paid
 * Cả 2 câu bắt buộc chọn (không có mặc định) → tránh bấm ẩu làm lệch sổ.
 *
 * @param order           Đơn đang ở trạng thái Return Approved
 * @param onClose         Đóng modal
 * @param onConfirm       (orderId, { stockReturned, moneyRefunded }) => Promise<boolean>
 * @param formatCurrency  Hàm format tiền theo ngôn ngữ hiện tại
 */
export default function UndoApproveModal({ order, onClose, onConfirm, formatCurrency }) {
  const { t } = useLanguage();
  const [stockReturned, setStockReturned] = useState(null);
  const [moneyRefunded, setMoneyRefunded] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  if (!order) return null;

  const ready = stockReturned !== null && moneyRefunded !== null;

  const handleConfirm = async () => {
    if (!ready || submitting) return;
    setSubmitting(true);
    const ok = await onConfirm(order.id, { stockReturned, moneyRefunded });
    setSubmitting(false);
    if (ok) onClose();
  };

  const OptionBtn = ({ active, label, onClick }) => (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 py-2.5 rounded-full text-xs font-bold transition-all shadow-sm ${active
          ? "bg-slate-800 dark:bg-slate-100 text-white dark:text-slate-900"
          : "bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700"
        }`}
    >
      {label}
    </button>
  );

  return (
    <div className="fixed inset-0 z-[120] flex justify-center items-center p-4 bg-slate-900/60 dark:bg-black/70 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 rounded-[2rem] shadow-2xl w-full max-w-lg flex flex-col animate-scaleIn overflow-hidden">

        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-slate-100 dark:border-slate-700 bg-amber-50/60 dark:bg-amber-950/20">
          <div className="min-w-0">
            <h4 className="text-lg font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-3 m-0 leading-none">
              <div className="w-10 h-10 bg-amber-100 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 rounded-full flex items-center justify-center text-sm flex-shrink-0">
                <RotateCcw size={18} />
              </div>
              {t("admin.undo_approve_title", "Hoàn tác duyệt nhầm")}
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-2">
              #{order.id} · {formatCurrency(order.total_price)}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 hover:bg-red-100 dark:hover:bg-red-950/50 hover:text-red-500 dark:hover:text-red-400 rounded-full transition-colors outline-none flex-shrink-0"
          >
            <i className="fa-solid fa-xmark text-lg"></i>
          </button>
        </div>

        {/* Body */}
        <div className="p-6 flex flex-col gap-5 overflow-y-auto custom-scrollbar">

          {/* Cảnh báo quy trình */}
          <div className="flex gap-3 p-4 bg-amber-50 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-500/30 rounded-2xl">
            <AlertTriangle size={18} className="text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700 dark:text-amber-300 font-medium m-0 leading-relaxed">
              {t(
                "admin.undo_approve_warn",
                "Chỉ hoàn tác SAU KHI đã gọi điện xác nhận với khách. Hệ thống không biết hàng đã về kho hay tiền đã hoàn ra ngoài thật chưa."
              )}
            </p>
          </div>

          {/* Câu hỏi 1 — kho */}
          <div>
            <p className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider mb-3 m-0">
              {t("admin.undo_stock_q", "Hàng đã được gửi trả về kho chưa?")}
            </p>
            <div className="flex gap-2.5">
              <OptionBtn
                active={stockReturned === true}
                label={t("admin.undo_yes", "Rồi")}
                onClick={() => setStockReturned(true)}
              />
              <OptionBtn
                active={stockReturned === false}
                label={t("admin.undo_no", "Chưa")}
                onClick={() => setStockReturned(false)}
              />
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-2.5 m-0">
              {stockReturned === false
                ? t("admin.undo_stock_no_hint", "Chưa về kho → hệ thống sẽ TRỪ LẠI tồn kho đã cộng nhầm.")
                : t("admin.undo_stock_yes_hint", "Đã về kho → giữ nguyên tồn kho.")}
            </p>
          </div>

          {/* Câu hỏi 2 — tiền */}
          <div>
            <p className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider mb-3 m-0">
              {t("admin.undo_money_q", "Tiền đã hoàn cho khách chưa?")}
            </p>
            <div className="flex gap-2.5">
              <OptionBtn
                active={moneyRefunded === true}
                label={t("admin.undo_yes", "Rồi")}
                onClick={() => setMoneyRefunded(true)}
              />
              <OptionBtn
                active={moneyRefunded === false}
                label={t("admin.undo_no", "Chưa")}
                onClick={() => setMoneyRefunded(false)}
              />
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-2.5 m-0">
              {moneyRefunded === false
                ? t("admin.undo_money_no_hint", "Chưa hoàn tiền → thanh toán trở về \"Đã thanh toán\".")
                : t("admin.undo_money_yes_hint", "Đã hoàn tiền → giữ nguyên \"Đã hoàn tiền\".")}
            </p>
          </div>

          {/* Hệ quả chung */}
          <div className="p-4 bg-slate-50 dark:bg-slate-700/40 border border-slate-100 dark:border-slate-700 rounded-2xl">
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium m-0 leading-relaxed">
              {t(
                "admin.undo_common_hint",
                "Doanh thu ngày giao và tổng chi tiêu của khách sẽ được cộng lại; đơn trở về \"Yêu cầu đổi trả\" và yêu cầu đổi trả về \"Chờ duyệt đổi trả\" (giữ lịch sử)."
              )}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-6 pt-0">
          <button
            onClick={onClose}
            className="flex-1 py-3 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-full font-bold text-xs uppercase tracking-wider transition-colors shadow-sm"
          >
            {t("common.cancel", "Hủy")}
          </button>
          <button
            onClick={handleConfirm}
            disabled={!ready || submitting}
            className="flex-1 min-w-0 py-3 px-4 bg-amber-500 hover:bg-amber-600 text-white rounded-full font-bold text-xs uppercase tracking-wider transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {submitting ? (
              <i className="fa-solid fa-spinner fa-spin shrink-0"></i>
            ) : (
              <RotateCcw size={14} className="shrink-0" />
            )}
            <span className="text-center leading-snug whitespace-normal">
              {t("admin.undo_confirm_btn", 'Hoàn tác về "Yêu cầu đổi trả"')}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}