import React from "react";
import { ModernStatusBadge, PaymentStatusBadge } from "./OrderBadges";

export default function OrderListTab({ state, actions, helpers }) {
  const { orders, loadingOrders } = state;
  const { setSelectedOrder, handleMoMoPayment, handleOpenReturnModal } = actions;
  const { formatCurrency } = helpers;

  if (loadingOrders) {
    return (
      <div className="flex justify-center py-20">
        <i className="fa-solid fa-circle-notch fa-spin text-3xl text-slate-300"></i>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="text-center py-24 bg-slate-50 rounded-[2rem] border border-slate-100">
        <i className="fa-solid fa-box-open text-4xl text-slate-300 mb-4"></i>
        <p className="text-slate-500 font-medium">You have no order history yet.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in duration-500">
      {orders.map((order) => {
        // Calculate total items in the order
        const totalItems = order.items.reduce((sum, item) => sum + (item.quantity || 1), 0);
        // Create a summary text: "T-Shirt (x2), Jeans (x1)"
        const itemsSummary = order.items.map(item => `${item.product_name || 'Item'} (x${item.quantity})`).join(', ');

        return (
          <div key={order.id} className="bg-slate-50 rounded-[2rem] p-6 sm:p-8 border border-slate-100 flex flex-col transition-all hover:border-slate-200 hover:shadow-sm">

            {/* Header: Order ID & Date */}
            <div className="flex justify-between items-start mb-6">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">
                  Order #{order.id}
                </p>
                <p className="text-sm font-medium text-slate-900">
                  {new Date(order.created_at).toLocaleDateString("en-US", { year: 'numeric', month: 'short', day: 'numeric' })}
                </p>
              </div>
              <ModernStatusBadge status={order.status} />
            </div>

            {/* Payment & Total */}
            <div className="flex justify-between items-end mb-6">
              <div className="space-y-2">
                <PaymentStatusBadge status={order.payment_status} />
                <p className="text-xs font-medium text-slate-500 capitalize">{order.payment_method}</p>
              </div>
              <div className="text-right">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Total</p>
                <p className="text-lg font-medium text-slate-900">{formatCurrency(order.total_price)}</p>
              </div>
            </div>

            {/* Return Requested Notice */}
            {order.status === "Return Requested" && (
              <div className="mb-4 py-2 px-4 bg-white border border-slate-100 rounded-lg text-xs font-medium text-slate-500 text-center">
                <i className="fa-solid fa-spinner animate-spin mr-2"></i> Processing Return
              </div>
            )}

            {/* Actions */}
            <div className="grid grid-cols-2 gap-3 mt-auto">
              <button
                onClick={() => setSelectedOrder(order)}
                className="py-3 bg-white border border-slate-200 text-slate-900 rounded-xl font-medium text-sm hover:bg-slate-100 transition-colors"
              >
                Details
              </button>

              {order.payment_method === "momo" && order.payment_status === "Unpaid" && order.status !== "Cancelled" && (
                <button
                  onClick={(e) => { e.stopPropagation(); handleMoMoPayment(order); }}
                  className="py-3 bg-rose-50 text-rose-600 border border-rose-100 rounded-xl font-medium text-sm hover:bg-rose-100 transition-colors"
                >
                  Pay MoMo
                </button>
              )}

              {order.status === "Delivered" && !order.return_id && (
                <button
                  onClick={(e) => { e.stopPropagation(); handleOpenReturnModal(order.id); }}
                  className="py-3 bg-slate-900 text-white rounded-xl font-medium text-sm hover:bg-slate-800 transition-colors"
                >
                  Return
                </button>
              )}
            </div>

          </div>
        );
      })}
    </div>
  );
}
