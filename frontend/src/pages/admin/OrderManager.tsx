import OrderTable from "../../components/admin/orders/OrderTable.jsx";
import OrderCard from "../../components/admin/orders/OrderCard.jsx";
import OrderDetailsModal from "../../components/admin/orders/OrderDetailsModal.jsx";
import UndoApproveModal from "../../components/admin/orders/UndoApproveModal.jsx";
import useOrderManager from "../../hooks/admin/useOrderManager";
import useOrderFilters from "../../hooks/admin/useOrderFilters";
import EmptyState from "../../components/common/EmptyState";
import { useLanguage } from "../../context/LanguageContext";
import { useState } from "react";

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
  const { t } = useLanguage();
  const {
    orders,
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

  const filters = useOrderFilters(orders);

  // Modal hoàn tác duyệt nhầm (thay runbook SQL): mở khi bấm nút Undo trên đơn Return Approved
  const [undoOrder, setUndoOrder] = useState(null);

  const handleOpenUndoApprove = (order) => setUndoOrder(order);

  // Handler mở Modal (chỉ còn dùng cho Mobile / OrderCard)
  const handleOpenDetails = (order) => {
    setSelectedOrder(order);
  };

  return (
    <div className="container mx-auto px-4 py-8 lg:px-8 max-w-7xl flex-1">

      <PageHeader />

      {/* Main Content Area */}
      <div className="bg-white dark:bg-slate-800 p-4 md:p-8 rounded-[2rem] border border-slate-200/80 dark:border-slate-700 shadow-sm min-h-[500px]">
        {orders.length === 0 ? (
          /* Global Empty State */
          <div className="flex items-center justify-center h-full min-h-[400px]">
            <EmptyState 
              title={t("admin.system_is_empty")}
              subtitle={t("admin.no_orders_subtitle")}
              icon="fa-box-open"
            />
          </div>
        ) : (
          <>
            {/* Mobile View - Hiển thị dạng thẻ và gọi Modal khi xem chi tiết */}
            <OrderCard
              orders={orders}
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
              orders={orders}
              formatCurrency={formatCurrency}
              getOrderStatusColor={getOrderStatusColor}
              getPaymentStatusColor={getPaymentStatusColor}
              handlePaymentStatus={handlePaymentStatus}
              handleOrderStatus={handleOrderStatus}
              handleApproveReturn={handleApproveReturn}
              handleRejectReturn={handleRejectReturn}
              onUndoApproveReturn={handleOpenUndoApprove}
              filters={filters}
            />
          </>
        )}
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
