import React from "react";
import { getImageUrl } from "../../../utils/imageUtils";

export default function CategoryForm({
  form,
  setForm,
  handleChange,
  handleSubmit,
  loading,
  editingId,
  resetForm,
  recommendNames,
  categoryImages,
}) {
  return (
    <div className="flex flex-col h-full">
      <h3 className="text-xl font-extrabold mb-6 text-gray-800 flex items-center gap-3 m-0 leading-none">
        {editingId ? (
          <><i className="fa-solid fa-pen-to-square text-violet-500"></i> Edit Category</>
        ) : (
          <><i className="fa-solid fa-plus-circle text-violet-500"></i> Add New Category</>
        )}
      </h3>

      <form onSubmit={handleSubmit} className="space-y-6 flex-1">
        {/* Category Name */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2 ml-1">Category Name</label>
          <input
            name="name"
            value={form.name}
            onChange={handleChange}
            required
            className="w-full px-4 py-3 bg-gray-50 border-transparent focus:bg-white focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 rounded-2xl transition-all duration-300 outline-none text-gray-800 font-medium"
            placeholder="E.g., T-Shirts"
          />

          {recommendNames.length > 0 && (
            <div className="mt-3 p-4 border border-violet-100 rounded-[1.5rem] bg-violet-50/50">
              <p className="font-bold text-xs uppercase tracking-wider text-violet-600 mb-3 ml-1">
                Suggested Categories
              </p>
              <div className="flex flex-wrap gap-2">
                {recommendNames.map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setForm((prev) => ({ ...prev, name: item.name }))}
                    className="px-4 py-1.5 bg-white border border-violet-100 rounded-full shadow-sm hover:bg-violet-600 hover:text-white hover:border-violet-600 text-violet-700 text-sm font-semibold transition-colors duration-300"
                  >
                    {item.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Gender Selection */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2 ml-1">Gender</label>
          <select
            name="gender"
            value={form.gender}
            onChange={handleChange}
            required
            className="w-full px-4 py-3 bg-gray-50 border-transparent focus:bg-white focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 rounded-2xl transition-all duration-300 outline-none text-gray-800 font-medium appearance-none cursor-pointer"
          >
            <option value="">-- Select Gender --</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="unisex">Unisex</option>
          </select>
        </div>

        {/* Cover Image Selection */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2 ml-1">Cover Image</label>

          {editingId && categoryImages.length > 0 ? (
            <div className="grid grid-cols-4 gap-3 bg-gray-50 p-3 rounded-[1.5rem] border border-gray-100">
              {categoryImages.map((img, idx) => {
                const imageSrc = img.image_url;
                return (
                  <div
                    key={idx}
                    onClick={() => setForm((prev) => ({ ...prev, image_url: imageSrc }))}
                    className={`relative rounded-2xl cursor-pointer overflow-hidden transition-all duration-300 ${
                      form.image_url === imageSrc
                        ? "ring-4 ring-violet-500 shadow-md scale-95"
                        : "opacity-70 hover:opacity-100 hover:scale-105"
                    }`}
                  >
                    <img
                      src={getImageUrl(imageSrc)}
                      className="w-full h-20 object-cover"
                      alt={`Preview ${idx}`}
                      onError={(e) => {
                        (e.target as HTMLImageElement).onerror = null;
                        (e.target as HTMLImageElement).src = getImageUrl(null);
                      }}
                    />
                    {form.image_url === imageSrc && (
                      <div className="absolute inset-0 bg-violet-500/20 flex items-center justify-center">
                        <i className="fa-solid fa-check-circle text-white text-xl drop-shadow-md"></i>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="px-4 py-6 bg-gray-50 rounded-[1.5rem] border border-dashed border-gray-300 text-center">
              <i className="fa-solid fa-image text-gray-400 text-2xl mb-2"></i>
              <p className="text-gray-500 font-medium text-sm">
                Select a category to display related product images here.
              </p>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 pt-4 mt-auto">
          <button
            type="submit"
            disabled={loading}
            className={`flex-1 text-white px-6 py-3.5 rounded-full font-bold transition-all duration-300 shadow-sm flex justify-center items-center gap-2 ${
              loading
                ? "bg-violet-300 cursor-not-allowed"
                : "bg-violet-600 hover:bg-violet-700 hover:shadow-md hover:-translate-y-0.5"
            }`}
          >
            {loading ? <i className="fa-solid fa-spinner fa-spin"></i> : null}
            {editingId ? "Save Changes" : "Create Category"}
          </button>

          {editingId && (
            <button
              type="button"
              className="px-6 py-3.5 bg-gray-100 text-gray-600 font-bold rounded-full hover:bg-gray-200 hover:text-gray-800 transition-all duration-300"
              onClick={resetForm}
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
