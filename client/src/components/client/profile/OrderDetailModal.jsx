import React from "react";
import { ModernStatusBadge, PaymentStatusBadge } from "./OrderBadges";

export default function OrderDetailModal({ order, onClose, helpers }) {
  if (!order) return null;
  const { formatCurrency, getImgUrl } = helpers;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-2xl rounded-[2rem] shadow-xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <div>
            <h3 className="font-medium text-slate-900 text-lg">Order #{order.id}</h3>
            <p className="text-xs text-slate-500 mt-1">
              {new Date(order.created_at).toLocaleString("en-US")}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white border border-slate-200 text-slate-400 hover:text-slate-900 flex items-center justify-center transition-colors"
          >
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        {/* Content */}
        <div className="p-8 max-h-[60vh] overflow-y-auto custom-scrollbar">
          <div className="flex gap-3 mb-8">
            <ModernStatusBadge status={order.status} />
            <PaymentStatusBadge status={order.payment_status} />
          </div>

          {/* Item List */}
          <div className="space-y-4 mb-8">
            {order.items?.map((item, idx) => {
              // FIX: Safely determine the image source with multiple fallbacks
              const rawImage = item.image || item.image_url || item.color_image || item.product_image;
              const safeImgSrc = rawImage
                ? getImgUrl(rawImage)
                : "https://via.placeholder.com/150?text=No+Image";

              return (
                <div key={idx} className="flex gap-4 items-center bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <img
                    src={safeImgSrc}
                    alt={item.product_name || "Product"}
                    className="w-16 h-16 object-cover rounded-xl border border-white shadow-sm bg-white"
                    onError={(e) => {
                      // Final fallback if the generated URL is still broken
                      e.target.onerror = null;
                      e.target.src = "https://via.placeholder.com/150?text=No+Image";
                    }}
                  />
                  <div className="flex-1">
                    <h4 className="font-medium text-slate-900 text-sm">{item.product_name}</h4>
                    <p className="text-xs text-slate-500 mt-1">
                      Color: {item.color_name || "N/A"} | Size: {item.size || "N/A"} | Qty: {item.quantity}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-slate-900">{formatCurrency(item.price)}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Order Summary */}
          <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 space-y-4 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">Shipping Address</span>
              <span className="font-medium text-slate-900 text-right max-w-[60%]">{order.address}</span>
            </div>
            <div className="flex justify-between border-t border-slate-200 pt-4">
              <span className="text-slate-500">Payment Method</span>
              <span className="font-medium text-slate-900 capitalize">{order.payment_method}</span>
            </div>
            <div className="flex justify-between border-t border-slate-200 pt-4 items-end">
              <span className="font-medium text-slate-900 text-base">Total</span>
              <span className="text-2xl font-medium text-slate-900">{formatCurrency(order.total_price)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
