import OrderTable from "../../components/admin/orders/OrderTable.jsx";
import OrderCard from "../../components/admin/orders/OrderCard.jsx";
import OrderDetailsModal from "../../components/admin/orders/OrderDetailsModal.jsx";
import useOrderManager from "../../hooks/admin/useOrderManager";
import useOrderFilters from "../../hooks/admin/useOrderFilters";
import EmptyState from "../../components/common/EmptyState";

// --- SUB-COMPONENTS ---
const PageHeader = () => (
  <div className="flex justify-center md:justify-start mb-8">
    <div className="inline-flex items-center gap-3 px-6 py-2.5 bg-white border border-gray-100 rounded-full shadow-sm">
      <div className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse"></div>
      <h2 className="font-bold uppercase text-gray-700 tracking-wider text-sm">
        Order Management
      </h2>
    </div>
  </div>
);

// --- MAIN COMPONENT ---
export default function OrderManager() {
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
  } = useOrderManager();

  const filters = useOrderFilters(orders);

  // Handler mở Modal (chỉ còn dùng cho Mobile / OrderCard)
  const handleOpenDetails = (order) => {
    setSelectedOrder(order);
  };

  return (
    <div className="container mx-auto px-4 py-8 lg:px-8 max-w-7xl flex-1">

      <PageHeader />

      {/* Main Content Area */}
      <div className="bg-gray-50/80 p-4 md:p-8 rounded-[2rem] border border-gray-100 shadow-inner min-h-[500px]">
        {orders.length === 0 ? (
          /* Global Empty State */
          <div className="flex items-center justify-center h-full min-h-[400px]">
            <EmptyState 
              title="System is Empty"
              subtitle="There are no orders in the system yet. Wait for customers to make purchases."
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
    </div>
  );
}
