import React from "react";
import useVoucherManager from "../../hooks/admin/useVoucherManager";
import VoucherForm from "../../components/admin/vouchers/VoucherForm";
import VoucherTargetSelection from "../../components/admin/vouchers/VoucherTargetSelection";
import VoucherTable from "../../components/admin/vouchers/VoucherTable";
import VoucherDetailModal from "../../components/admin/vouchers/VoucherDetailModal";

export default function VoucherManager() {
  const {
    vouchers,
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
    handleDelete,
    handleShowDetail,
    handleSubmit,
  } = useVoucherManager();

  return (
    <div className="p-6 bg-gray-50 min-h-screen font-sans">
      <div className="max-w-7xl mx-auto">
        {/* Title Header */}
        <div className="flex justify-start mb-8">
          <div className="inline-flex items-center gap-3 bg-white px-6 py-3.5 rounded-full shadow-sm shadow-gray-200 border border-gray-100">
            <div className="w-3 h-3 bg-indigo-500 rounded-full"></div>
            <h2 className="font-bold uppercase text-gray-700 tracking-wider text-sm">
              Voucher Management
            </h2>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Form Settings (40%) */}
          <div className="lg:col-span-5">
            <VoucherForm
              formData={formData}
              setFormData={setFormData}
              onSubmit={handleSubmit}
            />
          </div>

          {/* Right Column: Target Settings (60%) */}
          <div className="lg:col-span-7">
            <VoucherTargetSelection
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
        <VoucherTable
          vouchers={vouchers}
          onShowDetail={handleShowDetail}
          onDelete={handleDelete}
        />

        {/* Floating Detail Modal */}
        <VoucherDetailModal
          detailModal={detailModal}
          onClose={() => setDetailModal({ ...detailModal, isOpen: false })}
        />
      </div>
    </div>
  );
}
