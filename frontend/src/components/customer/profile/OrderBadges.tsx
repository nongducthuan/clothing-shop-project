import React from "react";
import { useLanguage } from "../../../context/LanguageContext";

export function ModernStatusBadge({ status }: { status: string }) {
  const { t } = useLanguage();

  const normalizedKey = String(status || "")
    .toLowerCase()
    .replace(/\s+/g, "_");

  const colors: Record<string, string> = {
    pending: "bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-950/50 dark:text-amber-400 dark:border-amber-800",
    confirmed: "bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-950/50 dark:text-blue-400 dark:border-blue-800",
    processing: "bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-950/50 dark:text-blue-400 dark:border-blue-800",
    shipping: "bg-indigo-50 text-indigo-600 border-indigo-200 dark:bg-indigo-950/50 dark:text-indigo-400 dark:border-indigo-800",
    shipped: "bg-indigo-50 text-indigo-600 border-indigo-200 dark:bg-indigo-950/50 dark:text-indigo-400 dark:border-indigo-800",
    delivered: "bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-400 dark:border-emerald-800",
    cancelled: "bg-rose-50 text-rose-600 border-rose-200 dark:bg-rose-950/50 dark:text-rose-400 dark:border-rose-800",
    return_requested: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800",
    return_pending: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800",
    return_approved: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800",
    return_rejected: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800",
    returned: "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/50 dark:text-purple-300 dark:border-purple-800",
  };

  const colorClass = colors[normalizedKey] || "bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700";
  const translatedText = t(`order_status.${normalizedKey}`, status);

  return (
    <span className={`px-2.5 py-1 text-[11px] font-bold rounded-full border uppercase tracking-wider whitespace-nowrap inline-flex items-center shrink-0 ${colorClass}`}>
      {translatedText}
    </span>
  );
}

export function PaymentStatusBadge({ status }: { status: string }) {
  const { t } = useLanguage();
  const normalizedKey = String(status || "").toLowerCase().replace(/\s+/g, "_");
  const isPaid = normalizedKey === "paid";
  const translatedText = t(`payment_status.${normalizedKey}`, status);

  return (
    <span className={`px-2.5 py-1 text-[10px] font-bold rounded-full border uppercase tracking-wider whitespace-nowrap inline-flex items-center shrink-0 ${
      isPaid 
        ? "bg-emerald-50 text-emerald-600 border-emerald-200/60 dark:bg-emerald-950/50 dark:text-emerald-400 dark:border-emerald-800" 
        : "bg-rose-50 text-rose-600 border-rose-200/60 dark:bg-rose-950/50 dark:text-rose-400 dark:border-rose-800"
    }`}>
      {translatedText}
    </span>
  );
}
