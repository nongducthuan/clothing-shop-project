import React, { useState } from "react";

export default function OrderTable({
  orders,
  getOrderStatusColor,
  getPaymentStatusColor,
  formatCurrency,
  handlePaymentStatus,
  handleOrderStatus,
  handleApproveReturn,
  handleRejectReturn,
}) {
  // --- STATES ---
  const [activeTab, setActiveTab] = useState("Standard"); // "Standard" | "Returns"
  const [filterStandard, setFilterStandard] = useState("All");
  const [filterReturn, setFilterReturn] = useState("All");
  const [expandedOrderId, setExpandedOrderId] = useState(null);

  // --- CONSTANTS ---
  const PAYMENT_OPTIONS = ["Unpaid", "Paid", "Refunded"];

  const STANDARD_STATUSES = ["Pending", "Confirmed", "Shipping", "Delivered", "Cancelled"];
  const RETURN_STATUSES = ["Return Requested", "Return Rejected", "Return Approved"];

  const STATUS_OPTIONS = [...STANDARD_STATUSES, ...RETURN_STATUSES];

  // --- HANDLERS ---
  const toggleExpand = (orderId) => {
    setExpandedOrderId((prev) => (prev === orderId ? null : orderId));
  };

  const handleTabSwitch = (tab) => {
    setActiveTab(tab);
    setExpandedOrderId(null); // Đóng hàng đang mở khi chuyển tab
  };

  // --- LỌC DỮ LIỆU ---
  const displayedOrders = orders.filter((order) => {
    if (activeTab === "Standard") {
      if (RETURN_STATUSES.includes(order.status)) return false;
      return filterStandard === "All" || order.status === filterStandard;
    } else {
      if (!RETURN_STATUSES.includes(order.status)) return false;
      return filterReturn === "All" || order.status === filterReturn;
    }
  });

  const currentFilters = activeTab === "Standard" ? ["All", ...STANDARD_STATUSES] : ["All", ...RETURN_STATUSES];
  const currentActiveFilter = activeTab === "Standard" ? filterStandard : filterReturn;
  const setCurrentFilter = activeTab === "Standard" ? setFilterStandard : setFilterReturn;

  return (
    <div className="hidden md:flex flex-col gap-6">

      {/* ================= HEADER: TABS & FILTERS ================= */}
      <div className="bg-white p-5 md:p-6 rounded-[2rem] shadow-sm border border-gray-100 flex flex-col gap-5">

        {/* TABS */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <h3 className="font-extrabold text-gray-800 text-xl flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center">
              <i className="fa-solid fa-table-list"></i>
            </div>
            Orders Board
          </h3>

          <div className="inline-flex p-1.5 bg-gray-50 border border-gray-100 rounded-full shadow-inner">
            <button
              onClick={() => handleTabSwitch("Standard")}
              className={`px-6 py-2.5 rounded-full font-bold text-sm transition-all duration-300 ease-out flex items-center gap-2 ${
                activeTab === "Standard"
                  ? "bg-white text-blue-600 shadow-sm scale-100"
                  : "text-gray-500 hover:text-gray-800 hover:bg-gray-200/50 scale-95"
              }`}
            >
              <i className="fa-solid fa-box"></i> Standard Orders
            </button>
            <button
              onClick={() => handleTabSwitch("Returns")}
              className={`px-6 py-2.5 rounded-full font-bold text-sm transition-all duration-300 ease-out flex items-center gap-2 ${
                activeTab === "Returns"
                  ? "bg-white text-orange-600 shadow-sm scale-100"
                  : "text-gray-500 hover:text-gray-800 hover:bg-gray-200/50 scale-95"
              }`}
            >
              <i className="fa-solid fa-rotate-left"></i> Returns & Refunds
            </button>
          </div>
        </div>

        {/* FILTERS CHO TAB HIỆN TẠI */}
        <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-50">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider py-2 mr-2">Filter by Status:</span>
          {currentFilters.map((f) => (
            <button
              key={f}
              onClick={() => setCurrentFilter(f)}
              className={`px-4 py-1.5 rounded-full font-bold text-xs transition-all duration-300 ease-out ${
                currentActiveFilter === f
                  ? "bg-gray-800 text-white shadow-sm"
                  : "bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-800"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* ================= BẢNG DỮ LIỆU CHÍNH ================= */}
      <div className="bg-white shadow-sm border border-gray-100 rounded-[2rem] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50/50 border-b border-gray-100">
              <tr>
                <th className="p-4 pl-6 text-xs font-bold text-gray-400 uppercase tracking-wider">ID / Date</th>
                <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Customer</th>
                <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Total</th>
                <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Payment</th>
                <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Status</th>
                <th className="p-4 pr-6 text-center text-xs font-bold text-gray-400 uppercase tracking-wider w-36">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">

              {/* NẾU KHÔNG CÓ ĐƠN HÀNG */}
              {displayedOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-16 text-center">
                    <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-100 shadow-inner">
                      <i className="fa-solid fa-folder-open text-gray-300 text-3xl"></i>
                    </div>
                    <h4 className="font-bold text-gray-800 text-lg mb-1">No Orders Found</h4>
                    <p className="text-gray-500 font-medium text-sm">
                      No matching orders for <span className="font-bold text-gray-700">"{currentActiveFilter}"</span> in {activeTab}.
                    </p>
                  </td>
                </tr>
              ) : (
                /* HIỂN THỊ DANH SÁCH ĐƠN HÀNG */
                displayedOrders.map((order) => {
                  const isReturnLocked = order.status === 'Return Requested';
                  const isExpanded = expandedOrderId === order.id;

                  return (
                    <React.Fragment key={order.id}>
                      {/* --- DÒNG CHÍNH (MAIN ROW) --- */}
                      <tr className={`transition-colors duration-200 group ${isExpanded ? "bg-blue-50/30" : "hover:bg-gray-50/50"}`}>
                        <td className="p-4 pl-6 whitespace-nowrap">
                          <div className="text-sm font-extrabold text-gray-800">#{order.id}</div>
                          <div className="text-xs text-gray-500 font-medium">{new Date(order.created_at).toLocaleDateString("en-GB")}</div>
                        </td>

                        <td className="p-4">
                          <div className="text-sm font-bold text-gray-800">{order.user_name || order.name}</div>
                          <div className="text-xs text-gray-500 font-medium">{order.phone}</div>
                        </td>

                        <td className="p-4 whitespace-nowrap text-sm text-red-600 font-black">
                          {formatCurrency(order.total_price)}
                        </td>

                        <td className="p-4 whitespace-nowrap">
                          <select
                            value={order.payment_status || "Unpaid"}
                            onChange={(e) => handlePaymentStatus(order.id, e.target.value)}
                            disabled={isReturnLocked}
                            className="text-xs font-bold text-white py-2 px-4 rounded-full cursor-pointer outline-none focus:ring-4 focus:ring-blue-500/20 disabled:opacity-60 appearance-none text-center shadow-sm"
                            style={{ backgroundColor: getPaymentStatusColor(order.payment_status) }}
                          >
                            {PAYMENT_OPTIONS.map((status) => (
                              <option key={status} value={status} className="text-gray-800 bg-white">{status}</option>
                            ))}
                          </select>
                        </td>

                        <td className="p-4 whitespace-nowrap">
                          <select
                            value={order.status}
                            onChange={(e) => handleOrderStatus(order.id, e.target.value)}
                            disabled={isReturnLocked}
                            className="text-xs font-bold text-white py-2 px-4 rounded-full cursor-pointer outline-none focus:ring-4 focus:ring-blue-500/20 disabled:opacity-60 appearance-none text-center shadow-sm"
                            style={{ backgroundColor: getOrderStatusColor(order.status) }}
                          >
                            {STATUS_OPTIONS.map((status) => (
                              <option key={status} value={status} className="text-gray-800 bg-white">{status}</option>
                            ))}
                          </select>
                        </td>

                        <td className="p-4 pr-6 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-2">
                            {isReturnLocked && (
                              <>
                                <button onClick={() => handleApproveReturn(order.id)} title="Approve Return" className="w-9 h-9 flex items-center justify-center bg-green-50 text-green-600 rounded-full hover:bg-green-500 hover:text-white transition-colors shadow-sm">
                                  <i className="fa-solid fa-check text-sm"></i>
                                </button>
                                <button onClick={() => handleRejectReturn(order.id)} title="Reject Return" className="w-9 h-9 flex items-center justify-center bg-red-50 text-red-600 rounded-full hover:bg-red-500 hover:text-white transition-colors shadow-sm">
                                  <i className="fa-solid fa-xmark text-sm"></i>
                                </button>
                              </>
                            )}
                            <button
                              onClick={() => toggleExpand(order.id)}
                              className={`px-4 py-2 rounded-full font-bold text-xs transition-all duration-300 shadow-sm flex items-center gap-2 ${
                                isExpanded ? "bg-gray-800 text-white" : "bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white"
                              }`}
                            >
                              {isExpanded ? "Close" : "Details"}
                              <i className={`fa-solid fa-chevron-down transition-transform duration-300 ${isExpanded ? "rotate-180" : ""}`}></i>
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* --- DÒNG MỞ RỘNG (EXPANDABLE DETAILS) --- */}
                      {isExpanded && (
                        <tr className="bg-gray-50/50">
                          <td colSpan={6} className="p-0 border-b border-gray-100">
                            <div className="p-6 sm:p-8 animate-fadeIn">
                              <div className="bg-white p-6 md:p-8 rounded-[2rem] shadow-sm border border-gray-100 flex flex-col gap-8">

                                {/* Header Details */}
                                <h4 className="text-xl font-extrabold text-gray-800 flex items-center gap-3 border-b border-gray-50 pb-4">
                                  <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm">
                                    <i className="fa-solid fa-receipt"></i>
                                  </div>
                                  Order Details #{order.id}
                                </h4>

                                {/* Return Info (Nếu có) */}
                                {["Return Requested", "Return Approved", "Return Rejected"].includes(order.status) && (
                                  <ReturnInfoSection order={order} />
                                )}

                                {/* Giao hàng & Sản phẩm */}
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                  <DeliveryInfoSection order={order} />
                                  <OrderItemsList items={order.items} formatCurrency={formatCurrency} />
                                </div>

                                {/* Footer Total */}
                                <div className="flex justify-between items-center pt-6 mt-2 border-t border-gray-100 bg-gray-50 p-6 rounded-[1.5rem]">
                                  <span className="font-bold text-gray-500 uppercase tracking-widest text-sm">Grand Total</span>
                                  <span className="text-3xl font-black text-red-600">
                                    {formatCurrency(order.total_price)}
                                  </span>
                                </div>

                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// THÀNH PHẦN CHI TIẾT ĐƯỢC TÍCH HỢP TRỰC TIẾP
// ==========================================

const ReturnInfoSection = ({ order }) => {
  return (
    <div className="bg-orange-50/80 p-6 rounded-[1.5rem] border border-orange-100 text-sm shadow-inner">
      <h5 className="font-bold text-orange-800 mb-5 uppercase text-xs tracking-wider flex items-center gap-2">
        <i className="fa-solid fa-rotate-left text-orange-500 text-base"></i> Return Request Details
      </h5>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Lý do trả hàng */}
        <div className="bg-white p-5 rounded-2xl border border-orange-100 shadow-sm">
          <p className="font-bold text-gray-400 text-[10px] uppercase tracking-wider mb-1">Reason Code</p>
          <p className="text-base text-gray-800 font-extrabold mb-4">{order.reason_code || "Not specified"}</p>

          <p className="font-bold text-gray-400 text-[10px] uppercase tracking-wider mb-1">Detailed Note</p>
          <p className="text-sm text-gray-600 italic bg-gray-50 p-4 rounded-xl border border-gray-100 leading-relaxed">
            "{order.description || "No description provided"}"
          </p>
        </div>

        {/* Thông tin Ngân hàng */}
        <div className="bg-gradient-to-br from-blue-600 to-blue-800 p-6 rounded-2xl text-white shadow-md relative overflow-hidden flex flex-col justify-center">
          <div className="absolute -right-6 -top-6 text-white/10 text-8xl">
            <i className="fa-solid fa-building-columns"></i>
          </div>
          <p className="text-[10px] uppercase opacity-80 mb-3 font-bold tracking-widest relative z-10">Refund Bank Account</p>
          {order.refund_bank_info ? (
            <div className="relative z-10">
              <p className="font-extrabold text-2xl mb-1">{order.refund_bank_info.name}</p>
              <p className="text-3xl font-mono tracking-[0.2em] mb-2 drop-shadow-md">{order.refund_bank_info.acc}</p>
              <p className="text-sm uppercase text-blue-200 font-bold tracking-wider">{order.refund_bank_info.owner}</p>
            </div>
          ) : <p className="text-sm italic relative z-10 opacity-80">Missing bank information</p>}
        </div>
      </div>

      {/* Hình ảnh bằng chứng */}
      {order.return_images && order.return_images.length > 0 && (
        <div className="mt-6 pt-6 border-t border-orange-200/50">
          <p className="text-[10px] font-bold text-orange-600/80 uppercase mb-3 tracking-wider">Evidence Images</p>
          <div className="flex flex-wrap gap-4">
            {order.return_images.map((img, idx) => {
              const fullImgUrl = img.startsWith('http') ? img : `import.meta.env.VITE_API_URL${img}`;
              return (
                <img
                  key={idx}
                  src={fullImgUrl}
                  alt={`Evidence ${idx + 1}`}
                  className="w-24 h-24 object-cover rounded-xl border-2 border-white shadow-md cursor-pointer hover:scale-110 transition-transform duration-300"
                  onClick={() => window.open(fullImgUrl, '_blank')}
                />
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

const DeliveryInfoSection = ({ order }) => {
  return (
    <div className="bg-blue-50/50 p-6 rounded-[1.5rem] border border-blue-100/50 text-sm h-full flex flex-col">
      <h5 className="font-bold text-blue-800 mb-5 uppercase text-xs tracking-wider flex items-center gap-2">
        <i className="fa-solid fa-truck-fast text-blue-500 text-base"></i> Delivery Details
      </h5>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-5 gap-x-6 bg-white p-6 rounded-2xl border border-blue-50 shadow-sm flex-1">
        <div>
          <span className="block text-[10px] uppercase font-bold text-gray-400 mb-1 tracking-wider">Recipient</span>
          <span className="font-bold text-gray-800 text-base">{order.user_name || order.name}</span>
        </div>
        <div>
          <span className="block text-[10px] uppercase font-bold text-gray-400 mb-1 tracking-wider">Phone</span>
          <span className="font-bold text-gray-800 text-base">{order.phone}</span>
        </div>
        <div className="sm:col-span-2">
          <span className="block text-[10px] uppercase font-bold text-gray-400 mb-1 tracking-wider">Address</span>
          <span className="font-bold text-gray-800 leading-relaxed">{order.address}</span>
        </div>
        <div>
          <span className="block text-[10px] uppercase font-bold text-gray-400 mb-1 tracking-wider">Placed On</span>
          <span className="font-bold text-gray-800">{new Date(order.created_at).toLocaleString("en-GB")}</span>
        </div>
        <div>
          <span className="block text-[10px] uppercase font-bold text-gray-400 mb-1 tracking-wider">Payment Method</span>
          {order.payment_status === "Paid" ? (
            <span className="text-green-600 font-extrabold bg-green-50 px-3 py-1.5 rounded-full inline-flex items-center gap-1.5 text-xs border border-green-100">
              <i className="fa-solid fa-check-circle"></i> Paid ({order.payment_method === "momo" ? "MoMo" : "COD"})
            </span>
          ) : (
            <span className="text-orange-600 font-extrabold bg-orange-50 px-3 py-1.5 rounded-full inline-flex items-center gap-1.5 text-xs border border-orange-100">
              <i className="fa-solid fa-clock"></i> Awaiting ({order.payment_method === "momo" ? "MoMo" : "COD"})
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

const OrderItemsList = ({ items, formatCurrency }) => {
  return (
    <div className="bg-gray-50/50 p-6 rounded-[1.5rem] border border-gray-100 h-full flex flex-col">
      <h5 className="font-bold text-gray-800 mb-5 text-xs uppercase tracking-wider flex items-center gap-2">
        <i className="fa-solid fa-basket-shopping text-gray-400 text-base"></i> Ordered Products ({items?.length || 0})
      </h5>
      <div className="space-y-3 flex-1 overflow-y-auto custom-scrollbar pr-2 max-h-[350px]">
        {items?.map((item, idx) => (
          <OrderItemCard key={idx} item={item} formatCurrency={formatCurrency} />
        ))}
      </div>
    </div>
  );
};

const OrderItemCard = ({ item, formatCurrency }) => {
  const imageUrl = item.image_url?.startsWith("http")
      ? item.image_url
      : `import.meta.env.VITE_API_URL${item.image_url}`;

  const isGift = Boolean(item.is_gift);

  return (
    <div className={`flex gap-4 rounded-2xl p-4 items-center shadow-sm transition-all border ${
      isGift ? "bg-rose-50 border-rose-100" : "bg-white border-gray-100 hover:border-violet-100 hover:shadow-md"
    }`}>
      <div className={`w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 ${isGift ? 'border-2 border-white shadow-sm' : 'bg-gray-50 border border-gray-100'}`}>
        <img
          src={imageUrl}
          onError={(e) => ((e.target as HTMLImageElement).src = "import.meta.env.VITE_API_URL/public/placeholder.jpg")}
          alt={item.product_name}
          className="w-full h-full object-cover"
        />
      </div>

      <div className="flex-1 min-w-0 pr-2">
        <h4 className="text-sm font-extrabold text-gray-800 truncate mb-1">
          {item.product_name}
        </h4>

        <p className="text-xs font-medium text-gray-500 mb-3">
          {item.color_name && `Color: ${item.color_name}`}
          {item.size && <span className="mx-1.5 text-gray-300">|</span>}
          {item.size && `Size: ${item.size}`}
        </p>

        <div className="flex justify-between items-center">
          <span className="text-[10px] bg-gray-100 px-3 py-1 rounded-full font-bold text-gray-600 uppercase tracking-wider">
            Qty: {item.quantity}
          </span>

          {isGift ? (
            <div className="flex items-center gap-2">
              <span className="bg-rose-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider shadow-sm">
                Free Gift
              </span>
              <span className="text-sm font-black text-rose-600">0 đ</span>
            </div>
          ) : (
            <span className="text-sm font-black text-gray-900">
              {formatCurrency(item.price * item.quantity)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};


