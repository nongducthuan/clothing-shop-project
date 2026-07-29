import React from "react";
import { useNavigate } from "react-router-dom";
import useProductManager from "../../hooks/admin/useProductManager";
import ProductForm from "../../components/admin/products/ProductForm";
import ProductList from "../../components/admin/products/ProductList";
import Toast from "../../components/customer/layout/Toast";

// --- SUB-COMPONENTS ---

/**
 * PageHeader Component
 * Minimal, pill-shaped title badge and action buttons.
 */
const PageHeader = ({ navigate, setMobileFormOpen, mobileFormOpen }) => (
  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
    <div className="inline-flex items-center gap-3 px-6 py-2.5 bg-white border border-gray-100 rounded-full shadow-sm">
      <div className="w-2.5 h-2.5 rounded-full bg-violet-500 animate-pulse"></div>
      <h2 className="font-bold uppercase text-gray-700 tracking-wider text-sm">
        Product Management
      </h2>
    </div>

    <div className="flex gap-3 w-full md:w-auto">
      <button
        onClick={() => navigate("/admin/categories")}
        className="flex-1 md:flex-none px-6 py-2.5 bg-violet-50 text-violet-600 rounded-full font-bold text-sm hover:bg-violet-600 hover:text-white transition-colors duration-300 shadow-sm whitespace-nowrap"
      >
        <i className="fa-solid fa-tags mr-2"></i> Categories
      </button>

      {/* Mobile Form Toggle Button */}
      <button
        onClick={() => setMobileFormOpen((s) => !s)}
        className="lg:hidden px-6 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-full font-bold text-sm hover:bg-gray-50 transition-colors shadow-sm"
      >
        {mobileFormOpen ? "Hide Form" : "Open Form"}
      </button>
    </div>
  </div>
);

// --- MAIN COMPONENT ---

export default function ProductManager() {
  const navigate = useNavigate();

  // Custom Hook Handles everything
  const { state, actions } = useProductManager();

  return (
    <div className="container mx-auto px-4 py-8 lg:px-8 max-w-7xl min-h-screen mb-10">

      {/* Toast Notification */}
      {state.toast && (
        <Toast
          message={state.toast.message}
          type={state.toast.type}
          onClose={() => actions.setToast(null)}
        />
      )}

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
          BACKEND_URL={state.BACKEND_URL}
        />

      </div>
    </div>
  );
}
