import React from "react";
import { useProductDetail } from "../../hooks/client/useProductDetail";

import ProductImageGallery from "../../components/client/product-detail/ProductImageGallery";
import ProductMeta from "../../components/client/product-detail/ProductMeta";
import ProductVoucher from "../../components/client/product-detail/ProductVoucher";
import ProductSelectors from "../../components/client/product-detail/ProductSelectors";
import ProductActions from "../../components/client/product-detail/ProductActions";

export default function ProductDetail() {
  const { state, actions, helpers, constants } = useProductDetail();

  // --- ERROR STATE ---
  if (state.error) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center mb-4">
          <i className="fa-solid fa-circle-exclamation text-2xl text-rose-500"></i>
        </div>
        <h2 className="text-2xl font-medium text-slate-900 mb-6">{state.error}</h2>
        <button
          onClick={() => actions.navigate("/")}
          className="px-8 py-3 bg-slate-900 text-white rounded-full font-medium hover:bg-slate-800 transition-colors"
        >
          Return to Homepage
        </button>
      </div>
    );
  }

  // --- LOADING STATE ---
  if (!state.product) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <i className="fa-solid fa-circle-notch fa-spin text-3xl text-slate-300"></i>
      </div>
    );
  }

  // --- MAIN RENDER ---
  return (
    <div className="bg-white min-h-screen pb-24 pt-12">
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-start">

          {/* LEFT: IMAGE GALLERY (5 cols) */}
          <div className="lg:col-span-5 lg:sticky lg:top-24">
            <ProductImageGallery state={state} constants={constants} />
          </div>

          {/* RIGHT: PRODUCT DETAILS (7 cols) */}
          <div className="lg:col-span-7 py-2">
            <ProductMeta state={state} helpers={helpers} />
            <ProductVoucher state={state} helpers={helpers} />
            <ProductSelectors state={state} actions={actions} />
            <ProductActions state={state} actions={actions} helpers={helpers} />

            {/* DESCRIPTION ACCORDION/SECTION */}
            <div className="mt-16 border-t border-slate-100 pt-10">
              <h3 className="text-lg font-medium text-slate-900 mb-6">
                Product Details
              </h3>
              <div className="prose prose-slate prose-p:text-slate-500 prose-p:leading-relaxed max-w-none text-sm whitespace-pre-line">
                {state.product.description || "No detailed description available for this product."}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
