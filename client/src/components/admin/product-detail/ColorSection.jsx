import React from "react";
import { BACKEND_URL } from "../../../hooks/admin/useProductDetailManager";

export default function ColorSection({
  colors,
  selectedColorId,
  onSelectColor,
  onDeleteColor,
  colorForm,
  setColorForm,
  onUploadImage,
  onAddColor,
  isUploading
}) {
  return (
    <>
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 5px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background-color: #e2e8f0; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background-color: #cbd5e1; }

        /* Custom Color Input Styling */
        input[type="color"]::-webkit-color-swatch-wrapper { padding: 0; }
        input[type="color"]::-webkit-color-swatch { border: none; border-radius: 50%; }
      `}</style>

      <div className="lg:col-span-4 bg-white p-6 md:p-8 shadow-sm rounded-[2rem] border border-gray-100 flex flex-col h-[800px]">
        <h4 className="font-extrabold text-lg text-slate-800 mb-6 flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center text-sm">
            1
          </div>
          Color Variants
        </h4>

        {/* Scrollable Color List */}
        <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-3 mb-6">
          {colors.map((color) => {
            const isSelected = selectedColorId === color.id;
            return (
              <div
                key={color.id}
                onClick={() => onSelectColor(color.id)}
                className={`p-3 rounded-2xl border flex items-center justify-between cursor-pointer transition-all duration-300 ${isSelected
                  ? "border-indigo-500 bg-indigo-50/50 shadow-sm"
                  : "border-gray-100 bg-white hover:border-gray-300 hover:bg-gray-50"
                  }`}
              >
                <div className="flex items-center gap-4">
                  {/* Image Thumbnail */}
                  <div className={`w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 ${isSelected ? "border-2 border-indigo-200" : "bg-gray-100"}`}>
                    {color.image_url ? (
                      <img
                        src={color.image_url.startsWith("http") ? color.image_url : `${BACKEND_URL}${color.image_url}`}
                        className="w-full h-full object-cover"
                        alt={color.color_name}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-300">
                        <i className="fa-solid fa-image"></i>
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div>
                    <p className={`font-black text-sm truncate ${isSelected ? "text-indigo-800" : "text-slate-700"}`}>
                      {color.color_name}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="w-3 h-3 rounded-full border border-gray-200 shadow-sm" style={{ backgroundColor: color.color_code }}></span>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{color.color_code}</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={(e) => { e.stopPropagation(); onDeleteColor(color.id); }}
                  className="w-8 h-8 flex items-center justify-center text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-full transition-colors flex-shrink-0"
                  title="Delete Color"
                >
                  <i className="fa-solid fa-trash text-sm"></i>
                </button>
              </div>
            );
          })}
          {colors.length === 0 && (
            <div className="text-center py-10 text-slate-400 italic text-sm border-2 border-dashed border-gray-100 rounded-2xl">
              No variants added yet.
            </div>
          )}
        </div>

        {/* Add New Color Form */}
        <div className="bg-slate-50 p-5 rounded-[1.5rem] border border-gray-100">
          <h5 className="font-bold text-xs uppercase tracking-widest text-slate-500 mb-4 flex items-center gap-2">
            <i className="fa-solid fa-plus-circle text-indigo-400"></i> Add Variant
          </h5>

          <div className="space-y-3">
            <div className="flex gap-3">
              {/* Color Picker Box */}
              <div className="relative w-12 h-12 flex-shrink-0 rounded-xl overflow-hidden border-2 border-white shadow-sm ring-1 ring-gray-200 cursor-pointer group">
                <input
                  type="color"
                  className="absolute inset-0 w-[200%] h-[200%] -top-1/2 -left-1/2 cursor-pointer"
                  value={colorForm.color_code}
                  onChange={(e) => setColorForm({ ...colorForm, color_code: e.target.value })}
                />
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/20 pointer-events-none transition-opacity">
                  <i className="fa-solid fa-pen text-white text-xs"></i>
                </div>
              </div>

              {/* Name Input */}
              <input
                className="w-full px-4 py-2.5 bg-white border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 rounded-xl transition-all outline-none text-sm font-bold text-slate-700"
                placeholder="Color Name (e.g. Navy Blue)"
                value={colorForm.color_name}
                onChange={(e) => setColorForm({ ...colorForm, color_name: e.target.value })}
              />
            </div>

            {/* Image Upload Row */}
            <div className="flex flex-col gap-3">
              {/* Nút Upload to rõ ràng */}
              <div className="relative w-full">
                <input type="file" className="absolute inset-0 opacity-0 z-10 cursor-pointer" />
                <div className="w-full py-3 bg-indigo-50 border-2 border-dashed border-indigo-200 rounded-xl flex flex-col items-center justify-center gap-1 text-indigo-600 hover:bg-indigo-100 transition-all">
                  <i className="fa-solid fa-cloud-arrow-up text-lg"></i>
                  <span className="text-[11px] font-bold uppercase">Upload Product Image</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="h-[1px] flex-1 bg-gray-200"></div>
                <span className="text-[10px] font-bold text-gray-400">OR</span>
                <div className="h-[1px] flex-1 bg-gray-200"></div>
              </div>

              {/* Ô URL bên dưới */}
              <input
                className="w-full px-4 py-2 bg-white border border-gray-200 rounded-xl text-xs"
                placeholder="Paste image link here..."
              />
            </div>

            {isUploading && (
              <p className="text-xs font-bold text-indigo-500 animate-pulse text-center">
                <i className="fa-solid fa-spinner fa-spin mr-1"></i> Uploading image...
              </p>
            )}

            <button
              onClick={onAddColor}
              disabled={isUploading}
              className="w-full py-3 bg-slate-800 text-white rounded-xl font-bold text-sm tracking-wider uppercase hover:bg-indigo-600 transition-all shadow-sm disabled:opacity-50 mt-2"
            >
              Save Variant
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
