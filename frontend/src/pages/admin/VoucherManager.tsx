import React from "react";
import useVoucherManager from "../../hooks/admin/useVoucherManager";
import VoucherForm from "../../components/admin/vouchers/VoucherForm";
import VoucherTargetSelection from "../../components/admin/vouchers/VoucherTargetSelection";
import VoucherTable from "../../components/admin/vouchers/VoucherTable";
import VoucherDetailModal from "../../components/admin/vouchers/VoucherDetailModal";
import PageHeader from "../../components/admin/layout/PageHeader";

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
    handleEdit,
    handleCancelEdit,
    handleShowDetail,
    handleSubmit,
    editingId
  } = useVoucherManager();

  return (
    <div className="container mx-auto px-4 py-8 lg:px-8 max-w-7xl flex-1 font-sans">
      <div className="flex justify-start mb-8">
        <PageHeader title="Voucher Management" colorClass="bg-indigo-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Form Settings (40%) */}
        <div className="lg:col-span-5">
          <VoucherForm
            formData={formData}
            setFormData={setFormData}
            onSubmit={handleSubmit}
            editingId={editingId}
            onCancel={handleCancelEdit}
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
        onEdit={handleEdit}
      />

      {/* Floating Detail Modal */}
      <VoucherDetailModal
        detailModal={detailModal}
        onClose={() => setDetailModal({ ...detailModal, isOpen: false })}
      />
    </div>
  );
}
