import React, { useState, useEffect } from "react";
import { useLanguage } from "../../../context/LanguageContext";
import { formatCurrency } from "../../../utils/currencyUtils";

interface ChangePaymentModalProps {
  isOpen: boolean;
  order: any;
  onClose: () => void;
  onConfirm: (newMethod: string) => Promise<void>;
  loading?: boolean;
}

export default function ChangePaymentModal({
  isOpen,
  order,
  onClose,
  onConfirm,
  loading = false,
}: ChangePaymentModalProps) {
  const { t, language } = useLanguage();
  const [selectedMethod, setSelectedMethod] = useState<string>("momo");

  useEffect(() => {
    if (order?.payment_method) {
      setSelectedMethod(order.payment_method.toLowerCase());
    }
  }, [order]);

  if (!isOpen || !order) return null;

  const methods = [
    {
      id: "momo",
      name: t("checkout.momo"),
      description: t("checkout.momo_desc"),
      icon: "fa-solid fa-wallet text-pink-500",
      bgColor: "bg-pink-50/70 border-pink-200 text-pink-900",
      activeBorder: "border-pink-500 ring-2 ring-pink-500/20",
    },
    {
      id: "vnpay",
      name: t("checkout.vnpay"),
      description: t("checkout.vnpay_desc"),
      icon: "fa-solid fa-credit-card text-blue-500",
      bgColor: "bg-blue-50/70 border-blue-200 text-blue-900",
      activeBorder: "border-blue-500 ring-2 ring-blue-500/20",
    },
    {
      id: "cod",
      name: t("checkout.cod"),
      description: t("checkout.cod_desc"),
      icon: "fa-solid fa-truck-fast text-emerald-600",
      bgColor: "bg-emerald-50/70 border-emerald-200 text-emerald-900",
      activeBorder: "border-emerald-500 ring-2 ring-emerald-500/20",
    },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm(selectedMethod);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 w-full max-w-sm sm:max-w-md rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-4 py-3 sm:px-5 sm:py-3.5 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/80">
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-slate-100 text-sm sm:text-base">
              {t('order_details.change_payment_title', 'Đổi phương thức thanh toán')}
            </h3>
            <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {t('order_details.title', 'Đơn hàng')} #{order.id} • {t('cart.total', 'Tổng tiền')}:{" "}
              <span className="font-bold text-slate-900 dark:text-slate-100">
                {formatCurrency(order.total_price, language)}
              </span>
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-400 dark:text-slate-300 hover:text-slate-700 dark:hover:text-slate-100 flex items-center justify-center transition-colors shadow-sm text-xs"
          >
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-3">
          <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 font-medium">
            {t('order_details.select_payment_desc', 'Vui lòng chọn phương thức thanh toán cho đơn hàng:')}
          </p>

          <div className="space-y-2">
            {methods.map((method) => {
              const isSelected = selectedMethod === method.id;
              const isCurrent = order.payment_method?.toLowerCase() === method.id;

              return (
                <div
                  key={method.id}
                  onClick={() => !loading && setSelectedMethod(method.id)}
                  className={`p-2.5 sm:p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                    isSelected
                      ? method.bgColor + " " + method.activeBorder + " dark:bg-slate-700 dark:border-slate-400"
                      : "bg-white dark:bg-slate-700/50 border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500"
                  }`}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-600 flex items-center justify-center text-base shadow-sm shrink-0">
                      <i className={method.icon}></i>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-semibold text-xs sm:text-sm text-slate-900 dark:text-slate-100 leading-tight">
                          {method.name}
                        </span>
                        {isCurrent && (
                          <span className="text-[9px] bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-slate-200 px-1.5 py-0.5 rounded font-medium">
                            {t('order_details.current', 'Hiện tại')}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-tight">
                        {method.description}
                      </p>
                    </div>
                  </div>

                  <div className="shrink-0 ml-3">
                    <div
                      className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${
                        isSelected
                          ? "border-slate-900 dark:border-slate-100 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900"
                          : "border-slate-300 dark:border-slate-500"
                      }`}
                    >
                      {isSelected && (
                        <i className="fa-solid fa-check text-[10px]"></i>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Action Buttons */}
          <div className="pt-2 sm:pt-3 flex gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 py-2 sm:py-2.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-xl font-medium text-xs sm:text-sm transition text-center"
            >
              {t('common.cancel', 'Hủy')}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2 sm:py-2.5 bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-white text-white dark:text-slate-900 rounded-xl font-semibold text-xs sm:text-sm transition text-center shadow-md flex items-center justify-center gap-1.5"
            >
              {loading ? (
                <>
                  <i className="fa-solid fa-circle-notch fa-spin"></i> {t('common.loading', 'Đang xử lý...')}
                </>
              ) : (
                <>{t('order_details.confirm_pay', 'Xác nhận & Thanh toán')}</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
