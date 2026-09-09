import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useProductInventory } from "../../hooks/admin/useProductDetailManager";
import ColorSection from "../../components/admin/product-detail/ColorSection";
import SizeSection from "../../components/admin/product-detail/SizeSection";
import { useLanguage } from "../../context/LanguageContext";

export default function ProductDetailManager() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useLanguage();

  // Logic is completely isolated in the custom hook
  const {
    product, colors, selectedColorId, setSelectedColorId,
    colorForm, setColorForm, sizeForm, setSizeForm,
    isUploading, uploadImage, addColor, deleteColor, addSize, deleteSize
  } = useProductInventory(id);

  if (!product) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="flex flex-col items-center gap-4">
          <i className="fa-solid fa-circle-notch fa-spin text-4xl text-indigo-500"></i>
          <p className="font-bold text-slate-500 dark:text-slate-400 tracking-widest uppercase text-sm">{t("common.loading")}</p>
        </div>
      </div>
    );
  }

  const selectedColorObj = colors.find((c) => c.id === selectedColorId);

  return (
    <div className="container mx-auto px-4 py-8 lg:px-8 max-w-7xl flex-1 font-sans">

      {/* HEADER SECTION (Pill UI Style) */}
      <div className="flex items-center gap-4 mb-8">
        {/* Modern Pill Back Button */}
        <button
          onClick={() => navigate("/admin/products")}
          className="w-12 h-12 flex-shrink-0 bg-white dark:bg-slate-800 rounded-full shadow-sm border border-slate-200/80 dark:border-slate-700 flex items-center justify-center text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-all"
          title={t("common.close")}
        >
          <i className="fa-solid fa-arrow-left"></i>
        </button>

        {/* Pill UI Title */}
        <div className="inline-flex items-center gap-3 bg-white dark:bg-slate-800 px-6 py-3.5 rounded-full shadow-sm border border-slate-200/80 dark:border-slate-700 overflow-hidden">
          <div className="w-3 h-3 flex-shrink-0 bg-indigo-500 rounded-full animate-pulse"></div>
          <h2 className="font-bold uppercase text-slate-700 dark:text-slate-100 tracking-wider text-sm m-0 leading-none">
            {t("admin.manage_colors_sizes")}: <span className="text-indigo-500 dark:text-indigo-400">{product.name}</span>
          </h2>
        </div>
      </div>

      {/* MAIN GRID LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 max-w-screen-2xl mx-auto">

        {/* Left Panel: Color Variants */}
        <ColorSection
          colors={colors}
          selectedColorId={selectedColorId}
          onSelectColor={setSelectedColorId}
          onDeleteColor={deleteColor}
          colorForm={colorForm}
          setColorForm={setColorForm}
          onUploadImage={uploadImage}
          onAddColor={addColor}
          isUploading={isUploading}
        />

        {/* Right Panel: Size & Stock for Selected Color */}
        <SizeSection
          selectedColorObj={selectedColorObj}
          onDeleteSize={deleteSize}
          sizeForm={sizeForm}
          setSizeForm={setSizeForm}
          onAddSize={addSize}
        />

      </div>
    </div>
  );
}
