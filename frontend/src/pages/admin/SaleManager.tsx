import React from "react";
import useSaleManager from "../../hooks/admin/useSaleManager";
import SaleForm from "../../components/admin/sales/SaleForm";
import SaleTargetSelection from "../../components/admin/sales/SaleTargetSelection";
import SaleTable from "../../components/admin/sales/SaleTable";
import SaleDetailModal from "../../components/admin/sales/SaleDetailModal";

export default function SaleManager() {
  const {
    sales,
    products,
    categories,
    selectedCategoryIds,
    selectedProductIds,
    searchTerm,
    setSearchTerm,
    applyScope,
    setApplyScope,
    detailModal,
    setDetailModal,
    formData,
    setFormData,
    toggleCategory,
    toggleProduct,
    handleShowDetail,
    handleDelete,
    handleSubmit
  } = useSaleManager();

  return (
    <div className="p-6 bg-gray-50 flex-1 font-sans">
      <div className="max-w-7xl mx-auto">

        {/* Pill UI Title */}
        <div className="flex justify-start mb-8">
          <div className="inline-flex items-center gap-3 bg-white px-6 py-3.5 rounded-full shadow-sm shadow-gray-200 border border-gray-100">
            <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
            <h2 className="font-bold uppercase text-gray-700 tracking-wider text-sm">
              Sale Management
            </h2>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Form Settings (40%) */}
          <div className="lg:col-span-5">
            <SaleForm
              formData={formData}
              setFormData={setFormData}
              onSubmit={handleSubmit}
            />
          </div>

          {/* Right Column: Target Settings (60%) */}
          <div className="lg:col-span-7">
            <SaleTargetSelection
              applyScope={applyScope}
              setApplyScope={setApplyScope}
              formData={formData}
              setFormData={setFormData}
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              categories={categories}
              products={products}
              selectedCategoryIds={selectedCategoryIds}
              toggleCategory={toggleCategory}
              selectedProductIds={selectedProductIds}
              toggleProduct={toggleProduct}
            />
          </div>
        </div>

        {/* Bottom Section: Inventory Table */}
        <SaleTable
          sales={sales}
          onShowDetail={handleShowDetail}
          onDelete={handleDelete}
        />

        {/* Floating Detail Modal */}
        <SaleDetailModal
          detailModal={detailModal}
          onClose={() => setDetailModal({ ...detailModal, isOpen: false })}
        />

      </div>
    </div>
  );
}
