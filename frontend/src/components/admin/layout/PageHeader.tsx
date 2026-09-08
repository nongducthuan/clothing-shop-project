import React from "react";

export default function PageHeader({ title, colorClass = "bg-indigo-500" }) {
  return (
    <div className="flex justify-start">
      <div className="inline-flex items-center gap-3 bg-white dark:bg-slate-800 px-6 py-3.5 rounded-full shadow-sm border border-gray-100 dark:border-slate-700 transition-colors">
        <div className={`w-3 h-3 ${colorClass} rounded-full animate-pulse`}></div>
        <h2 className="font-bold uppercase text-gray-700 dark:text-slate-200 tracking-wider text-sm m-0 leading-none">
          {title}
        </h2>
      </div>
    </div>
  );
}
