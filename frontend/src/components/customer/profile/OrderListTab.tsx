import React from "react";
import { ModernStatusBadge, PaymentStatusBadge } from "./OrderBadges";
import { PaymentBadge } from "../../common/PaymentBadge";

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
      <div className="text-center py-20 bg-slate-50/50 rounded-2xl border border-slate-100 p-6">
        <i className="fa-solid fa-box-open text-4xl text-slate-300 mb-3"></i>
        <p className="text-slate-500 font-medium text-sm">You have no order history yet.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-5 animate-in fade-in duration-300">
      {orders.map((order) => {
        const totalItems = order.items?.reduce((sum, item) => sum + (item.quantity || 1), 0) || 0;
        const itemsSummary = order.items?.map(item => `${item.product_name || 'Item'} (x${item.quantity})`).join(', ');

        return (
          <div
            key={order.id}
            className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm flex flex-col justify-between hover:border-slate-300 transition-all"
          >
            <div>
              {/* Header: Order ID & Status */}
              <div className="flex justify-between items-start pb-3 mb-3 border-b border-slate-100">
                <div>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Order #{order.id}
                  </span>
                  <p className="text-xs font-medium text-slate-600 mt-0.5">
                    {new Date(order.created_at).toLocaleDateString("en-US", { year: 'numeric', month: 'short', day: 'numeric' })}
                  </p>
                </div>
                <ModernStatusBadge status={order.status} />
              </div>

              {/* Items Summary */}
              <div className="mb-4">
                <p className="text-xs text-slate-500 font-medium line-clamp-1" title={itemsSummary}>
                  <i className="fa-solid fa-bag-shopping mr-1.5 text-slate-400"></i>
                  {itemsSummary || `${totalItems} items`}
                </p>
              </div>

              {/* Payment & Total Block */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100/80 mb-4 space-y-2.5">
                {/* Hàng 1: Trạng thái thanh toán (Trái) & Chữ TOTAL (Phải) */}
                <div className="flex justify-between items-center">
                  <PaymentStatusBadge status={order.payment_status} />
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Total
                  </span>
                </div>

                {/* Hàng 2: Phương thức COD/Momo (Trái) & Giá tiền (Phải) */}
                <div className="flex justify-between items-center">
                  <PaymentBadge method={order.payment_method} badgeStyle={true} />
                  <p className="text-base font-bold text-slate-900 leading-none">
                    {formatCurrency(order.total_price)}
                  </p>
                </div>
              </div>

              {/* Notice Return */}
              {order.status === "Return Requested" && (
                <div className="mb-4 py-2 px-3 bg-amber-50 border border-amber-100 rounded-lg text-xs font-medium text-amber-700 text-center flex items-center justify-center gap-2">
                  <i className="fa-solid fa-spinner animate-spin"></i> Processing Return
                </div>
              )}
            </div>

            {/* Actions Button */}
            <div className="flex gap-2.5 pt-1">
              <button
                onClick={() => setSelectedOrder(order)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200/80 text-slate-700 rounded-xl font-medium text-xs sm:text-sm transition-colors"
              >
                Details
              </button>

              {(order.payment_method === "momo" || order.payment_method === "vnpay") && order.payment_status === "Unpaid" && order.status !== "Cancelled" && (
                <button
                  onClick={(e) => { e.stopPropagation(); handleMoMoPayment(order); }}
                  className={`flex-1 py-2.5 ${order.payment_method === 'vnpay' ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-200' : 'bg-pink-600 hover:bg-pink-700 shadow-pink-200'} text-white rounded-xl font-semibold text-xs sm:text-sm transition-colors shadow-sm`}
                >
                  {order.payment_method === 'vnpay' ? 'Pay VNPay' : 'Pay MoMo'}
                </button>
              )}

              {order.status === "Delivered" && !order.return_request && (
                <button
                  onClick={(e) => { e.stopPropagation(); handleOpenReturnModal(order.id); }}
                  className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-medium text-xs sm:text-sm transition-colors"
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