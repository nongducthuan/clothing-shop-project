import React, { useRef } from "react";

export default function PromotionForm({ state, actions, helpers }) {
  const { formData, isLoading, editingId, products, searchBuyTerm, searchGetTerm } = state;
  const { handleInputChange, handleSubmit, handleResetForm, setSearchBuyTerm, setSearchGetTerm, setFormData } = actions;
  const { getCategoryName, getProductStock, getGenderStyle } = helpers;

  const startDateRef = useRef(null);
  const endDateRef = useRef(null);

  const handleWheel = (e) => e.target.blur();

  const renderProductSelector = (type) => {
    const isBuyType = type === "buy";
    const currentSearchTerm = isBuyType ? searchBuyTerm : searchGetTerm;
    const setSearch = isBuyType ? setSearchBuyTerm : setSearchGetTerm;
    const currentSelectedId = isBuyType ? formData.buy_product_id : formData.gift_product_id;
    const fieldName = isBuyType ? "buy_product_id" : "gift_product_id";
    const activeColor = isBuyType ? "indigo" : "purple";

    const filteredProducts = products.filter((p) => {
      const catName = getCategoryName(p.category_id);
      const searchLower = currentSearchTerm.toLowerCase();
      return (
        p.name.toLowerCase().includes(searchLower) ||
        catName.toLowerCase().includes(searchLower) ||
        (p.gender || "").toLowerCase().includes(searchLower)
      );
    });

    return (
      <div className="space-y-3 mt-3">
        <div className="relative">
          <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-xs"></i>
          <input
            type="text"
            placeholder="Search product name, category..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-[color] focus:border-[color] transition-all outline-none"
            style={{ "--tw-ring-color": isBuyType ? "#6366f1" : "#a855f7" }}
            value={currentSearchTerm}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div
          className={`grid grid-cols-1 gap-2 max-h-[250px] overflow-y-auto pr-2 border border-white/50 bg-white/30 rounded-2xl p-2 custom-scrollbar
          ${isBuyType ? "[&::-webkit-scrollbar-thumb]:bg-indigo-200" : "[&::-webkit-scrollbar-thumb]:bg-purple-200"}`}
        >
          {filteredProducts.map((p) => {
            const isSelected = currentSelectedId === p.id;
            const displayCatName = getCategoryName(p.category_id);
            const stockAmount = getProductStock(p);

            return (
              <div
                key={p.id}
                onClick={() => setFormData((prev) => ({ ...prev, [fieldName]: p.id }))}
                className={`p-3 rounded-2xl border flex items-center justify-between cursor-pointer transition-all duration-200 ${
                  isSelected
                    ? `border-${activeColor}-500 bg-${activeColor}-50 shadow-sm`
                    : "border-gray-100 bg-white hover:border-gray-300"
                }`}
              >
                <div className="flex flex-col gap-1.5 overflow-hidden pr-2">
                  <span className={`text-[11px] font-black truncate ${isSelected ? `text-${activeColor}-700` : "text-gray-700"}`}>
                    {p.name}
                  </span>
                  <div className="flex gap-1.5 flex-wrap items-center">
                    <span className="text-[9px] px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded font-bold uppercase tracking-tighter">
                      {displayCatName}
                    </span>
                    {p.gender && (
                      <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-tighter ${getGenderStyle(p.gender)}`}>
                        {p.gender}
                      </span>
                    )}
                    <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-tighter ${stockAmount > 0 ? "bg-amber-100 text-amber-600" : "bg-red-100 text-red-600"}`}>
                      Stock: {stockAmount}
                    </span>
                  </div>
                </div>
                <div className="ml-1 flex-shrink-0">
                  <i className={`fa-solid ${isSelected ? `fa-check-circle text-${activeColor}-500 text-lg` : "fa-circle text-gray-100 text-lg"}`}></i>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <>
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 5px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background-color: #e2e8f0; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background-color: #cbd5e1; }

        .no-spinner::-webkit-inner-spin-button,
        .no-spinner::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
        .no-spinner { -moz-appearance: textfield; }

        ::-webkit-calendar-picker-indicator { cursor: pointer; opacity: 0.6; transition: opacity 0.2s; }
        ::-webkit-calendar-picker-indicator:hover { opacity: 1; }
      `}</style>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="bg-gradient-to-r from-indigo-500 to-purple-500 p-6 px-8 flex justify-between items-center">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <i className="fa-solid fa-gift text-indigo-100"></i>
            {editingId ? "Update Promotion" : "Create New Promotion"}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                Campaign Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                required
                value={formData.name}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 text-sm outline-none transition-all"
                placeholder="e.g. Buy 2 Shirts Get 1 Tie"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                Description
              </label>
              <input
                type="text"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 text-sm outline-none transition-all"
                placeholder="Shown to customers on frontend"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="p-6 bg-indigo-50/50 rounded-3xl border border-indigo-100">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-base font-bold text-indigo-800 flex items-center gap-2">
                  <span className="bg-indigo-200 text-indigo-800 w-6 h-6 rounded-full flex items-center justify-center text-xs">1</span>
                  Customer Buys
                </h3>
                <div className="flex items-center gap-2">
                  <label className="text-xs font-semibold text-indigo-500 uppercase tracking-wider">Qty <span className="text-red-500">*</span></label>
                  <input
                    type="number"
                    name="buy_quantity"
                    required
                    min="1"
                    onWheel={handleWheel}
                    value={formData.buy_quantity}
                    onChange={handleInputChange}
                    className="w-20 px-3 py-2 bg-white border border-indigo-200 rounded-xl focus:ring-2 focus:ring-indigo-500 text-sm text-center font-bold no-spinner outline-none transition-all"
                  />
                </div>
              </div>
              {renderProductSelector("buy")}
            </div>

            <div className="p-6 bg-purple-50/50 rounded-3xl border border-purple-100">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-base font-bold text-purple-800 flex items-center gap-2">
                  <span className="bg-purple-200 text-purple-800 w-6 h-6 rounded-full flex items-center justify-center text-xs">2</span>
                  Customer Gets (Gift)
                </h3>
                <div className="flex items-center gap-2">
                  <label className="text-xs font-semibold text-purple-500 uppercase tracking-wider">Qty <span className="text-red-500">*</span></label>
                  <input
                    type="number"
                    name="gift_quantity"
                    required
                    min="1"
                    onWheel={handleWheel}
                    value={formData.gift_quantity}
                    onChange={handleInputChange}
                    className="w-20 px-3 py-2 bg-white border border-purple-200 rounded-xl focus:ring-2 focus:ring-purple-500 text-sm text-center font-bold no-spinner outline-none transition-all"
                  />
                </div>
              </div>
              {renderProductSelector("get")}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div
              className="p-3 bg-slate-50 hover:bg-slate-100 rounded-xl cursor-pointer transition-colors border border-transparent focus-within:border-indigo-200 focus-within:ring-2 focus-within:ring-indigo-500"
              onClick={() => startDateRef.current?.showPicker()}
            >
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 cursor-pointer">Start Date <span className="text-red-500">*</span></label>
              <input
                ref={startDateRef}
                type="datetime-local"
                name="start_date"
                required
                value={formData.start_date}
                onChange={handleInputChange}
                className="w-full bg-transparent border-none p-0 text-sm font-medium text-slate-700 outline-none cursor-pointer"
              />
            </div>

            <div
              className="p-3 bg-slate-50 hover:bg-slate-100 rounded-xl cursor-pointer transition-colors border border-transparent focus-within:border-indigo-200 focus-within:ring-2 focus-within:ring-indigo-500"
              onClick={() => endDateRef.current?.showPicker()}
            >
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 cursor-pointer">End Date <span className="text-red-500">*</span></label>
              <input
                ref={endDateRef}
                type="datetime-local"
                name="end_date"
                required
                value={formData.end_date}
                onChange={handleInputChange}
                className="w-full bg-transparent border-none p-0 text-sm font-medium text-slate-700 outline-none cursor-pointer"
              />
            </div>

            <div className="p-3 bg-slate-50 rounded-xl">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Max Gift / Order</label>
              <input
                type="number"
                name="max_gift_per_order"
                onWheel={handleWheel}
                value={formData.max_gift_per_order}
                onChange={handleInputChange}
                className="w-full bg-transparent border-none p-0 text-sm font-medium text-slate-700 outline-none no-spinner"
                placeholder="Empty = Unlimited"
              />
            </div>

            <div className="p-3 bg-slate-50 rounded-xl">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Total Campaign Limit</label>
              <input
                type="number"
                name="total_gift_limit"
                onWheel={handleWheel}
                value={formData.total_gift_limit}
                onChange={handleInputChange}
                className="w-full bg-transparent border-none p-0 text-sm font-medium text-slate-700 outline-none no-spinner"
                placeholder="Total stock allocated"
              />
            </div>
          </div>

          <div className="flex flex-col md:flex-row items-center justify-between gap-6 pt-6 border-t border-slate-100">
            <div className="flex items-center gap-8 w-full md:w-auto">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 text-center">Priority</label>
                <input
                  type="number"
                  name="priority"
                  onWheel={handleWheel}
                  value={formData.priority}
                  onChange={handleInputChange}
                  className="w-24 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-center font-bold outline-none no-spinner focus:ring-2 focus:ring-indigo-500 transition-all"
                  placeholder="0"
                />
              </div>
              <div className="flex flex-col justify-center h-full pt-4">
                <label className="flex items-center cursor-pointer">
                  <div className="relative">
                    <input type="checkbox" name="is_stackable" checked={formData.is_stackable} onChange={handleInputChange} className="sr-only" />
                    <div className={`block w-10 h-6 rounded-full transition-colors ${formData.is_stackable ? "bg-indigo-500" : "bg-slate-300"}`}></div>
                    <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${formData.is_stackable ? "transform translate-x-4" : ""}`}></div>
                  </div>
                  <div className="ml-3 text-sm font-semibold text-slate-700">
                    Stackable
                    <span className="block text-[10px] font-normal text-slate-400">Allow using with Vouchers</span>
                  </div>
                </label>
              </div>
            </div>

            <div className="flex gap-4 w-full md:w-auto">
              {editingId && (
                <button type="button" onClick={handleResetForm} className="w-full md:w-auto px-6 py-3.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-xl shadow-sm transition-all whitespace-nowrap uppercase tracking-wider text-sm">
                  Cancel
                </button>
              )}
              <button type="submit" disabled={isLoading} className="w-full md:w-auto px-10 py-3.5 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white font-bold rounded-xl shadow-md transition-all whitespace-nowrap uppercase tracking-wider text-sm">
                {isLoading ? "Saving..." : editingId ? "Update Promotion" : "Create Promotion"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </>
  );
}
