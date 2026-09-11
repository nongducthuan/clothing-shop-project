import React from "react";

export default function AuthAlert({ type = "error", message }) {
  if (!message) return null;

  const isError = type === "error";
  const bgClass = isError ? "bg-rose-50 dark:bg-rose-950/40 border-rose-100 dark:border-rose-900/40" : "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-100 dark:border-emerald-900/40";
  const textClass = isError ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400";
  const iconClass = isError ? "fa-circle-exclamation" : "fa-circle-check";

  return (
    <div className={`flex items-center gap-3 p-4 mb-6 border rounded-2xl animate-in fade-in duration-300 ${bgClass}`}>
      <i className={`fa-solid ${iconClass} ${textClass} text-lg flex-shrink-0`}></i>
      <p className={`text-sm font-medium ${textClass} m-0 leading-snug`}>{message}</p>
    </div>
  );
}
