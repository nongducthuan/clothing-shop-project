import React from "react";

export default function OrdersStep({
  orders, expandedOrder, toggleOrder, formatCurrency,
  handleRepay, loading, openReturnForm, onReset
}) {
  return (
    <div className="space-y-4">
      {orders.length === 0 ? (
        <div className="text-center py-10">
          <i className="fa-solid fa-box-open text-4xl text-gray-300 mb-3"></i>
          <p className="text-gray-500">No orders found.</p>
        </div>
      ) : (
        <div className="max-h-[450px] overflow-y-auto pr-2 space-y-4 custom-scrollbar">
          {orders.map((order) => (
            <div key={order.id} className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm">
              <div onClick={() => toggleOrder(order.id)} className="p-4 cursor-pointer hover:bg-gray-50 flex justify-between items-center transition">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-gray-800">Order #{order.id}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${order.status === 'Delivered' ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'}`}>
                      {order.status}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(order.created_at).toLocaleDateString('vi-VN')} - {order.payment_method}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-violet-600">{formatCurrency(order.total_price)}</p>
                  <i className={`fa-solid fa-chevron-${expandedOrder === order.id ? 'up' : 'down'} text-xs text-gray-400`}></i>
                </div>
              </div>

              {expandedOrder === order.id && (
                <div className="bg-gray-50 p-4 border-t border-gray-100 space-y-3 animate-fadeIn">
                  {order.items?.map((item, idx) => (
                    <div key={idx} className="flex gap-3 items-center">
                      <img src={`import.meta.env.VITE_API_URL${item.image}`} alt={item.product_name} className="w-12 h-12 object-cover rounded-md border" onError={(e) => { e.target.src = 'https://via.placeholder.com/150' }} />
                      <div className="flex-1">
                        <h4 className="text-sm font-medium text-gray-800 leading-tight">{item.product_name}</h4>
                        <p className="text-[11px] text-gray-500">Variant: {item.color}, {item.size} | Qty: x{item.quantity}</p>
                      </div>
                      <p className="text-sm font-semibold text-gray-700">{formatCurrency(item.price)}</p>
                    </div>
                  ))}
                  <div className="mt-3 pt-3 border-t border-dashed border-gray-300">
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>Shipping Address:</span>
                      <span className="text-gray-700 font-medium">{order.address}</span>
                    </div>
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>Phone Number:</span>
                      <span className="text-gray-700 font-medium">{order.phone}</span>
                    </div>
                    {order.status === 'Pending' && order.payment_method === 'momo' && (
                      <button
                        onClick={() => handleRepay(order)}
                        disabled={loading}
                        className="w-full mt-4 bg-[#ae2070] text-white py-2 rounded-lg text-sm font-bold hover:bg-[#8e1a5c] transition flex items-center justify-center gap-2"
                      >
                        {loading ? (
                          <i className="fa-solid fa-circle-notch fa-spin"></i>
                        ) : (
                          <>Pay with MoMo</>
                        )}
                      </button>
                    )}
                    {order.status === 'Delivered' && !order.return_id && (
                      <button
                        onClick={() => openReturnForm(order)}
                        className="w-full mt-4 bg-orange-50 text-orange-600 border border-orange-200 py-2 rounded-lg text-sm font-bold hover:bg-orange-100 transition"
                      >
                        <i className="fa-solid fa-rotate-left mr-2"></i> Request Return
                      </button>
                    )}
                    {(order.return_id || order.status === 'Return Requested') && (
                      <div className="mt-4 p-2 bg-orange-50 text-orange-600 text-center rounded-lg text-xs font-bold">
                        Return request is being processed
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
