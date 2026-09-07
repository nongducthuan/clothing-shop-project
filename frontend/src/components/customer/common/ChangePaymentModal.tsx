import React, { useState, useEffect } from "react";

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
      name: "MoMo (Domestic ATM Card)",
      description: "Pay via Domestic ATM Card or MoMo Wallet",
      icon: "fa-solid fa-wallet text-pink-500",
      bgColor: "bg-pink-50/70 border-pink-200 text-pink-900",
      activeBorder: "border-pink-500 ring-2 ring-pink-500/20",
    },
    {
      id: "vnpay",
      name: "VNPay (Domestic ATM Card)",
      description: "Pay via Domestic ATM Card or Internet Banking",
      icon: "fa-solid fa-credit-card text-blue-500",
      bgColor: "bg-blue-50/70 border-blue-200 text-blue-900",
      activeBorder: "border-blue-500 ring-2 ring-blue-500/20",
    },
    {
      id: "cod",
      name: "Cash on Delivery (COD)",
      description: "Pay with cash upon receiving your package",
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
      className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-sm sm:max-w-md rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-4 py-3 sm:px-5 sm:py-3.5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div>
            <h3 className="font-semibold text-slate-900 text-sm sm:text-base">
              Change Payment Method
            </h3>
            <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5">
              Order #{order.id} • Total:{" "}
              <span className="font-bold text-slate-900">
                {Number(order.total_price).toLocaleString("vi-VN")}đ
              </span>
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white border border-slate-200 text-slate-400 hover:text-slate-700 flex items-center justify-center transition-colors shadow-sm text-xs"
          >
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-3">
          <p className="text-[11px] sm:text-xs text-slate-500 font-medium">
            Select how you would like to pay for this order:
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
                      ? method.bgColor + " " + method.activeBorder
                      : "bg-white border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-base shadow-sm shrink-0">
                      <i className={method.icon}></i>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-semibold text-xs sm:text-sm text-slate-900 leading-tight">
                          {method.name}
                        </span>
                        {isCurrent && (
                          <span className="text-[9px] bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded font-medium">
                            Current
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5 leading-tight">
                        {method.description}
                      </p>
                    </div>
                  </div>

                  <div className="shrink-0 ml-3">
                    <div
                      className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${
                        isSelected
                          ? "border-slate-900 bg-slate-900 text-white"
                          : "border-slate-300"
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
              className="flex-1 py-2 sm:py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium text-xs sm:text-sm transition text-center"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2 sm:py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-semibold text-xs sm:text-sm transition text-center shadow-md flex items-center justify-center gap-1.5"
            >
              {loading ? (
                <>
                  <i className="fa-solid fa-circle-notch fa-spin"></i> Processing...
                </>
              ) : (
                <>Confirm & Pay</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
