import React from "react";
import useSaleManager from "../../hooks/admin/useSaleManager";
import SaleForm from "../../components/admin/sales/SaleForm";
import SaleTargetSelection from "../../components/admin/sales/SaleTargetSelection";
import SaleTable from "../../components/admin/sales/SaleTable";
import SaleDetailModal from "../../components/admin/sales/SaleDetailModal";
import PageHeader from "../../components/admin/layout/PageHeader";
import PageLoader from "../../components/common/PageLoader";

export default function SaleManager() {
  const {
    isLoading,
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
    editingId,
    handleEdit,
    handleCancelEdit,
    handleSubmit
  } = useSaleManager();

  return (
    <div className="container mx-auto px-4 py-8 lg:px-8 max-w-7xl flex-1 font-sans flex flex-col">
      <div className="flex justify-start mb-8">
        <PageHeader title="Sale Management" colorClass="bg-blue-500" />
      </div>

      {isLoading ? (
        <PageLoader />
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Form Settings (40%) */}
          <div className="lg:col-span-5">
            <SaleForm
              formData={formData}
              setFormData={setFormData}
              onSubmit={handleSubmit}
              editingId={editingId}
              onCancel={handleCancelEdit}
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
          onEdit={handleEdit}
        />

        {/* Floating Detail Modal */}
        <SaleDetailModal
          detailModal={detailModal}
          onClose={() => setDetailModal({ ...detailModal, isOpen: false })}
        />
        </>
      )}
    </div>
  );
}
