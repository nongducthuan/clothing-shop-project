import React from "react";

export default function OrderDetailsModal({ order, onClose, formatCurrency }) {
  if (!order) return null;

  const isReturnRequest = ["Return Requested", "Return Approved", "Return Rejected"].includes(order.status);

  return (
    <div className="fixed inset-0 z-[100] flex justify-center items-center p-4 bg-gray-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col animate-scaleIn relative overflow-hidden">

        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50/50">
          <h4 className="text-xl font-extrabold text-gray-800 flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm">
              <i className="fa-solid fa-receipt"></i>
            </div>
            Order #{order.id}
          </h4>
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center bg-gray-100 text-gray-500 hover:bg-red-100 hover:text-red-500 rounded-full transition-colors outline-none"
          >
            <i className="fa-solid fa-xmark text-lg"></i>
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-4 md:p-6 overflow-y-auto custom-scrollbar flex flex-col gap-4 md:gap-6">
          {isReturnRequest && <ReturnInfoSection order={order} />}
          <DeliveryInfoSection order={order} />
          <OrderItemsList items={order.items} formatCurrency={formatCurrency} />

          {/* Footer Total */}
          <div className="flex justify-between items-center pt-6 mt-2 border-t border-gray-100 bg-gray-50/50 p-6 rounded-2xl">
            <span className="font-bold text-gray-500 uppercase tracking-widest text-sm">Grand Total</span>
            <span className="text-xl font-black text-red-600">
              {formatCurrency(order.total_price)}
            </span>
          </div>
        </div>

      </div>
    </div>
  );
}

// ==========================================
// SUB COMPONENTS (SRP applied)
// ==========================================

