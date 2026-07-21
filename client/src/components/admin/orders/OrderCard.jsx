import React, { useState } from "react";

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
  const [activeTab, setActiveTab] = useState("Standard");
  const [filterStatus, setFilterStatus] = useState("All");

  const PAYMENT_OPTIONS = ["Unpaid", "Paid", "Refunded"];
  const RETURN_STATUSES = ["Return Requested", "Return Rejected", "Return Approved"];
  const STANDARD_STATUSES = ["Pending", "Confirmed", "Shipping", "Delivered", "Cancelled"];
  const STATUS_OPTIONS = [...STANDARD_STATUSES, ...RETURN_STATUSES];

  // Switch tab resets filter
  const handleTabSwitch = (tab) => {
    setActiveTab(tab);
    setFilterStatus("All");
  };

  // Filter orders by current tab + status filter
  const displayedOrders = orders.filter((order) => {
    if (activeTab === "Standard") {
      if (RETURN_STATUSES.includes(order.status)) return false;
      return filterStatus === "All" || order.status === filterStatus;
    } else {
      if (!RETURN_STATUSES.includes(order.status)) return false;
      return filterStatus === "All" || order.status === filterStatus;
    }
  });

  const currentFilterOptions = activeTab === "Standard"
    ? ["All", ...STANDARD_STATUSES]
    : ["All", ...RETURN_STATUSES];

  return (
    <div className="md:hidden space-y-4">

      {/* === TAB SWITCHER === */}
      <div className="inline-flex w-full p-1.5 bg-gray-100 rounded-2xl shadow-inner">
        <button
          onClick={() => handleTabSwitch("Standard")}
          className={`flex-1 py-2.5 rounded-xl font-bold text-xs transition-all duration-300 flex items-center justify-center gap-1.5 ${
            activeTab === "Standard"
              ? "bg-white text-blue-600 shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          <i className="fa-solid fa-box text-xs"></i> Orders
        </button>
        <button
          onClick={() => handleTabSwitch("Returns")}
          className={`flex-1 py-2.5 rounded-xl font-bold text-xs transition-all duration-300 flex items-center justify-center gap-1.5 ${
            activeTab === "Returns"
              ? "bg-white text-orange-600 shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          <i className="fa-solid fa-rotate-left text-xs"></i> Returns
        </button>
      </div>

      {/* === STATUS FILTER CHIPS (Scrollable horizontally) === */}
      <div className="overflow-x-auto pb-1 -mx-1 px-1">
        <div className="flex gap-2 w-max">
          {currentFilterOptions.map((f) => (
            <button
              key={f}
              onClick={() => setFilterStatus(f)}
              className={`px-3.5 py-1.5 rounded-full font-bold text-xs whitespace-nowrap transition-all ${
                filterStatus === f
                  ? "bg-gray-800 text-white shadow-sm"
                  : "bg-gray-100 text-gray-500 hover:bg-gray-200"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* === ORDER CARDS === */}
      {displayedOrders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center bg-white rounded-2xl border border-gray-100">
          <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-3 shadow-inner">
            <i className="fa-solid fa-folder-open text-gray-300 text-2xl"></i>
          </div>
          <p className="font-bold text-gray-700 text-base">No Orders Found</p>
          <p className="text-xs text-gray-400 mt-1">No <span className="font-semibold">{filterStatus}</span> orders</p>
        </div>
      ) : (
        displayedOrders.map((order) => {
          const isReturnLocked = order.status === "Return Requested";

          return (
            <div key={order.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-3.5">

              {/* Header: ID & Date & Payment Method */}
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-extrabold text-gray-800 text-base">#{order.id}</p>
                  <p className="text-xs text-gray-400 font-medium mt-0.5">
                    {new Date(order.created_at).toLocaleString("en-GB")}
                  </p>
                </div>
                <span className="text-[10px] uppercase tracking-wider px-3 py-1.5 rounded-full bg-gray-50 text-gray-600 font-bold border border-gray-100 shadow-sm">
                  {order.payment_method === "momo" ? "💳 MoMo" : "💵 COD"}
                </span>
              </div>

              {/* Customer Info */}
              <div className="bg-gray-50 px-3.5 py-3 rounded-xl">
                <p className="text-sm font-bold text-gray-800">{order.user_name || order.name}</p>
                <p className="text-xs text-gray-400 mt-0.5">{order.phone || "No phone"}</p>
              </div>

              {/* Return Action Section */}
              {isReturnLocked && (
                <div className="p-3.5 bg-orange-50 rounded-xl border border-orange-100">
                  <p className="text-[10px] font-bold text-orange-600 uppercase mb-2.5 text-center tracking-wider">
                    ⚠ Return Action Required
                  </p>
                  <div className="flex gap-2.5">
                    <button
                      onClick={() => handleApproveReturn(order.id)}
                      className="flex-1 bg-green-500 text-white py-2.5 rounded-full text-[10px] font-bold uppercase tracking-wider hover:bg-green-600 shadow-sm transition-colors"
                    >
                      ✓ Approve
                    </button>
                    <button
                      onClick={() => handleRejectReturn(order.id)}
                      className="flex-1 bg-red-500 text-white py-2.5 rounded-full text-[10px] font-bold uppercase tracking-wider hover:bg-red-600 shadow-sm transition-colors"
                    >
                      ✕ Reject
                    </button>
                  </div>
                </div>
              )}

              {/* Status Controls */}
              <div className="flex flex-col gap-3">
                <div className="flex justify-between items-center">
                  <select
                    value={order.payment_status || "Unpaid"}
                    onChange={(e) => handlePaymentStatus(order.id, e.target.value)}
                    disabled={isReturnLocked}
                    className="text-xs font-bold text-white py-2.5 px-4 rounded-full outline-none focus:ring-2 focus:ring-blue-500/20 disabled:opacity-60 appearance-none text-center shadow-sm cursor-pointer min-w-[100px]"
                    style={{ backgroundColor: getPaymentStatusColor(order.payment_status) }}
                  >
                    {PAYMENT_OPTIONS.map((s) => (
                      <option key={s} value={s} className="text-gray-800 bg-white">{s}</option>
                    ))}
                  </select>

                  <span className="text-red-600 font-black text-lg">
                    {formatCurrency(order.total_price)}
                  </span>
                </div>

                <div className="flex gap-2.5">
                  <select
                    value={order.status}
                    onChange={(e) => handleOrderStatus(order.id, e.target.value)}
                    disabled={isReturnLocked}
                    className="flex-1 text-xs font-bold text-white py-2.5 px-4 rounded-full outline-none text-center appearance-none shadow-sm disabled:opacity-60 cursor-pointer"
                    style={{ backgroundColor: getOrderStatusColor(order.status) }}
                  >
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s} value={s} className="bg-white text-gray-800 text-center">{s}</option>
                    ))}
                  </select>

                  <button
                    onClick={() => onViewDetails(order)}
                    className="px-6 bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white py-2.5 rounded-full text-xs font-bold uppercase tracking-wider transition-colors shadow-sm flex-shrink-0"
                  >
                    Details
                  </button>
                </div>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
