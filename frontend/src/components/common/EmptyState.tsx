import React from "react";
import { useLanguage } from "../../context/LanguageContext";

interface EmptyStateProps {
  icon?: string;
  title?: string;
  subtitle?: string;
}

export default function EmptyState({
  icon = "fa-folder-open",
  title,
  subtitle,
}: EmptyStateProps) {
  const { t } = useLanguage();
  const displayTitle = title || t("admin.no_data", "Không có dữ liệu.");
  const displaySubtitle = subtitle || t("admin.system_is_empty", "Hệ thống chưa có dữ liệu");

  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-20 h-20 bg-gray-50 dark:bg-slate-700/50 rounded-full flex items-center justify-center mb-4 border border-gray-100 dark:border-slate-600 shadow-inner">
        <i className={`fa-solid ${icon} text-gray-300 dark:text-slate-500 text-3xl`}></i>
      </div>
      <h4 className="font-bold text-gray-700 dark:text-slate-200 text-lg mb-1">{displayTitle}</h4>
      <p className="text-gray-400 dark:text-slate-400 text-sm max-w-xs">{displaySubtitle}</p>
    </div>
  );
}
