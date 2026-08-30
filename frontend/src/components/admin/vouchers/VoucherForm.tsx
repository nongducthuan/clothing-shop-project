import React, { useRef } from "react";

export default function VoucherForm({ formData, setFormData, onSubmit, editingId, onCancel }) {
  // Refs để mở nhanh popup Lịch khi click vào khung bọc ngoài
  const startDateRef = useRef(null);
  const endDateRef = useRef(null);

  // Hàm chặn lăn chuột làm thay đổi số
  const handleWheel = (e) => {
    e.target.blur();
  };

  return (
    <>
      {/* CSS to hide number input spin buttons */}
      <style>{`
        .no-spinner::-webkit-inner-spin-button,
        .no-spinner::-webkit-outer-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
        .no-spinner {
          -moz-appearance: textfield;
        }
        /* Fix cho input date trên webkit để trông gọn hơn */
        ::-webkit-calendar-picker-indicator {
          cursor: pointer;
          opacity: 0.6;
          transition: opacity 0.2s;
        }
        ::-webkit-calendar-picker-indicator:hover {
          opacity: 1;
        }
      `}</style>

      <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden h-full flex flex-col">
        <div className="bg-gradient-to-r from-indigo-500 to-purple-500 p-4 shrink-0 flex justify-between items-center">
          <h2 className="text-sm font-bold text-white flex items-center gap-2 uppercase tracking-wider m-0 leading-none">
            <i className="fa-solid fa-ticket text-indigo-100"></i>
            {editingId ? "Edit Voucher" : "Voucher Details"}
          </h2>
        </div>

        <form onSubmit={onSubmit} className="p-6 space-y-4 flex-grow flex flex-col">
          {/* Code & Discount % */}
          <div className="grid grid-cols-2 gap-3">
            <input
              type="text"
              placeholder="Code"
              value={formData.code}
              className="p-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 font-black uppercase outline-none transition-all"
              onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
              required
            />
            <div className="relative">
              <input
                type="number"
                placeholder="Discount Percent"
                value={formData.discount_percent}
                onWheel={handleWheel} // Chặn cuộn chuột đổi số
                className="w-full p-4 bg-indigo-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 font-bold text-indigo-600 pr-8 no-spinner outline-none transition-all"
                onChange={(e) => setFormData({ ...formData, discount_percent: e.target.value })}
                required
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 font-black text-indigo-300 pointer-events-none">%</span>
            </div>
          </div>

          {/* Financial Limits */}
          <div className="grid grid-cols-2 gap-3">
            <input
              type="number"
              placeholder="Min Spend"
              onWheel={handleWheel} // Chặn cuộn chuột đổi số
              className="w-full p-4 bg-gray-50 border-none rounded-xl no-spinner outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
              value={formData.min_order_value}
              onChange={(e) => setFormData({ ...formData, min_order_value: e.target.value })}
            />
            <input
              type="number"
              placeholder="Max Discount"
              onWheel={handleWheel} // Chặn cuộn chuột đổi số
              className="w-full p-4 bg-gray-50 border-none rounded-xl no-spinner outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
              value={formData.max_discount_amount}
              onChange={(e) => setFormData({ ...formData, max_discount_amount: e.target.value })}
            />
          </div>

          <input
            type="number"
            placeholder="Usage Limit (Total coupons available)"
            onWheel={handleWheel} // Chặn cuộn chuột đổi số
            className="w-full p-4 bg-gray-50 border-none rounded-2xl no-spinner outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
            value={formData.usage_limit}
            onChange={(e) => setFormData({ ...formData, usage_limit: e.target.value })}
            required
          />

          {/* Validity Period - Đã được làm lại UI để dễ bấm hơn */}
          <div className="grid grid-cols-2 gap-3">

            {/* Start Date */}
            <div
              className="p-3 bg-gray-50 hover:bg-gray-100 rounded-2xl cursor-pointer transition-colors border border-transparent focus-within:border-indigo-200 focus-within:ring-2 focus-within:ring-indigo-500"
              onClick={() => startDateRef.current?.showPicker()} // Click vào thẻ div cũng mở lịch
            >
              <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1 cursor-pointer">Starts</label>
              <div className="flex items-center justify-between">
                <input
                  ref={startDateRef}
                  type="datetime-local"
                  className="w-full bg-transparent border-none p-0 text-xs font-semibold text-gray-700 outline-none cursor-pointer"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  required
                />
              </div>
            </div>

            {/* End Date */}
            <div
              className="p-3 bg-gray-50 hover:bg-gray-100 rounded-2xl cursor-pointer transition-colors border border-transparent focus-within:border-indigo-200 focus-within:ring-2 focus-within:ring-indigo-500"
              onClick={() => endDateRef.current?.showPicker()} // Click vào thẻ div cũng mở lịch
            >
              <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1 cursor-pointer">Ends</label>
              <div className="flex items-center justify-between">
                <input
                  ref={endDateRef}
                  type="datetime-local"
                  className="w-full bg-transparent border-none p-0 text-xs font-semibold text-gray-700 outline-none cursor-pointer"
                  value={formData.end_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                  required
                />
              </div>
            </div>

          </div>

          <div className="flex gap-3 mt-4">
            {editingId && (
              <button
                type="button"
                onClick={onCancel}
                className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold text-xs tracking-wider uppercase transition-all"
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              className="flex-1 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white rounded-xl font-bold text-xs tracking-wider hover:scale-[1.01] transition-all shadow-md shadow-indigo-200 uppercase"
            >
              {editingId ? "Update Voucher" : "Create Voucher"}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
