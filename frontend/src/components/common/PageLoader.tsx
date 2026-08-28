import React from "react";

export default function PageLoader() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center min-h-[60vh] bg-transparent">
      <div className="w-12 h-12 border-4 border-slate-200 border-t-slate-700 rounded-full animate-spin mb-4"></div>
      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Loading...</p>
    </div>
  );
}
