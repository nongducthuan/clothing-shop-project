import React from "react";

export default function BannerForm({
  form,
  setForm,
  handleSubmit,
  handleFileUpload,
  uploading,
  editingId,
  onCancel,
  backendUrl,
}) {
  return (
    <div className="flex flex-col h-full">
      <h3 className="text-xl font-extrabold mb-6 text-gray-800 flex items-center gap-3">
        {editingId ? (
          <><i className="fa-solid fa-pen-to-square text-violet-500"></i> Edit Banner</>
        ) : (
          <><i className="fa-solid fa-plus-circle text-violet-500"></i> Add New Banner</>
        )}
      </h3>

      <form onSubmit={handleSubmit} className="space-y-6 flex-1 flex flex-col">
        {/* Title Input */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2 ml-1">Title</label>
          <input
            type="text"
            required
            className="w-full px-4 py-3 bg-gray-50 border-transparent focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-2xl transition-all duration-300 outline-none text-gray-800 font-medium"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="e.g., Summer Sale 2024"
          />
        </div>

        {/* Subtitle Input */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2 ml-1">Subtitle</label>
          <input
            type="text"
            className="w-full px-4 py-3 bg-gray-50 border-transparent focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-2xl transition-all duration-300 outline-none text-gray-800 font-medium"
            value={form.subtitle}
            onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
            placeholder="e.g., Up to 50% off on selected items"
          />
        </div>

        {/* Image Upload & Preview */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2 ml-1">Banner Image</label>

          {/* File Input styling */}
          <div className="relative mb-3">
            <input
              type="file"
              onChange={handleFileUpload}
              accept="image/*"
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            />
            <div className="w-full px-4 py-3 bg-blue-50/50 border border-dashed border-blue-200 rounded-2xl flex items-center justify-center gap-2 text-violet-600 hover:bg-blue-50 transition-colors duration-300">
              <i className="fa-solid fa-cloud-arrow-up"></i>
              <span className="font-semibold text-sm">Upload Image File</span>
            </div>
          </div>

          {/* URL Input */}
          <input
            type="text"
            className="w-full px-4 py-3 bg-gray-50 border-transparent focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-2xl transition-all duration-300 outline-none text-gray-500 text-sm font-medium mb-3"
            value={form.imageUrl}
            onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
            placeholder="Or paste an image URL here..."
          />

          {uploading && (
            <p className="text-xs font-bold text-blue-500 animate-pulse ml-1 mb-2">
              <i className="fa-solid fa-spinner fa-spin mr-1"></i> Uploading...
            </p>
          )}

          {/* Image Preview */}
          {form.imageUrl ? (
            <div className="w-full h-32 rounded-2xl overflow-hidden bg-gray-100 shadow-inner border border-gray-100 relative group mt-2">
              <img
                src={
                  form.imageUrl.startsWith("http")
                    ? form.imageUrl
                    : `${backendUrl}${form.imageUrl}`
                }
                alt="Preview"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                <span className="text-white font-bold text-sm tracking-wider uppercase">Preview</span>
              </div>
            </div>
          ) : (
             <div className="w-full h-32 rounded-2xl bg-gray-50 border border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400 mt-2">
               <i className="fa-solid fa-image text-2xl mb-1"></i>
               <span className="text-xs font-medium">No image selected</span>
             </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 pt-4 mt-auto">
          <button
            type="submit"
            disabled={uploading}
            className={`flex-1 text-white px-6 py-3.5 rounded-full font-bold transition-all duration-300 shadow-sm flex justify-center items-center gap-2 ${
              uploading
                ? "bg-violet-300 cursor-not-allowed"
                : editingId
                  ? "bg-yellow-500 hover:bg-yellow-600 hover:shadow-md hover:-translate-y-0.5"
                  : "bg-violet-600 hover:bg-violet-700 hover:shadow-md hover:-translate-y-0.5"
            }`}
          >
            {editingId ? "Update Banner" : "Add Banner"}
          </button>

          {editingId && (
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-3.5 bg-gray-100 text-gray-600 font-bold rounded-full hover:bg-gray-200 hover:text-gray-800 transition-all duration-300"
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
