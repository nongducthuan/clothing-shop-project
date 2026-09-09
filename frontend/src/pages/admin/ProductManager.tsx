import React from "react";
import { useNavigate } from "react-router-dom";
import useProductManager from "../../hooks/admin/useProductManager";
import ProductForm from "../../components/admin/products/ProductForm";
import ProductList from "../../components/admin/products/ProductList";
import { useLanguage } from "../../context/LanguageContext";

// --- SUB-COMPONENTS ---

/**
 * PageHeader Component
 * Minimal, pill-shaped title badge and action buttons.
 */
const PageHeader = ({ navigate, setMobileFormOpen, mobileFormOpen }) => {
  const { t } = useLanguage();
  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
      <div className="inline-flex items-center gap-3 px-6 py-2.5 bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 rounded-full shadow-sm">
        <div className="w-2.5 h-2.5 rounded-full bg-violet-500 animate-pulse"></div>
        <h2 className="font-bold uppercase text-slate-700 dark:text-slate-200 tracking-wider text-sm m-0 leading-none">
          {t("admin.product_management")}
        </h2>
      </div>

      <div className="flex gap-3 w-full md:w-auto">
        <button
          onClick={() => navigate("/admin/categories")}
          className="flex-1 md:flex-none px-6 py-2.5 bg-violet-50 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400 border border-violet-100 dark:border-violet-900/50 rounded-full font-bold text-sm hover:bg-violet-600 hover:text-white dark:hover:bg-violet-600 dark:hover:text-white transition-colors duration-300 shadow-sm whitespace-nowrap"
        >
          <i className="fa-solid fa-tags mr-2"></i> {t("admin.categories")}
        </button>

        {/* Mobile Form Toggle Button */}
        <button
          onClick={() => setMobileFormOpen((s) => !s)}
          className="lg:hidden px-6 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-full font-bold text-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm"
        >
          {mobileFormOpen ? t("admin.hide_form") : t("admin.open_form")}
        </button>
      </div>
    </div>
  );
};

// --- MAIN COMPONENT ---

export default function ProductManager() {
  const navigate = useNavigate();

  // Custom Hook Handles everything
  const { state, actions } = useProductManager();

  return (
    <div className="container mx-auto px-4 py-8 lg:px-8 max-w-7xl flex-1">

      {/* Header & Navigation */}
      <PageHeader
        navigate={navigate}
        setMobileFormOpen={actions.setMobileFormOpen}
        mobileFormOpen={state.mobileFormOpen}
      />

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

        {/* Form Column (Left side on Desktop) */}
        <ProductForm
          form={state.form}
          setForm={actions.setForm}
          categories={state.categories}
          editingId={state.editingId}
          uploading={state.uploading}
          mobileFormOpen={state.mobileFormOpen}
          handleSubmit={actions.handleSubmit}
          handleFileUpload={actions.handleFileUpload}
          resetForm={actions.resetForm}
        />

        {/* List Column (Right side on Desktop) */}
        <ProductList
          products={state.products}
          filterGender={state.filterGender}
          setFilterGender={actions.setFilterGender}
          filterCategory={state.filterCategory}
          setFilterCategory={actions.setFilterCategory}
          uniqueCategoriesForFilter={state.uniqueCategoriesForFilter}
          searchTerm={state.searchTerm}
          setSearchTerm={actions.setSearchTerm}
          handleEdit={actions.handleEdit}
          handleDelete={actions.handleDelete}
        />

      </div>
    </div>
  );
}

