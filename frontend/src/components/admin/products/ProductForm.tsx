import React from "react";

export default function ProductForm({
  form,
  setForm,
  categories,
  editingId,
  uploading,
  mobileFormOpen,
  handleSubmit,
  handleFileUpload,
  resetForm
}) {
  // Hàm chặn sự kiện lăn chuột làm thay đổi số
  const handleWheel = (e) => {
    e.target.blur();
  };

  return (
    <>
      {/* CSS ẩn nút tăng/giảm (spinners) của thẻ input type="number" */}
      <style>{`
        .no-spinner::-webkit-inner-spin-button,
        .no-spinner::-webkit-outer-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
        .no-spinner {
          -moz-appearance: textfield;
        }
      `}</style>

      <div className={`lg:col-span-4 ${mobileFormOpen ? "block" : "hidden lg:block"}`}>
        <div className="bg-white p-6 md:p-8 rounded-[2rem] border border-gray-100 shadow-sm lg:sticky lg:top-24 transition-all duration-300">
          <h3 className="text-xl font-extrabold mb-6 text-gray-800 flex items-center gap-3">
            {editingId ? (
              <><i className="fa-solid fa-pen-to-square text-violet-500"></i> Edit Product</>
            ) : (
              <><i className="fa-solid fa-plus-circle text-violet-500"></i> Create Product</>
            )}
          </h3>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            {/* Name Input */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2 ml-1">Product Name</label>
              <input
                className="w-full px-4 py-3 bg-gray-50 border-transparent focus:bg-white focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 rounded-2xl transition-all duration-300 outline-none text-gray-800 font-medium"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g., Classic White T-Shirt"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Price Input - Đã thêm onWheel và no-spinner */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2 ml-1">Price</label>
                <input
                  type="number"
                  onWheel={handleWheel} // Ngăn chặn lăn chuột
                  className="w-full px-4 py-3 bg-gray-50 border-transparent focus:bg-white focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 rounded-2xl transition-all duration-300 outline-none text-gray-800 font-medium no-spinner"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: +e.target.value })}
                  placeholder="0"
                  required
                />
              </div>
              {/* Gender Select */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2 ml-1">Gender</label>
                <select
                  className="w-full px-4 py-3 bg-gray-50 border-transparent focus:bg-white focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 rounded-2xl transition-all duration-300 outline-none text-gray-800 font-medium appearance-none cursor-pointer"
                  value={form.gender}
                  onChange={(e) => setForm({ ...form, gender: e.target.value })}
                >
                  <option value="unisex">Unisex</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
              </div>
            </div>

            {/* Category Select */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2 ml-1">Category</label>
              <select
                className="w-full px-4 py-3 bg-gray-50 border-transparent focus:bg-white focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 rounded-2xl transition-all duration-300 outline-none text-gray-800 font-medium appearance-none cursor-pointer"
                value={form.category_id}
                onChange={(e) => setForm({ ...form, category_id: e.target.value })}
                required
              >
                <option value="">-- Select Category --</option>
                {categories
                  .filter((c) => c.gender === form.gender)
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
              </select>
            </div>

            {/* Image Upload */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2 ml-1">Product Image</label>
              <div className="relative mb-3">
                <input
                  type="file"
                  onChange={handleFileUpload}
                  accept="image/*"
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
                <div className="w-full px-4 py-3 bg-violet-50/50 border border-dashed border-violet-200 rounded-2xl flex items-center justify-center gap-2 text-violet-600 hover:bg-violet-50 transition-colors duration-300">
                  <i className="fa-solid fa-cloud-arrow-up"></i>
                  <span className="font-semibold text-sm">Upload Image</span>
                </div>
              </div>
              <input
                className="w-full px-4 py-3 bg-gray-50 border-transparent focus:bg-white focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 rounded-2xl transition-all duration-300 outline-none text-gray-500 text-sm font-medium mb-1"
                value={form.image_url}
                onChange={(e) => setForm({ ...form, image_url: e.target.value })}
                placeholder="Or paste image URL"
              />
              {uploading && <span className="text-xs font-bold text-violet-500 animate-pulse ml-1"><i className="fa-solid fa-spinner fa-spin mr-1"></i> Uploading...</span>}
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2 ml-1">Description</label>
              <textarea
                className="w-full px-4 py-3 bg-gray-50 border-transparent focus:bg-white focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 rounded-2xl transition-all duration-300 outline-none text-gray-800 font-medium resize-none"
                rows={3}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Product details..."
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={uploading}
                className={`flex-1 py-3.5 rounded-full font-bold text-white transition-all duration-300 shadow-sm ${
                  uploading
                    ? "bg-violet-300 cursor-not-allowed"
                    : editingId
                      ? "bg-yellow-500 hover:bg-yellow-600 hover:-translate-y-0.5 hover:shadow-md"
                      : "bg-violet-600 hover:bg-violet-700 hover:-translate-y-0.5 hover:shadow-md"
                }`}
              >
                {editingId ? "Update Product" : "Create Product"}
              </button>
              {editingId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-6 py-3.5 bg-gray-100 text-gray-600 font-bold rounded-full hover:bg-gray-200 hover:text-gray-800 transition-all duration-300"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </>
  );
}

