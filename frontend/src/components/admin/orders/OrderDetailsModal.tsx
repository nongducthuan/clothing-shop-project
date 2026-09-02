import React from "react";
import { getImageUrl } from "../../../utils/imageUtils";

export default function OrderDetailsModal({ order, onClose, formatCurrency }) {
  if (!order) return null;

  const isReturnRequest = ["Return Requested", "Return Approved", "Return Rejected"].includes(order.status);

  return (
    <div className="fixed inset-0 z-[100] flex justify-center items-center p-4 bg-gray-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col animate-scaleIn relative overflow-hidden">

        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50/50">
          <h4 className="text-xl font-extrabold text-gray-800 flex items-center gap-3 m-0 leading-none">
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
  const bankInfo = order.refund_bank_info;

  return (
    <div className="bg-gradient-to-r from-amber-50/60 via-orange-50/40 to-amber-50/60 p-4 sm:p-5 rounded-[1.5rem] border border-amber-200/60 text-sm shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <h5 className="font-extrabold text-amber-900 text-xs uppercase tracking-wider flex items-center gap-2 m-0 leading-none">
          <span className="w-6 h-6 rounded-full bg-amber-100/80 text-amber-700 flex items-center justify-center text-[10px] shadow-xs">
            <i className="fa-solid fa-rotate-left"></i>
          </span>
          Return Request Details
        </h5>
        <span className="text-[9px] font-extrabold uppercase tracking-widest bg-amber-200/60 text-amber-800 px-2 py-0.5 rounded-full border border-amber-300/40">
          Action Required
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Lý do trả hàng */}
        <div className="bg-white p-4 rounded-2xl border border-amber-100/80 shadow-sm flex flex-col justify-between space-y-3">
          <div>
            <span className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1">
              Reason for Return
            </span>
            <span className="inline-block bg-slate-100 text-slate-800 text-xs font-extrabold px-2.5 py-1 rounded-lg border border-slate-200/60">
              {order.reason_code || "Not specified"}
            </span>
          </div>

          <div>
            <span className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1">
              Customer Note
            </span>
            <div className="bg-slate-50/80 border border-slate-200/60 rounded-xl p-3 text-xs text-slate-600 italic leading-relaxed min-h-[45px] flex items-center">
              "{order.description || "No description provided."}"
            </div>
          </div>
        </div>

        {/* Thẻ Ngân hàng ATM Cao Cấp */}
        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-white p-4.5 rounded-2xl shadow-lg relative overflow-hidden flex flex-col justify-between min-h-[140px] border border-slate-700/50">
          <div className="absolute -right-5 -bottom-5 text-white/5 text-7xl pointer-events-none">
            <i className="fa-solid fa-building-columns"></i>
          </div>

          <div className="flex justify-between items-center relative z-10">
            <span className="text-[9px] uppercase font-bold text-slate-400 tracking-widest flex items-center gap-1.5">
              <i className="fa-solid fa-credit-card text-indigo-400"></i> Refund Account
            </span>
            <i className="fa-solid fa-wifi text-slate-500 text-[10px] rotate-90"></i>
          </div>

          {bankInfo ? (
            <div className="relative z-10 my-1 space-y-0.5">
              <p className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">
                {bankInfo.name || bankInfo.bankName || "Bank Account"}
              </p>
              <p className="text-lg font-mono font-bold tracking-[0.18em] text-indigo-200 drop-shadow-sm">
                {bankInfo.acc || bankInfo.bankNumber || "•••• •••• ••••"}
              </p>
            </div>
          ) : (
            <p className="text-xs italic text-slate-400 relative z-10 my-auto">Missing bank account details</p>
          )}

          <div className="relative z-10 pt-1.5 border-t border-white/10 flex justify-between items-center text-xs">
            <span className="font-bold text-slate-200 uppercase tracking-wider truncate max-w-[70%]" title={bankInfo?.owner}>
              {bankInfo?.owner || "N/A"}
            </span>
            <span className="text-[8px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-mono uppercase tracking-wider">
              Verified
            </span>
          </div>
        </div>
      </div>

      {/* Hình ảnh bằng chứng */}
      {order.return_images && order.return_images.length > 0 && (
        <div className="pt-2.5 border-t border-amber-200/60">
          <span className="block text-[10px] font-extrabold text-amber-900/70 uppercase mb-2 tracking-wider">
            Evidence Attachments ({order.return_images.length})
          </span>
          <div className="flex flex-wrap gap-2.5">
            {order.return_images.map((img, idx) => {
              const fullImgUrl = getImageUrl(img);
              return (
                <div key={idx} className="relative group">
                  <img
                    src={fullImgUrl}
                    alt={`Evidence ${idx + 1}`}
                    className="w-16 h-16 object-cover rounded-xl border-2 border-white shadow-md cursor-pointer hover:scale-105 transition-transform duration-300"
                    onClick={() => window.open(fullImgUrl, '_blank')}
                  />
                  <div className="absolute inset-0 bg-black/20 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                    <i className="fa-solid fa-magnifying-glass-plus text-white text-xs"></i>
                  </div>
                </div>
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
      <h5 className="font-bold text-blue-800 mb-4 uppercase text-xs tracking-wider flex items-center gap-2 m-0 leading-none">
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
      <h5 className="font-bold text-gray-800 mb-4 text-xs uppercase tracking-wider flex items-center gap-2 m-0 leading-none">
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
  const imageUrl = getImageUrl(item.image_url);

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
            (e.target as HTMLImageElement).onerror = null; // Ngăn chặn lặp vô hạn lỗi onError
            (e.target as HTMLImageElement).src = getImageUrl(null);
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

