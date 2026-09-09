import React, { useRef } from "react";

export default function SaleForm({ formData, setFormData, onSubmit, editingId, onCancel }) {
  const startDateRef = useRef(null);
  const endDateRef = useRef(null);

  const handleWheel = (e) => e.target.blur();

  return (
    <>
      <style>{`
        .no-spinner::-webkit-inner-spin-button,
        .no-spinner::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
        .no-spinner { -moz-appearance: textfield; }
        ::-webkit-calendar-picker-indicator { cursor: pointer; opacity: 0.6; transition: opacity 0.2s; }
        ::-webkit-calendar-picker-indicator:hover { opacity: 1; }
      `}</style>

      <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-200/80 dark:border-slate-700 h-full flex flex-col overflow-hidden">
        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-4 shrink-0 flex justify-between items-center">
          <h2 className="text-sm font-bold text-white flex items-center gap-2 uppercase tracking-wider m-0 leading-none">
            <i className="fa-solid fa-tags text-blue-100"></i>
            {editingId ? "Edit Sale" : "Sale Details"}
          </h2>
        </div>

        <form onSubmit={onSubmit} className="p-6 space-y-4 flex-grow flex flex-col">
          <input
            type="text"
            placeholder="Campaign Name"
            className="w-full p-4 bg-slate-50 dark:bg-slate-700/60 border border-slate-200/80 dark:border-slate-600 rounded-2xl focus:ring-2 focus:ring-blue-500 font-medium outline-none transition-all text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />

          <div className="relative">
            <input
              type="number"
              placeholder="Discount Percent"
              min="1"
              max="100"
              onWheel={handleWheel}
              className="w-full p-4 bg-blue-50/60 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/50 rounded-2xl focus:ring-2 focus:ring-blue-500 font-bold text-blue-600 dark:text-blue-400 text-md no-spinner outline-none transition-all placeholder:text-blue-300 dark:placeholder:text-blue-500"
              value={formData.discount_percent}
              onChange={(e) => setFormData({ ...formData, discount_percent: e.target.value })}
              required
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 font-black text-blue-400 dark:text-blue-400 text-xl pointer-events-none">%</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div
              className="p-3 bg-slate-50 dark:bg-slate-700/60 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-2xl cursor-pointer transition-colors border border-slate-200/80 dark:border-slate-600 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500"
              onClick={() => startDateRef.current?.showPicker()}
            >
              <label className="text-[10px] font-bold text-slate-400 dark:text-slate-400 uppercase block mb-1 cursor-pointer">Starts</label>
              <input
                ref={startDateRef}
                type="datetime-local"
                className="w-full bg-transparent border-none p-0 text-xs font-semibold text-slate-700 dark:text-slate-200 outline-none cursor-pointer"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                required
              />
            </div>
            <div
              className="p-3 bg-slate-50 dark:bg-slate-700/60 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-2xl cursor-pointer transition-colors border border-slate-200/80 dark:border-slate-600 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500"
              onClick={() => endDateRef.current?.showPicker()}
            >
              <label className="text-[10px] font-bold text-slate-400 dark:text-slate-400 uppercase block mb-1 cursor-pointer">Ends</label>
              <input
                ref={endDateRef}
                type="datetime-local"
                className="w-full bg-transparent border-none p-0 text-xs font-semibold text-slate-700 dark:text-slate-200 outline-none cursor-pointer"
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                required
              />
            </div>
          </div>
          <div className="flex-grow"></div>
          <div className="flex gap-3 mt-4">
            {editingId && (
              <button type="button" onClick={onCancel} className="flex-1 py-3 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-xl font-bold text-xs tracking-wider uppercase transition-all">
                CANCEL
              </button>
            )}
            <button type="submit" className="flex-1 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-xl font-bold text-xs tracking-wider hover:scale-[1.01] transition-all shadow-md shadow-blue-200/50 uppercase">
              {editingId ? "UPDATE SALE" : "ACTIVATE SALE"}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
