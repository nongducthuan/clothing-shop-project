import React from "react";

interface EmptyStateProps {
  icon?: string;
  title?: string;
  subtitle?: string;
}

export default function EmptyState({
  icon = "fa-folder-open",
  title = "No Data Found",
  subtitle = "There are no items to display here yet.",
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4 border border-gray-100 shadow-inner">
        <i className={`fa-solid ${icon} text-gray-300 text-3xl`}></i>
      </div>
      <h4 className="font-bold text-gray-700 text-lg mb-1">{title}</h4>
      <p className="text-gray-400 text-sm max-w-xs">{subtitle}</p>
    </div>
  );
}
