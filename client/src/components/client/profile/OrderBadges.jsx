import React from "react";

export function ModernStatusBadge({ status }) {
  const colors = {
    Pending: "bg-amber-50 text-amber-600 border-amber-100",
    Confirmed: "bg-blue-50 text-blue-600 border-blue-100",
    Shipping: "bg-indigo-50 text-indigo-600 border-indigo-100",
    Delivered: "bg-emerald-50 text-emerald-600 border-emerald-100",
    Cancelled: "bg-rose-50 text-rose-600 border-rose-100",
    "Return Requested": "bg-orange-50 text-orange-600 border-orange-100",
    Returned: "bg-slate-100 text-slate-600 border-slate-200",
  };
  const colorClass = colors[status] || "bg-slate-50 text-slate-600 border-slate-200";

  return (
    <span className={`px-3 py-1 text-xs font-bold rounded-full border uppercase tracking-wider ${colorClass}`}>
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
