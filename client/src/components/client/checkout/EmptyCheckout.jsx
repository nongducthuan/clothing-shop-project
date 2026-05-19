// components/client/checkout/EmptyCheckout.jsx
import React from "react";

export function EmptyCheckout({ onShop }) {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center bg-white text-center px-6">
      <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-6">
        <i className="fa-solid fa-cart-shopping text-3xl text-slate-300"></i>
      </div>
      <h2 className="text-3xl font-medium text-slate-900 tracking-tight">Your cart is empty.</h2>
      <p className="text-slate-500 mt-3 mb-10 text-lg">Add some items before proceeding to checkout.</p>
      <button
        onClick={onShop}
        className="bg-slate-900 text-white px-10 py-4 rounded-full font-medium hover:bg-slate-800 transition-colors"
      >
        Continue Shopping
      </button>
    </div>
  );
}
