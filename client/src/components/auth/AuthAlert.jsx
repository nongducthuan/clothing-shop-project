import React from "react";

export default function AuthAlert({ type = "error", message }) {
  if (!message) return null;

  const isError = type === "error";
  const bgClass = isError ? "bg-rose-50 border-rose-100" : "bg-emerald-50 border-emerald-100";
  const textClass = isError ? "text-rose-600" : "text-emerald-600";
  const iconClass = isError ? "fa-circle-exclamation" : "fa-circle-check";

  return (
    <div className={`flex items-center gap-3 p-4 mb-6 border rounded-2xl animate-in fade-in duration-300 ${bgClass}`}>
      <i className={`fa-solid ${iconClass} ${textClass} text-lg`}></i>
      <p className={`text-sm font-medium ${textClass}`}>{message}</p>
    </div>
  );
}
