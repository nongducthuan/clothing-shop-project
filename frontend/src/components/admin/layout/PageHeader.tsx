import React from "react";

export default function PageHeader({ title, colorClass = "bg-indigo-500" }) {
  return (
    <div className="flex justify-start">
      <div className="inline-flex items-center gap-3 bg-white px-6 py-3.5 rounded-full shadow-sm shadow-gray-200 border border-gray-100">
        <div className={`w-3 h-3 ${colorClass} rounded-full animate-pulse`}></div>
        <h2 className="font-bold uppercase text-gray-700 tracking-wider text-sm">
          {title}
        </h2>
      </div>
    </div>
  );
}
