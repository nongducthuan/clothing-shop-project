import React, { useState } from "react";
import { SIZE_ORDER } from "../../../hooks/admin/useProductDetailManager";
import { getImageUrl } from "../../../utils/imageUtils";
import { useLanguage } from "../../../context/LanguageContext";

export default function SizeSection({
  selectedColorObj,
  onDeleteSize,
  onUpdateSize,
  sizeForm,
  setSizeForm,
  onAddSize
}) {
  const { t, getLocalizedText } = useLanguage();
  const handleWheel = (e) => e.target.blur();

  // Inline stock editing state (which size row is being edited & its new value)
  const [editingSizeId, setEditingSizeId] = useState(null);
  const [editStock, setEditStock] = useState("");

  const startEditStock = (sizeItem) => {
    setEditingSizeId(sizeItem.id);
    setEditStock(String(sizeItem.stock));
  };

  const handleSaveStock = async () => {
    const success = await onUpdateSize(editingSizeId, editStock);
    if (success) {
      setEditingSizeId(null);
      setEditStock("");
    }
  };

  const handleCancelEdit = () => {
    setEditingSizeId(null);
    setEditStock("");
  };

  if (!selectedColorObj) {
    return (
      <div className="lg:col-span-8 bg-white dark:bg-slate-800 p-6 shadow-sm rounded-[2rem] border border-slate-200/80 dark:border-slate-700 min-h-[400px] flex flex-col items-center justify-center text-slate-400 text-center">
        <div className="w-20 h-20 bg-slate-50 dark:bg-slate-700/50 rounded-full flex items-center justify-center mb-4 shadow-inner border border-slate-200/80 dark:border-slate-700">
          <i className="fa-solid fa-palette text-3xl text-slate-300 dark:text-slate-500"></i>
        </div>
        <h4 className="text-lg font-bold text-slate-700 dark:text-slate-200 mb-1">{t("admin.pd_no_color_selected")}</h4>
        <p className="text-xs text-slate-400">{t("admin.pd_select_color_hint")}</p>
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

      <div className="lg:col-span-8 bg-white dark:bg-slate-800 p-5 md:p-8 shadow-sm rounded-[2rem] border border-slate-200/80 dark:border-slate-700 flex flex-col h-fit">

        {/* Header Title */}
        <h4 className="font-extrabold text-base md:text-lg text-slate-800 dark:text-slate-100 flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-700 m-0 leading-none">
          <div className="w-8 h-8 bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 rounded-full flex items-center justify-center text-sm flex-shrink-0">
            2
          </div>
          {t("admin.pd_size_section")}
        </h4>

        {/* Selected Color Header Card */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-6 bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20 p-4 md:p-5 rounded-[1.5rem] border border-indigo-100/50 dark:border-indigo-800/50 shadow-inner">
          <div className="w-20 h-20 md:w-24 md:h-24 rounded-2xl overflow-hidden bg-white dark:bg-slate-700 border-2 border-white dark:border-slate-600 shadow-sm flex-shrink-0">
            <img
              src={getImageUrl(selectedColorObj.image_url)}
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).onerror = null;
                (e.target as HTMLImageElement).src = getImageUrl(null);
              }}
              alt="Selected"
            />
          </div>
          <div className="flex-1 min-w-0">
            <span className="px-2.5 py-0.5 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 font-bold text-[9px] uppercase tracking-widest rounded-full mb-1 inline-block">
              {t("admin.pd_selected")}
            </span>
            <h5 className="font-black text-xl md:text-2xl text-slate-800 dark:text-slate-100 truncate">{getLocalizedText(selectedColorObj, "color_name") || selectedColorObj.color_name}</h5>
            <div className="flex items-center gap-2 mt-1">
              <span className="w-3 h-3 rounded-full border border-slate-300 dark:border-slate-600 shadow-sm flex-shrink-0" style={{ backgroundColor: selectedColorObj.color_code }}></span>
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">{selectedColorObj.color_code}</p>
            </div>
          </div>
        </div>

        {/* Stock List (Fixed Layout Tràn viền) */}
        <div className="flex-1 flex flex-col gap-3 mb-6">
          <div className="hidden sm:grid grid-cols-12 gap-4 px-4 pb-2 border-b border-slate-100 dark:border-slate-700 text-xs font-bold text-slate-400 dark:text-slate-400 uppercase tracking-widest">
            <div className="col-span-4">Kích thước</div>
            <div className="col-span-4 text-center">Tồn kho</div>
            <div className="col-span-4 text-right">Thao tác</div>
          </div>

          {selectedColorObj.sizes?.length > 0 ? (
            [...selectedColorObj.sizes]
              .sort((a, b) => SIZE_ORDER.indexOf(a.size) - SIZE_ORDER.indexOf(b.size))
              .map((sizeItem) => (
                <div key={sizeItem.id} className="flex sm:grid sm:grid-cols-12 gap-2 sm:gap-4 items-center justify-between bg-slate-50/50 dark:bg-slate-700/40 p-3.5 md:p-4 rounded-2xl border border-slate-200/80 dark:border-slate-600/60 hover:border-indigo-200 dark:hover:border-indigo-700 transition-colors">
                  <div className="sm:col-span-4 flex items-center">
                    <span className="px-3.5 py-1.5 bg-slate-800 dark:bg-slate-700 text-white font-black text-xs md:text-sm rounded-xl uppercase shadow-sm">
                      {sizeItem.size}
                    </span>
                  </div>
                  <div className="sm:col-span-4 text-left sm:text-center">
                    {editingSizeId === sizeItem.id ? (
                      <input
                        type="number"
                        min="0"
                        autoFocus
                        onWheel={handleWheel}
                        className="w-24 mx-auto sm:mx-0 px-2.5 py-1.5 bg-white dark:bg-slate-700 border border-indigo-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 rounded-xl outline-none text-sm md:text-base font-black text-slate-700 dark:text-slate-100 no-spinner text-center"
                        value={editStock}
                        onChange={(e) => setEditStock(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleSaveStock();
                          if (e.key === "Escape") handleCancelEdit();
                        }}
                      />
                    ) : (
                      <>
                        <span className="font-black text-lg md:text-xl text-emerald-600 dark:text-emerald-400">{sizeItem.stock}</span>
                        <span className="text-[10px] md:text-xs text-emerald-600/70 dark:text-emerald-400/70 ml-1 font-bold">{t("admin.pd_product_label")}</span>
                      </>
                    )}
                  </div>
                  <div className="sm:col-span-4 text-right flex justify-end gap-2">
                    {editingSizeId === sizeItem.id ? (
                      <>
                        <button
                          onClick={handleSaveStock}
                          className="px-3 py-1.5 md:px-4 md:py-2 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 font-bold text-[11px] md:text-xs uppercase tracking-wider rounded-xl hover:bg-emerald-600 hover:text-white transition-all shadow-sm flex items-center gap-1"
                        >
                          <i className="fa-solid fa-check"></i>
                          <span className="hidden sm:inline">{t("common.save")}</span>
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className="px-3 py-1.5 md:px-4 md:py-2 bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300 font-bold text-[11px] md:text-xs uppercase tracking-wider rounded-xl hover:bg-slate-600 hover:text-white transition-all shadow-sm flex items-center gap-1"
                        >
                          <i className="fa-solid fa-xmark"></i>
                          <span className="hidden sm:inline">{t("common.cancel")}</span>
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => startEditStock(sizeItem)}
                          className="px-3 py-1.5 md:px-4 md:py-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 font-bold text-[11px] md:text-xs uppercase tracking-wider rounded-xl hover:bg-indigo-600 hover:text-white transition-all shadow-sm flex items-center gap-1"
                        >
                          <i className="fa-solid fa-pen"></i>
                          <span className="hidden sm:inline">{t("common.edit")}</span>
                        </button>
                        <button
                          onClick={() => onDeleteSize(sizeItem.id)}
                          className="px-3 py-1.5 md:px-4 md:py-2 bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 font-bold text-[11px] md:text-xs uppercase tracking-wider rounded-xl hover:bg-rose-600 hover:text-white transition-all shadow-sm flex items-center gap-1"
                        >
                          <i className="fa-solid fa-trash"></i>
                          <span className="hidden sm:inline">{t("admin.pd_delete")}</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))
          ) : (
            <div className="py-8 text-center text-slate-400 italic text-xs md:text-sm border-2 border-dashed border-slate-200/80 dark:border-slate-700 rounded-2xl">
              {t("admin.pd_no_sizes")}
            </div>
          )}
        </div>

        {/* Add Size Form */}
        <div className="bg-slate-50 dark:bg-slate-700/40 p-4 md:p-5 rounded-[1.5rem] border border-slate-200/80 dark:border-slate-600/60 shadow-sm mt-auto">
          <h5 className="font-bold text-xs uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-3 flex items-center gap-2 m-0 leading-none">
            <i className="fa-solid fa-layer-group text-indigo-400"></i> {t("admin.pd_add_stock")}
          </h5>
          <div className="flex flex-col sm:flex-row gap-3 items-end">
            <div className="w-full sm:w-1/3">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1 ml-1">{t("admin.pd_select_size")}</label>
              <select
                className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-700 border border-slate-200/80 dark:border-slate-600 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 rounded-xl transition-all outline-none text-xs md:text-sm font-bold text-slate-700 dark:text-slate-100 appearance-none cursor-pointer"
                value={sizeForm.size}
                onChange={(e) => setSizeForm({ ...sizeForm, size: e.target.value })}
              >
                {SIZE_ORDER.map((sz) => <option key={sz} value={sz}>{sz}</option>)}
              </select>
            </div>
            <div className="w-full sm:w-1/3">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1 ml-1">{t("admin.pd_quantity")}</label>
              <input
                type="number"
                onWheel={handleWheel}
                className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-700 border border-slate-200/80 dark:border-slate-600 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 rounded-xl transition-all outline-none text-xs md:text-sm font-bold text-slate-700 dark:text-slate-100 no-spinner"
                value={sizeForm.stock}
                onChange={(e) => setSizeForm({ ...sizeForm, stock: +e.target.value })}
                placeholder="0"
              />
            </div>
            <div className="w-full sm:w-1/3">
              <button
                onClick={onAddSize}
                className="w-full py-2.5 md:py-3 bg-emerald-500 text-white rounded-xl font-bold text-xs md:text-sm tracking-wider uppercase hover:bg-emerald-600 transition-all shadow-sm flex items-center justify-center gap-2"
              >
                <i className="fa-solid fa-plus"></i> {t("admin.pd_add_stock_btn")}
              </button>
            </div>
          </div>
        </div>

      </div>
    </>
  );
}

