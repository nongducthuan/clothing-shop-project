import React from "react";
import { ModernStatusBadge, PaymentStatusBadge } from "./OrderBadges";

export default function OrderDetailModal({ order, onClose, helpers }) {
  if (!order) return null;
  const { formatCurrency, getImgUrl } = helpers;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in"
      onClick={onClose}
    >
      <div 
        /* 
           - Mobile: max-w-full / rounded-2xl
           - Tablet & Desktop: max-w-xl / rounded-3xl
        */
        className="bg-white w-full max-w-md sm:max-w-xl rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()} // Chống tắt modal khi click bên trong
      >

        {/* Header */}
        <div className="px-4 py-3.5 sm:px-6 sm:py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 shrink-0">
          <div>
            <h3 className="font-semibold text-slate-900 text-base sm:text-lg">Order #{order.id}</h3>
            <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5">
              {new Date(order.created_at).toLocaleString("en-US")}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white border border-slate-200 text-slate-400 hover:text-slate-700 flex items-center justify-center transition-colors shadow-sm shrink-0"
          >
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 overflow-y-auto custom-scrollbar space-y-5 sm:space-y-6">
          
          {/* Status Badges */}
          <div className="flex flex-wrap gap-2 items-center">
            <ModernStatusBadge status={order.status} />
            <PaymentStatusBadge status={order.payment_status} />
          </div>

          {/* Item List */}
          <div className="space-y-2.5 sm:space-y-3">
            <p className="text-[11px] sm:text-xs font-semibold text-slate-400 uppercase tracking-wider">Items</p>
            {order.items?.map((item, idx) => {
              const rawImage = item.image || item.image_url || item.color_image || item.product_image;
              const safeImgSrc = rawImage
                ? getImgUrl(rawImage)
                : "https://via.placeholder.com/150?text=No+Image";

              return (
                <div key={idx} className="flex gap-3 sm:gap-4 items-center bg-slate-50/70 p-3 sm:p-3.5 rounded-xl border border-slate-100">
                  {/* Ảnh sản phẩm - Co dãn nhẹ theo màn hình */}
                  <div className="w-14 h-14 sm:w-16 sm:h-16 shrink-0 rounded-lg overflow-hidden border border-slate-200/60 bg-white">
                    <img
                      src={safeImgSrc}
                      alt={item.product_name || "Product"}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).onerror = null;
                        (e.target as HTMLImageElement).src = "https://via.placeholder.com/150?text=No+Image";
                      }}
                    />
                  </div>

                  {/* Thông tin sản phẩm */}
                  <div className="flex-1 min-w-0">
                    {/* Tên sản phẩm: Tối đa 2 dòng trên mobile, full tên nếu đủ chỗ */}
                    <h4 
                      className="font-medium text-slate-900 text-xs sm:text-sm leading-snug line-clamp-2" 
                      title={item.product_name}
                    >
                      {item.product_name}
                    </h4>
                    
                    {/* Badge thuộc tính: Tự động xuống dòng gọn gàng nếu màn hình cực nhỏ */}
                    <div className="flex flex-wrap items-center gap-1.5 mt-1.5 text-[11px] font-medium text-slate-500">
                      <span className="bg-white border border-slate-200/80 px-1.5 py-0.5 rounded text-slate-600">
                        {item.color_name || "N/A"}
                      </span>
                      <span className="bg-white border border-slate-200/80 px-1.5 py-0.5 rounded text-slate-600">
                        Size: {item.size || "N/A"}
                      </span>
                      <span className="text-slate-400 font-normal ml-0.5">
                        x{item.quantity}
                      </span>
                    </div>
                  </div>

                  {/* Giá tiền */}
                  <div className="text-right shrink-0">
                    <p className="font-semibold text-slate-900 text-xs sm:text-sm whitespace-nowrap">
                      {formatCurrency(item.price)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Order Summary */}
          <div className="bg-slate-50/70 p-3.5 sm:p-5 rounded-xl border border-slate-100 space-y-2.5 sm:space-y-3 text-xs sm:text-sm">
            <p className="text-[11px] sm:text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Summary</p>
            
            <div className="flex justify-between items-start gap-3">
              <span className="text-slate-500 shrink-0">Shipping Address</span>
              <span className="font-medium text-slate-900 text-right break-words max-w-[65%]">
                {order.address || "N/A"}
              </span>
            </div>

            <div className="flex justify-between items-center gap-3 border-t border-slate-200/60 pt-2.5 sm:pt-3">
              <span className="text-slate-500 shrink-0">Payment Method</span>
              <span className="font-medium text-slate-900 capitalize text-right">
                {order.payment_method}
              </span>
            </div>

            <div className="flex justify-between items-center gap-3 border-t border-slate-200/60 pt-2.5 sm:pt-3">
              <span className="font-semibold text-slate-700">Total</span>
              <span className="font-bold text-slate-900 text-sm sm:text-base whitespace-nowrap">
                {formatCurrency(order.total_price)}
              </span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
