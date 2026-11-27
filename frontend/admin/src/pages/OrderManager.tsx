import OrderTable from "../components/orders/OrderTable.tsx";
import OrderCard from "../components/orders/OrderCard.tsx";
import OrderDetailsModal from "../components/orders/OrderDetailsModal.tsx";
import UndoApproveModal from "../components/orders/UndoApproveModal.tsx";
import AdminPagination from "../components/layout/AdminPagination";
import useOrderManager from "../hooks/useOrderManager";
import { useLanguage } from "@shop/shared/context/LanguageContext";
import { useState } from "react";
import type { AdminOrder } from "../components/orders/orderTypes";

const PageHeader = () => {
  const { t } = useLanguage();
  return (
    <div className="flex justify-center md:justify-start mb-8">
      <div className="inline-flex items-center gap-3 px-6 py-2.5 bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 rounded-full shadow-sm">
        <div className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse"></div>
        <h2 className="font-bold uppercase text-slate-700 dark:text-slate-200 tracking-wider text-sm m-0 leading-none">
          {t("admin.order_management")}
        </h2>
      </div>
    </div>
  );
};

export default function OrderManager() {
  const {
    filters,
    pagination,
    handlePageChange,
    selectedOrder,
    setSelectedOrder,
    formatCurrency,
    getOrderStatusColor,
    getPaymentStatusColor,
    handleOrderStatus,
    handlePaymentStatus,
    handleApproveReturn,
    handleRejectReturn,
    handleUndoApproveReturn,
  } = useOrderManager();

  // Modal hoàn tác duyệt nhầm (thay runbook SQL): mở khi bấm nút Undo trên đơn Return Approved
  const [undoOrder, setUndoOrder] = useState<AdminOrder | null>(null);

  const handleOpenUndoApprove = (order: AdminOrder) => setUndoOrder(order);

  // Handler mở Modal (chỉ còn dùng cho Mobile / OrderCard)
  const handleOpenDetails = (order: AdminOrder) => {
    setSelectedOrder(order);
  };

  return (
    <div className="container mx-auto px-4 py-8 lg:px-8 max-w-7xl flex-1">

      <PageHeader />

      {/* Main Content Area — luôn render OrderCard/OrderTable để giữ thanh chuyển tab Standard ↔ Returns */}
      <div className="bg-white dark:bg-slate-800 p-4 md:p-8 rounded-[2rem] border border-slate-200/80 dark:border-slate-700 shadow-sm min-h-[500px]">
          <>
            {/* Mobile View - Hiển thị dạng thẻ và gọi Modal khi xem chi tiết */}
            <OrderCard
              formatCurrency={formatCurrency}
              getOrderStatusColor={getOrderStatusColor}
              getPaymentStatusColor={getPaymentStatusColor}
              handlePaymentStatus={handlePaymentStatus}
              handleOrderStatus={handleOrderStatus}
              handleApproveReturn={handleApproveReturn}
              handleRejectReturn={handleRejectReturn}
              onUndoApproveReturn={handleOpenUndoApprove}
              onViewDetails={handleOpenDetails}
              filters={filters}
            />

            {/* Desktop View - Bảng đã tự tích hợp Tabs, Filter và Expandable Row bên trong */}
            <OrderTable
              formatCurrency={formatCurrency}
              getOrderStatusColor={getOrderStatusColor}
              getPaymentStatusColor={getPaymentStatusColor}
              handlePaymentStatus={handlePaymentStatus}
              handleOrderStatus={handleOrderStatus}
              handleApproveReturn={handleApproveReturn}
              handleRejectReturn={handleRejectReturn}
            onUndoApproveReturn={handleOpenUndoApprove}
            onViewDetails={handleOpenDetails}
            filters={filters}
            />

            {/* Phân trang dùng chung cho cả table (desktop) và card (mobile) */}
            <AdminPagination
              currentPage={pagination.currentPage}
              totalPages={pagination.totalPages}
              totalItems={pagination.totalOrders}
              onPageChange={handlePageChange}
            />
          </>
      </div>

      {/* Details Modal (Dành riêng cho Mobile View) */}
      <OrderDetailsModal
        order={selectedOrder}
        onClose={() => setSelectedOrder(null)}
        formatCurrency={formatCurrency}
      />

      {/* Undo Approve Modal — hoàn tác duyệt nhầm Return Approved (thay runbook SQL) */}
      <UndoApproveModal
        order={undoOrder}
        onClose={() => setUndoOrder(null)}
        onConfirm={handleUndoApproveReturn}
        formatCurrency={formatCurrency}
      />
    </div>
  );
}
