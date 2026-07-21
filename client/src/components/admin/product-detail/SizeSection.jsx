import React from "react";
import { SIZE_ORDER, BACKEND_URL } from "../../../hooks/admin/useProductDetailManager";

export default function SizeSection({
  selectedColorObj,
  onDeleteSize,
  sizeForm,
  setSizeForm,
  onAddSize
}) {
  const handleWheel = (e) => e.target.blur();

  if (!selectedColorObj) {
    return (
      <div className="lg:col-span-8 bg-white p-6 shadow-sm rounded-[2rem] border border-gray-100 min-h-[500px] flex flex-col items-center justify-center text-slate-400">
        <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-6 shadow-inner border border-gray-100">
          <i className="fa-solid fa-palette text-4xl text-slate-300"></i>
        </div>
        <h4 className="text-xl font-bold text-slate-700 mb-2">No Variant Selected</h4>
        <p className="text-sm">Please select a color from the left panel to manage its sizes.</p>
      </div>
    );
  }

  return (
    <>
      <style>{`
        .no-spinner::-webkit-inner-spin-button,
        .no-spinner::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
        .no-spinner { -moz-appearance: textfield; }
      `}</style>

      <div className="lg:col-span-8 bg-white p-6 md:p-8 shadow-sm rounded-[2rem] border border-gray-100 flex flex-col min-h-[700px]">

        {/* Header Title */}
        <h4 className="font-extrabold text-lg text-slate-800 mb-6 flex items-center gap-3 pb-4 border-b border-gray-50">
          <div className="w-8 h-8 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center text-sm">
            2
          </div>
          Manage Sizes & Stock
        </h4>

        {/* Selected Color Header Card */}
        <div className="flex items-center gap-5 mb-8 bg-gradient-to-r from-indigo-50 to-blue-50 p-5 rounded-[1.5rem] border border-indigo-100/50 shadow-inner">
          <div className="w-24 h-24 rounded-2xl overflow-hidden bg-white border-4 border-white shadow-sm flex-shrink-0">
            <img
              src={selectedColorObj.image_url?.startsWith("http") ? selectedColorObj.image_url : `${BACKEND_URL}${selectedColorObj.image_url}`}
              className="w-full h-full object-cover"
              onError={(e) => (e.target.src = "import.meta.env.VITE_API_URL/public/placeholder.jpg")}
              alt="Selected"
            />
          </div>
          <div>
            <span className="px-3 py-1 bg-indigo-100 text-indigo-700 font-bold text-[10px] uppercase tracking-widest rounded-full mb-2 inline-block">
              Active Selection
            </span>
            <h5 className="font-black text-2xl text-slate-800 mb-1">{selectedColorObj.color_name}</h5>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full border border-gray-300 shadow-sm" style={{ backgroundColor: selectedColorObj.color_code }}></span>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">{selectedColorObj.color_code}</p>
            </div>
          </div>
        </div>

        {/* Stock List (Replaces Table) */}
        <div className="flex-1 flex flex-col gap-3 mb-8">
          <div className="grid grid-cols-12 gap-4 px-4 pb-2 border-b border-gray-100 text-xs font-bold text-slate-400 uppercase tracking-widest">
            <div className="col-span-4">Size</div>
            <div className="col-span-4 text-center">Available Stock</div>
            <div className="col-span-4 text-right">Action</div>
          </div>

          {selectedColorObj.sizes?.length > 0 ? (
            [...selectedColorObj.sizes]
              .sort((a, b) => SIZE_ORDER.indexOf(a.size) - SIZE_ORDER.indexOf(b.size))
              .map((sizeItem) => (
                <div key={sizeItem.id} className="grid grid-cols-12 gap-4 items-center bg-slate-50 p-4 rounded-2xl border border-gray-100 hover:border-indigo-200 transition-colors">
                  <div className="col-span-4">
                    <span className="px-4 py-2 bg-slate-800 text-white font-black text-sm rounded-xl uppercase shadow-sm">
                      {sizeItem.size}
                    </span>
                  </div>
                  <div className="col-span-4 text-center">
                    <span className="font-black text-xl text-emerald-600">{sizeItem.stock}</span>
                    <span className="text-xs text-emerald-600/70 ml-1 font-bold">UNITS</span>
                  </div>
                  <div className="col-span-4 text-right">
                    <button
                      onClick={() => onDeleteSize(sizeItem.id)}
                      className="px-4 py-2 bg-rose-50 text-rose-600 font-bold text-xs uppercase tracking-wider rounded-xl hover:bg-rose-600 hover:text-white transition-all shadow-sm"
                    >
                      <i className="fa-solid fa-trash mr-1.5"></i> Delete
                    </button>
                  </div>
                </div>
              ))
          ) : (
            <div className="py-12 text-center text-slate-400 italic text-sm border-2 border-dashed border-gray-100 rounded-3xl mt-4">
              No inventory sizes added for this color.
            </div>
          )}
        </div>

        {/* Add Size Form */}
        <div className="bg-white p-5 rounded-[1.5rem] border border-gray-200 shadow-sm mt-auto">
          <h5 className="font-bold text-xs uppercase tracking-widest text-slate-500 mb-4 flex items-center gap-2">
            <i className="fa-solid fa-layer-group text-indigo-400"></i> Add Stock Inventory
          </h5>
          <div className="flex flex-col sm:flex-row gap-4 items-end">
            <div className="w-full sm:w-1/3">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5 ml-1">Select Size</label>
              <select
                className="w-full px-4 py-3 bg-slate-50 border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 rounded-xl transition-all outline-none text-sm font-bold text-slate-700 appearance-none cursor-pointer"
                value={sizeForm.size}
                onChange={(e) => setSizeForm({ ...sizeForm, size: e.target.value })}
              >
                {SIZE_ORDER.map((sz) => <option key={sz} value={sz}>{sz}</option>)}
              </select>
            </div>
            <div className="w-full sm:w-1/3">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5 ml-1">Quantity</label>
              <input
                type="number"
                onWheel={handleWheel}
                className="w-full px-4 py-3 bg-slate-50 border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 rounded-xl transition-all outline-none text-sm font-bold text-slate-700 no-spinner"
                value={sizeForm.stock}
                onChange={(e) => setSizeForm({ ...sizeForm, stock: +e.target.value })}
                placeholder="0"
              />
            </div>
            <div className="w-full sm:w-1/3">
              <button
                onClick={onAddSize}
                className="w-full py-3 bg-emerald-500 text-white rounded-xl font-bold text-sm tracking-wider uppercase hover:bg-emerald-600 transition-all shadow-sm flex items-center justify-center gap-2"
              >
                <i className="fa-solid fa-plus"></i> Add Stock
              </button>
            </div>
          </div>
        </div>

      </div>
    </>
  );
}
