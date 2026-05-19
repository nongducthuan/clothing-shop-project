import React from "react";

export default function ProductSelectors({ state, actions }) {
  const { product, selectedColor, selectedSize, isProductIncomplete } = state;
  const { setSelectedColor, setSelectedSize } = actions;

  return (
    <div className="space-y-8 mb-8 border-t border-slate-100 pt-8">

      {/* COLOR THUMBNAILS (Optional detailed view) */}
      {product.colors?.length > 0 && (
        <div className="flex gap-3 overflow-x-auto pb-2 custom-scrollbar">
          {product.colors.map((color) => (
            <img
              key={`thumb-${color.id}`}
              src={color.image_url}
              className={`w-16 h-20 object-cover rounded-xl cursor-pointer border-2 transition-all ${
                selectedColor?.id === color.id ? "border-slate-900 opacity-100 shadow-md" : "border-transparent opacity-60 hover:opacity-100"
              }`}
              onClick={() => setSelectedColor(color)}
              alt={color.color_name}
            />
          ))}
        </div>
      )}

      {/* COLOR DOTS */}
      <div>
        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-widest mb-3">
          Color <span className="text-slate-500 font-normal normal-case ml-2">{selectedColor?.color_name || "Not selected"}</span>
        </h3>
        <div className="flex items-center flex-wrap gap-3">
          {product.colors?.map((color) => (
            <button
              key={color.id}
              onClick={() => setSelectedColor(color)}
              className={`w-10 h-10 rounded-full border border-slate-200 transition-transform focus:outline-none ${
                selectedColor?.id === color.id ? "ring-2 ring-offset-2 ring-slate-900 scale-110" : "hover:scale-110"
              }`}
              style={{ backgroundColor: color.color_code }}
              title={color.color_name}
            />
          ))}
          {isProductIncomplete && (
            <p className="text-sm text-slate-400 italic">Color information not available.</p>
          )}
        </div>
      </div>

      {/* SIZES */}
      <div>
        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-widest mb-3">Size</h3>
        <div className="flex flex-wrap gap-3">
          {selectedColor?.sizes?.map((sizeObj) => {
            const isSelected = selectedSize?.id === sizeObj.id;
            const isOutOfStock = sizeObj.stock === 0;

            return (
              <button
                key={sizeObj.id}
                onClick={() => setSelectedSize(sizeObj)}
                disabled={isOutOfStock}
                className={`py-3 px-6 text-sm font-medium uppercase rounded-2xl transition-all ${
                  isSelected
                    ? "bg-slate-900 text-white shadow-md"
                    : isOutOfStock
                    ? "bg-slate-50 text-slate-300 cursor-not-allowed"
                    : "bg-white text-slate-600 border border-slate-200 hover:border-slate-900 hover:text-slate-900"
                }`}
              >
                {sizeObj.size}
              </button>
            );
          })}
        </div>
        {!isProductIncomplete && (!selectedColor?.sizes || selectedColor.sizes.length === 0) && (
          <p className="text-sm text-rose-500 mt-2 font-medium">This color has no sizes available.</p>
        )}
      </div>
    </div>
  );
}
