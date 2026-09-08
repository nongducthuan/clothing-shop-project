import React from "react";
import { getImageUrl } from "../../../utils/imageUtils";
import { PaymentBadge } from "../../common/PaymentBadge";

export default function OrdersStep({
  orders, expandedOrder, toggleOrder, formatCurrency,
  handleRepay, handleOpenPaymentModal, loading, openReturnForm, handleCancelReturn, onReset
}) {
  return (
    <div className="space-y-4">
      {orders.length === 0 ? (
        <div className="text-center py-10">
          <i className="fa-solid fa-box-open text-4xl text-gray-300 mb-3"></i>
          <p className="text-gray-500">No orders found.</p>
        </div>
      ) : (
        <div className="max-h-[60vh] sm:max-h-[500px] overflow-y-auto pr-1 sm:pr-2 space-y-4 custom-scrollbar">
          {orders.map((order) => (
            <div key={order.id} className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm">
              <div onClick={() => toggleOrder(order.id)} className="p-3.5 sm:p-4 cursor-pointer hover:bg-gray-50 flex flex-col gap-2.5 transition">
                {/* ROW 1: Order ID + Status (Left) vs Total Price + Chevron (Right) */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-gray-900 text-sm sm:text-base">Order #{order.id}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                      order.status === 'Delivered' ? 'bg-green-100 text-green-600' : 
                      order.status === 'Cancelled' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'
                    }`}>
                      {order.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 font-bold text-violet-600 text-sm sm:text-base">
                    <span>{formatCurrency(order.total_price)}</span>
                    <i className={`fa-solid fa-chevron-${expandedOrder === order.id ? 'up' : 'down'} text-xs text-gray-400`}></i>
                  </div>
                </div>

                {/* ROW 2: Date + Payment Method (Left) vs Payment Status (Right) */}
                <div className="flex items-center justify-between text-xs text-gray-400 pt-1 border-t border-gray-100">
                  <div className="flex items-center gap-2">
                    <span>{new Date(order.created_at).toLocaleDateString('vi-VN')}</span>
                    <span>•</span>
                    <PaymentBadge method={order.payment_method} badgeStyle={true} />
                  </div>
                  <span className={`text-[9px] px-2 py-0.5 rounded-md font-bold uppercase tracking-wider ${
                    order.payment_status === 'Paid'
                      ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                      : 'bg-rose-100 text-rose-600 border border-rose-200'
                  }`}>
                    {order.payment_status || 'Unpaid'}
                  </span>
                </div>
              </div>

              {expandedOrder === order.id && (
                <div className="bg-gray-50 p-3 sm:p-4 border-t border-gray-100 space-y-3 animate-fadeIn">
                  {order.items?.map((item, idx) => (
                    <div key={idx} className="flex gap-3 items-start sm:items-center">
                      <img src={getImageUrl(item.image_url)} alt={item.product_name} className="w-12 h-12 sm:w-14 sm:h-14 object-cover rounded-md border flex-shrink-0" onError={(e) => { (e.target as HTMLImageElement).src = getImageUrl(null) }} />
                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs sm:text-sm font-medium text-gray-800 leading-tight">{item.product_name}</h4>
                        <p className="text-[11px] text-gray-500 mt-0.5">Variant: {item.color}, {item.size} | Qty: x{item.quantity}</p>
                      </div>
                      <p className="text-xs sm:text-sm font-semibold text-gray-700 flex-shrink-0">{formatCurrency(item.price)}</p>
                    </div>
                  ))}
                  
                  {/* CUSTOMER & SHIPPING DETAILS */}
                  <div className="mt-3 pt-3 border-t border-dashed border-gray-300">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs bg-white p-3 rounded-lg border border-gray-100">
                      <div>
                        <span className="text-gray-400 block text-[11px]">Customer Name:</span>
                        <span className="font-semibold text-gray-800">{order.name || 'Guest'}</span>
                      </div>
                      <div>
                        <span className="text-gray-400 block text-[11px]">Phone Number:</span>
                        <span className="font-semibold text-gray-800">{order.phone || 'N/A'}</span>
                      </div>
                      <div className="sm:col-span-2 pt-1 border-t border-gray-50 mt-1">
                        <span className="text-gray-400 block text-[11px]">Shipping Address:</span>
                        <span className="font-semibold text-gray-800 break-words">{order.address || 'N/A'}</span>
                      </div>
                    </div>

                    {order.payment_status === 'Unpaid' && order.status !== 'Cancelled' && (
                      <button
                        onClick={() => handleOpenPaymentModal(order)}
                        disabled={loading}
                        className="w-full mt-3 bg-slate-900 hover:bg-slate-800 text-white py-2.5 rounded-lg text-sm font-bold transition flex items-center justify-center gap-2"
                      >
                        {loading ? (
                          <i className="fa-solid fa-circle-notch fa-spin"></i>
                        ) : (
                          <>Pay / Change Payment Method</>
                        )}
                      </button>
                    )}
                    {order.status === 'Delivered' && !order.return_request && (
                      <button
                        onClick={() => openReturnForm(order)}
                        className="w-full mt-3 bg-orange-50 text-orange-600 border border-orange-200 py-2.5 rounded-lg text-sm font-bold hover:bg-orange-100 transition flex items-center justify-center gap-2"
                      >
                        <i className="fa-solid fa-rotate-left"></i> Request Return
                      </button>
                    )}
                    {(order.status === 'Return Requested' || order.return_request) && (
                      <div className="mt-3 space-y-2">
                        <div className="p-2.5 bg-orange-50 text-orange-600 text-center rounded-lg text-xs font-bold border border-orange-100 flex items-center justify-center gap-2">
                          <i className="fa-solid fa-spinner animate-spin"></i> Return request is being processed
                        </div>
                        <button
                          onClick={() => handleCancelReturn && handleCancelReturn(order.id)}
                          disabled={loading}
                          className="w-full bg-rose-50 text-rose-600 border border-rose-200 py-2 rounded-lg text-xs font-bold hover:bg-rose-100 transition flex items-center justify-center gap-1.5"
                        >
                          <i className="fa-solid fa-xmark"></i> Cancel Return Request
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      <button
        onClick={onReset}
        className="w-full mt-4 border border-gray-300 text-gray-600 font-bold py-2 rounded-lg hover:bg-gray-100 transition"
      >
        Track another Email
      </button>
    </div>
  );
}

