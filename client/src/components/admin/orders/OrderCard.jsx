import React from "react";

export default function OrderCard({
  orders,
  getOrderStatusColor,
  getPaymentStatusColor,
  formatCurrency,
  handleOrderStatus,
  handlePaymentStatus,
  onViewDetails,
  handleApproveReturn,
  handleRejectReturn,
}) {
  const PAYMENT_OPTIONS = ["Unpaid", "Paid", "Refunded"];
  const STATUS_OPTIONS = [
    "Pending", "Confirmed", "Shipping", "Delivered",
    "Cancelled", "Return Requested", "Return Rejected", "Return Approved"
  ];

  return (
    <div className="grid grid-cols-1 gap-4 md:hidden">
      {orders.map((order) => {
        const isReturnLocked = order.status === "Return Requested";

        return (
          <div key={order.id} className="bg-white p-5 rounded-[1.5rem] shadow-sm border border-gray-100 flex flex-col gap-4">
            {/* Header: ID & Date & Payment Method */}
            <div className="flex justify-between items-start">
              <div>
                <p className="font-extrabold text-gray-800 text-lg">#{order.id}</p>
                <p className="text-xs text-gray-500 font-medium mt-0.5">
                  {new Date(order.created_at).toLocaleString("en-GB")}
                </p>
              </div>
              <span className="text-[10px] uppercase tracking-wider px-3 py-1.5 rounded-full bg-gray-50 text-gray-600 font-bold border border-gray-100 shadow-sm">
                {order.payment_method === "momo" ? "💳 MoMo" : "💵 COD"}
              </span>
            </div>

            {/* Customer Info */}
            <div className="bg-gray-50/50 p-3 rounded-xl border border-gray-50">
              <p className="text-sm font-bold text-gray-800">{order.user_name || order.name}</p>
              <p className="text-xs text-gray-500 mt-1">{order.phone || "No phone provided"}</p>
            </div>

            {/* Return Action Section */}
            {isReturnLocked && (
              <div className="p-4 bg-orange-50 rounded-2xl border border-orange-100">
                <p className="text-[10px] font-bold text-orange-600 uppercase mb-3 text-center tracking-wider">
                  Return Action Required
                </p>
                <div className="flex gap-3">
                  <button onClick={() => handleApproveReturn(order.id)} className="flex-1 bg-green-500 text-white py-2.5 rounded-full text-[10px] font-bold uppercase tracking-wider hover:bg-green-600 shadow-sm transition-colors">
                    Approve
                  </button>
                  <button onClick={() => handleRejectReturn(order.id)} className="flex-1 bg-red-500 text-white py-2.5 rounded-full text-[10px] font-bold uppercase tracking-wider hover:bg-red-600 shadow-sm transition-colors">
                    Reject
                  </button>
                </div>
              </div>
            )}

            {/* Status Controls */}
            <div className="flex justify-between items-center bg-white">
              <select
                value={order.payment_status || "Unpaid"}
                onChange={(e) => handlePaymentStatus(order.id, e.target.value)}
                disabled={isReturnLocked}
                className="text-xs font-bold text-white py-2 px-4 rounded-full outline-none focus:ring-4 focus:ring-blue-500/20 disabled:opacity-60 appearance-none text-center shadow-sm"
                style={{ backgroundColor: getPaymentStatusColor(order.payment_status) }}
              >
                {PAYMENT_OPTIONS.map((s) => (
                  <option key={s} value={s} className="text-gray-800 bg-white">{s}</option>
                ))}
              </select>

              <span className="text-red-600 font-black text-xl">
                {formatCurrency(order.total_price)}
              </span>
            </div>

            {/* Order Status & Details */}
            <div className="flex gap-3">
              <select
                value={order.status}
                onChange={(e) => handleOrderStatus(order.id, e.target.value)}
                disabled={isReturnLocked}
                className="flex-1 text-xs font-bold text-white py-2.5 px-3 rounded-full outline-none text-center appearance-none shadow-sm disabled:opacity-60"
                style={{ backgroundColor: getOrderStatusColor(order.status) }}
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s} className="bg-white text-gray-800 text-left">{s}</option>
                ))}
              </select>

              <button
                onClick={() => onViewDetails(order)}
                className="px-6 bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white py-2.5 rounded-full text-xs font-bold uppercase tracking-wider transition-colors duration-300 shadow-sm"
              >
                Details
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
