import React from "react";

export function ModernStatusBadge({ status }) {
  const colors = {
    Pending: "bg-amber-50 text-amber-600 border-amber-200",
    Confirmed: "bg-blue-50 text-blue-600 border-blue-200",
    Shipping: "bg-indigo-50 text-indigo-600 border-indigo-200",
    Delivered: "bg-emerald-50 text-emerald-600 border-emerald-200",
    Cancelled: "bg-rose-50 text-rose-600 border-rose-200",
    "Return Requested": "bg-amber-50 text-amber-700 border-amber-200",
    "Return Approved": "bg-emerald-50 text-emerald-700 border-emerald-200",
    "Return Rejected": "bg-rose-50 text-rose-700 border-rose-200",
    Returned: "bg-purple-50 text-purple-700 border-purple-200",
  };
  const colorClass = colors[status] || "bg-slate-50 text-slate-600 border-slate-200";

  return (
    <span className={`px-2.5 py-1 text-[11px] font-extrabold rounded-full border uppercase tracking-wider whitespace-nowrap inline-flex items-center shrink-0 ${colorClass}`}>
      {status}
    </span>
  );
}

export function PaymentStatusBadge({ status }) {
  const isPaid = status === "Paid";
  return (
    <span className={`px-2.5 py-1 text-[10px] font-bold rounded-md border uppercase tracking-widest ${
      isPaid ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-slate-50 text-slate-500 border-slate-200"
    }`}>
      {status}
    </span>
  );
}