const ReturnInfoSection = ({ order }) => {
  return (
    <div className="bg-orange-50/80 p-3 md:p-5 rounded-[1.5rem] border border-orange-100 text-sm shadow-inner">
      <h5 className="font-bold text-orange-800 mb-4 uppercase text-xs tracking-wider flex items-center gap-2">
        <i className="fa-solid fa-rotate-left text-orange-500 text-base"></i> Return Request Details
      </h5>

      <div className="space-y-4">
        <div className="bg-white p-4 rounded-2xl border border-orange-100 shadow-sm">
          <p className="font-bold text-gray-400 text-[10px] uppercase tracking-wider mb-1">Reason Code</p>
          <p className="text-sm text-gray-800 font-extrabold mb-3">{order.reason_code || "Not specified"}</p>

          <p className="font-bold text-gray-400 text-[10px] uppercase tracking-wider mb-1">Detailed Note</p>
          <p className="text-sm text-gray-600 italic bg-gray-50 p-3 rounded-xl border border-gray-100">"{order.description || "No description provided"}"</p>
        </div>

        <div className="bg-gradient-to-br from-blue-600 to-blue-800 p-3 md:p-5 rounded-2xl text-white shadow-md relative overflow-hidden">
          <div className="absolute -right-6 -top-6 text-white/10 text-8xl">
            <i className="fa-solid fa-building-columns"></i>
          </div>
          <p className="text-[10px] uppercase opacity-80 mb-2 font-bold tracking-widest relative z-10">Refund Bank Account</p>
          {order.refund_bank_info ? (
            <div className="relative z-10">
              <p className="font-extrabold text-xl mb-1">{order.refund_bank_info.name}</p>
              <p className="text-2xl font-mono tracking-[0.2em]">{order.refund_bank_info.acc}</p>
              <p className="text-xs uppercase mt-2 text-blue-200 font-bold">{order.refund_bank_info.owner}</p>
            </div>
          ) : <p className="text-xs italic relative z-10">Missing bank information</p>}
        </div>
      </div>

      {order.return_images && order.return_images.length > 0 && (
        <div className="mt-5">
          <p className="text-[10px] font-bold text-orange-600/80 uppercase mb-2 tracking-wider">Evidence Images</p>
          <div className="flex flex-wrap gap-3">
            {order.return_images.map((img, idx) => {
              const fullImgUrl = img.startsWith('http') ? img : `import.meta.env.VITE_API_URL${img}`;
              return (
                <img
                  key={idx}
                  src={fullImgUrl}
                  alt={`Evidence ${idx + 1}`}
                  className="w-20 h-20 object-cover rounded-xl border-2 border-white shadow-sm cursor-pointer hover:scale-105 transition-transform"
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
    <div className="bg-blue-50/50 p-3 md:p-5 rounded-[1.5rem] border border-blue-100/50 text-sm">
      <h5 className="font-bold text-blue-800 mb-4 uppercase text-xs tracking-wider flex items-center gap-2">
        <i className="fa-solid fa-truck-fast text-blue-500 text-base"></i> Delivery Details
      </h5>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-6 bg-white p-4 md:p-5 rounded-2xl border border-blue-50 shadow-sm">
        <div>
          <span className="block text-[10px] uppercase font-bold text-gray-400 mb-1 tracking-wider">Recipient</span>
          <span className="font-bold text-gray-800">{order.user_name || order.name}</span>
        </div>
        <div>
          <span className="block text-[10px] uppercase font-bold text-gray-400 mb-1 tracking-wider">Phone</span>
          <span className="font-bold text-gray-800">{order.phone}</span>
        </div>
        <div className="sm:col-span-2">
          <span className="block text-[10px] uppercase font-bold text-gray-400 mb-1 tracking-wider">Address</span>
          <span className="font-bold text-gray-800">{order.address}</span>
        </div>
        <div>
          <span className="block text-[10px] uppercase font-bold text-gray-400 mb-1 tracking-wider">Placed On</span>
          <span className="font-bold text-gray-800">{new Date(order.created_at).toLocaleString("en-GB")}</span>
        </div>
        <div>
          <span className="block text-[10px] uppercase font-bold text-gray-400 mb-1 tracking-wider">Payment Method</span>
          {order.payment_status === "Paid" ? (
            <span className="text-green-600 font-extrabold bg-green-50 px-3 py-1.5 rounded-full inline-flex items-center gap-1.5 text-xs">
              <i className="fa-solid fa-check-circle"></i> Paid ({order.payment_method === "momo" ? "MoMo" : "COD"})
            </span>
          ) : (
            <span className="text-orange-600 font-extrabold bg-orange-50 px-3 py-1.5 rounded-full inline-flex items-center gap-1.5 text-xs">
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
    <div>
      <h5 className="font-bold text-gray-800 mb-4 text-xs uppercase tracking-wider flex items-center gap-2">
        <i className="fa-solid fa-basket-shopping text-gray-400 text-base"></i> Ordered Products ({items?.length || 0})
      </h5>
      <div className="space-y-3">
        {items?.map((item, idx) => (
          <OrderItemCard key={idx} item={item} formatCurrency={formatCurrency} />
        ))}
      </div>
    </div>
  );
};

const OrderItemCard = ({ item, formatCurrency }) => {
  // Sửa lại cú pháp lấy đúng biến môi trường Vite
  const imageUrl = item.image_url?.startsWith("http")
      ? item.image_url
      : `${import.meta.env.VITE_API_URL}${item.image_url}`;

  const isGift = Boolean(item.is_gift);

  return (
    <div className={`flex gap-3 md:gap-4 rounded-2xl p-3 items-center shadow-sm transition-all border ${
      isGift ? "bg-rose-50 border-rose-100" : "bg-white border-gray-100 hover:border-violet-100 hover:shadow-md"
    }`}>
      {/* Cố định kích thước khung ảnh để tránh bị giật layout */}
      <div className={`w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 ${isGift ? 'border-2 border-white shadow-sm' : 'bg-gray-50 border border-gray-100'}`}>
        <img
          src={imageUrl}
          // Sửa lại cú pháp fallback image đúng chuẩn
          onError={(e) => {
            e.target.onerror = null; // Ngăn chặn lặp vô hạn lỗi onError
            e.target.src = `${import.meta.env.VITE_API_URL}/public/placeholder.jpg`;
          }}
          alt={item.product_name}
          className="w-full h-full object-cover"
        />
      </div>

      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-extrabold text-gray-800 truncate mb-0.5">
          {item.product_name}
        </h4>

        <p className="text-xs font-medium text-gray-500 mb-2">
          {item.color_name && `Color: ${item.color_name}`}
          {item.size && <span className="mx-1.5 text-gray-300">|</span>}
          {item.size && `Size: ${item.size}`}
        </p>

        <div className="flex flex-wrap justify-between items-center gap-2">
          <span className="text-[10px] bg-gray-100 px-2.5 py-1 rounded-full font-bold text-gray-600 uppercase tracking-wider">
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
