import React from "react";
import { useNavigate } from "react-router-dom";
import { useCategoryManager } from "../../hooks/admin/useCategoryManager";
import CategoryForm from "../../components/admin/categories/CategoryForm";
import CategoryList from "../../components/admin/categories/CategoryList";

// --- SUB-COMPONENTS ---

/**
 * PageHeader Component
 * Displays a minimal, pill-shaped title badge and a matching action button.
 */
const PageHeader = ({ navigate }) => (
  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
    {/* Pill Badge Title */}
    <div className="inline-flex items-center gap-3 px-6 py-2.5 bg-white border border-gray-100 rounded-full shadow-sm">
      <div className="w-2.5 h-2.5 rounded-full bg-fuchsia-500 animate-pulse"></div>
      <h2 className="font-bold uppercase text-gray-700 tracking-wider text-sm">
        Category Management
      </h2>
    </div>

    {/* Action Button (Pill Styled) */}
    <button
      onClick={() => navigate("/admin/products")}
      className="px-6 py-2.5 bg-violet-50 text-violet-600 rounded-full font-bold text-sm hover:bg-violet-600 hover:text-white transition-colors duration-300 shadow-sm whitespace-nowrap"
    >
      <i className="fa-solid fa-boxes-stacked mr-2"></i> Manage Products
    </button>
  </div>
);

// --- MAIN COMPONENT ---

/**
 * Main Layout for Category Management.
 * Orchestrates the Category Form and List side-by-side in a modern UI wrapper.
 */
export default function CategoryManager() {
  const navigate = useNavigate();

  // Destructure all required logic from the custom hook (Logic remains untouched)
  const {
    categories, editingId, loading, filterGender, setFilterGender,
    categoryImages, recommendNames, form, setForm,
    handleChange, handleSubmit, handleEdit, handleDelete, resetForm
  } = useCategoryManager();

  return (
    <div className="container mx-auto px-4 py-8 lg:px-8 max-w-7xl flex-1">

      {/* Reusable Pill Header & Actions */}
      <PageHeader navigate={navigate} />

      {/* Main Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

        {/* ======================== FORM SECTION ======================== */}
        {/* Placed inside a heavily rounded white card (sticky to screen on scroll) */}
        <div className="lg:col-span-5 xl:col-span-4 bg-white p-6 md:p-8 rounded-[2rem] border border-gray-100 shadow-sm transition-all duration-300 hover:shadow-md lg:sticky lg:top-24 relative z-10">
          <CategoryForm
            form={form}
            setForm={setForm}
            handleChange={handleChange}
            handleSubmit={handleSubmit}
            loading={loading}
            editingId={editingId}
            resetForm={resetForm}
            recommendNames={recommendNames}
            categoryImages={categoryImages}
          />
        </div>

        {/* ======================== LIST SECTION ======================== */}
        {/* Placed inside a soft gray, track-like container */}
        <div className="lg:col-span-7 xl:col-span-8 bg-gray-50/80 p-6 md:p-8 rounded-[2rem] border border-gray-100 shadow-inner min-h-[500px]">
          <CategoryList
            categories={categories}
            filterGender={filterGender}
            setFilterGender={setFilterGender}
            handleEdit={handleEdit}
            handleDelete={handleDelete}
          />
        </div>

      </div>
    </div>
  );
}
