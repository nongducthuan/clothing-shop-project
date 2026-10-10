import { useLanguage } from "../../../../context/LanguageContext";
import type { ProfileOrder } from "../../../../hooks/customer/profileTypes";

// Format datetime deterministically as "HH:mm:ss dd/mm/yyyy" (Vietnamese style).
// Avoids locale/browser-dependent output like mm/dd/yyyy (en-US).
const formatOrderDateTime = (dateString?: string) => {
  if (!dateString) return "N/A";
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return "N/A";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())} ${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
};

const OrderDetailHeader = ({ order, onClose }: { order: ProfileOrder; onClose: () => void }) => {
  const { t } = useLanguage();
  return (
    <div className="px-4 py-3.5 sm:px-6 sm:py-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/80 shrink-0">
      <div>
        <h3 className="font-semibold text-slate-900 dark:text-slate-100 text-base sm:text-lg">{t('order_details.title', 'Đơn hàng')} #{order.id}</h3>
          <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {formatOrderDateTime(order.created_at)}
          </p>
      </div>
      <button
        onClick={onClose}
        className="w-8 h-8 rounded-full bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-400 dark:text-slate-300 hover:text-slate-700 dark:hover:text-slate-100 flex items-center justify-center transition-colors shadow-sm shrink-0"
      >
        <i className="fa-solid fa-xmark"></i>
      </button>
    </div>
  );
};

export default OrderDetailHeader;
