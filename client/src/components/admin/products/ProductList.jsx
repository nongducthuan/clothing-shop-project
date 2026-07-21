import React from "react";
import { useNavigate } from "react-router-dom";

export default function ProductList({
  products,
  filterGender,
  setFilterGender,
  filterCategory,
  setFilterCategory,
  uniqueCategoriesForFilter,
  searchTerm,
  setSearchTerm,
  handleEdit,
  handleDelete,
  BACKEND_URL
}) {
  const navigate = useNavigate();
  const genders = ["all", "male", "female", "unisex"];

  return (
    <div className="lg:col-span-8 flex flex-col h-full">
      {/* Filtering Section */}
      <div className="bg-white p-4 md:p-5 rounded-[2rem] shadow-sm border border-gray-100 mb-8 flex flex-col gap-4">

        {/* Top Row: Gender Pills & Category Select */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="inline-flex p-1.5 bg-gray-100/80 rounded-full shadow-inner w-full md:w-auto">
            {genders.map((g) => (
              <button
                key={g}
                onClick={() => setFilterGender(g)}
                className={`flex-1 md:flex-none px-5 py-2 rounded-full font-bold text-sm transition-all duration-300 ease-out capitalize ${filterGender === g
                  ? "bg-white text-violet-600 shadow-sm scale-100"
                  : "text-gray-500 bg-transparent hover:text-gray-800 hover:bg-gray-200/50 scale-95"
                  }`}
              >
                {g}
              </button>
            ))}
          </div>

          <select
            className="w-full md:w-64 px-4 py-2.5 bg-gray-50 border-transparent focus:bg-white focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 rounded-full transition-all duration-300 outline-none text-gray-700 font-medium text-sm appearance-none cursor-pointer"
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
          >
            <option value="all">All Categories</option>
            {uniqueCategoriesForFilter.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* Bottom Row: Search Input */}
        <div className="relative w-full">
          <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"></i>
          <input
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border-transparent focus:bg-white focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 rounded-full transition-all duration-300 outline-none text-gray-700 font-medium text-sm shadow-inner"
            placeholder="Search products by name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Product Grid Area */}
      <div className="bg-gray-50/80 p-6 md:p-8 rounded-[2rem] border border-gray-100 shadow-inner flex-1 min-h-[500px]">
        {products.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-12">
            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mb-4 shadow-sm border border-gray-100">
              <i className="fa-solid fa-box-open text-gray-300 text-3xl"></i>
            </div>
            <h4 className="text-gray-800 font-bold text-lg mb-1">No Products Found</h4>
            <p className="text-gray-500 text-sm max-w-sm">Try adjusting your filters or search term.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((p) => {
              const genderColor = p.gender === "male" ? "bg-blue-500" : p.gender === "female" ? "bg-pink-500" : "bg-purple-500";

              return (
                <div
                  key={p.id}
                  className="bg-white rounded-[1.5rem] shadow-sm border border-gray-100 overflow-hidden cursor-pointer group hover:shadow-md transition-all duration-300 flex flex-col"
                  onClick={() => navigate(`/admin/products/${p.id}`)}
                >
                  {/* Image & Badges */}
                  <div className="relative h-56 bg-gray-100 overflow-hidden">
                    <img
                      src={p.image_url?.startsWith("http") ? p.image_url : `${BACKEND_URL}${p.image_url}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      alt={p.name}
                      onError={(e) => (e.target.src = "import.meta.env.VITE_API_URL/public/placeholder.jpg")}
                    />

                    {/* Gender Badge */}
                    <span className={`absolute top-4 left-4 px-3 py-1 text-[11px] font-bold text-white rounded-full uppercase tracking-wider shadow-sm ${genderColor}`}>
                      {p.gender}
                    </span>
                  </div>

                  {/* Content */}
                  <div className="p-4 flex-1 flex flex-col">
                    <div className="text-[10px] text-gray-400 font-bold tracking-widest mb-1 uppercase truncate">
                      {p.category_name}
                    </div>
                    <h4 className="font-extrabold text-gray-900 text-base leading-tight truncate mb-3">
                      {p.name}
                    </h4>

                    {/* Action Footer: Căn ngang Giá bên trái, Nút bên phải */}
                    <div className="mt-auto flex justify-between items-end pt-3 border-t border-gray-100">

                      {/* Section 1: Thông tin Giá & Stock */}
                      <div className="flex flex-col gap-1 flex-1 min-w-0">
                        <div className="flex items-baseline gap-1 text-red-600 leading-none">
                          <span className="font-black text-lg">
                            {Number(p.price).toLocaleString()}
                          </span>
                          <span className="font-bold text-[10px] uppercase">VND</span>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-1">
                          <div className="flex items-center gap-1 text-[10px] text-gray-500 whitespace-nowrap">
                            <span className="font-medium opacity-70">Cost:</span>
                            <span className="font-semibold">{Number(p.import_price || 0).toLocaleString()}đ</span>
                          </div>
                          <div className="flex items-center gap-1 text-[10px] text-emerald-600 whitespace-nowrap">
                            <span className="font-medium opacity-70">Profit:</span>
                            <span className="font-bold underline decoration-emerald-200 underline-offset-2">
                              +{Number(p.unit_profit || 0).toLocaleString()}đ
                            </span>
                          </div>
                        </div>
                        <div className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter">
                          Stock: {p.total_stock || 0}
                        </div>
                      </div>

                      {/* Section 2: Nút Edit / Delete */}
                      <div className="flex gap-1.5 flex-shrink-0 ml-2">
                        <button
                          onClick={(e) => { e.stopPropagation(); handleEdit(p); }}
                          className="w-7 h-7 flex items-center justify-center bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                        >
                          <i className="fa-solid fa-pen text-[10px]"></i>
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDelete(p.id); }}
                          className="w-7 h-7 flex items-center justify-center bg-red-50 text-red-600 rounded-lg hover:bg-red-600 hover:text-white transition-all shadow-sm"
                        >
                          <i className="fa-solid fa-trash text-[10px]"></i>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
