import React from "react";

export default function SaleTargetSelection({
  applyScope,
  setApplyScope,
  formData,
  setFormData,
  searchTerm,
  setSearchTerm,
  categories,
  products,
  selectedCategoryIds,
  toggleCategory,
  selectedProductIds,
  toggleProduct
}) {
  const handleScopeChange = (scope) => {
    setApplyScope(scope);
    setFormData({ ...formData, apply_scope: scope });
  };

  const getGenderBadge = (gender) => {
    const g = (gender || "").toLowerCase();
    if (g === 'men' || g === 'male') return 'bg-blue-100 text-blue-600';
    if (g === 'women' || g === 'female') return 'bg-pink-100 text-pink-600';
    return 'bg-emerald-100 text-emerald-600';
  };

  return (
    <>
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 5px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background-color: #e2e8f0; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background-color: #cbd5e1; }
      `}</style>

      <div className="bg-white p-6 rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100 h-full">
        <div className="flex justify-between items-center mb-8">
          <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest">Target Selection</h3>
          <div className="flex gap-2 bg-gray-100 p-1 rounded-xl">
            {["all", "category", "product"].map((scope) => (
              <button
                key={scope}
                type="button"
                onClick={() => handleScopeChange(scope)}
                className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${
                  applyScope === scope ? 'bg-white shadow-sm text-blue-600' : 'bg-transparent text-gray-400'
                }`}
              >
                {scope}
              </button>
            ))}
          </div>
        </div>

        <div className="min-h-[300px]">
          {/* All Scope */}
          {applyScope === "all" && (
            <div className="flex flex-col items-center justify-center h-full border-4 border-dashed border-gray-50 rounded-3xl p-10 text-center min-h-[300px]">
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <i className="fa-solid fa-globe text-3xl text-blue-600"></i>
              </div>
              <h4 className="font-bold text-gray-800 text-lg">Global Sale</h4>
              <p className="text-gray-400 text-sm max-w-xs mt-2">This campaign will automatically apply to every product in the store.</p>
            </div>
          )}

          {/* Category Scope */}
          {applyScope === "category" && (
            <div className="space-y-4 animate-in fade-in duration-300">
              <div className="relative">
                <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-xs"></i>
                <input
                  type="text"
                  placeholder="Search category name..."
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 transition-all outline-none"
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar border border-dashed border-gray-100 p-2 rounded-2xl">
                {categories.filter(cat =>
                  cat.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  (cat.gender || "").toLowerCase().includes(searchTerm.toLowerCase())
                ).map((cat) => {
                  const isSelected = selectedCategoryIds.includes(cat.id);
                  return (
                    <div
                      key={cat.id}
                      onClick={() => toggleCategory(cat.id)}
                      className={`p-3 rounded-2xl border flex items-center justify-between cursor-pointer transition-all duration-200 ${
                        isSelected ? 'border-blue-500 bg-blue-50/50 shadow-sm' : 'border-gray-100 bg-white hover:border-gray-300'
                      }`}
                    >
                      <div className="flex flex-col gap-1 overflow-hidden">
                        <span className={`text-[11px] font-black truncate ${isSelected ? 'text-blue-700' : 'text-gray-700'}`}>
                          {cat.name}
                        </span>
                        <div className="flex">
                          <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-tighter ${getGenderBadge(cat.gender)}`}>
                            {cat.gender || 'Unisex'}
                          </span>
                        </div>
                      </div>
                      <div className="ml-2 flex-shrink-0">
                        <i className={`fa-solid ${isSelected ? 'fa-check-circle text-blue-500 text-lg' : 'fa-circle text-gray-100 text-lg'}`}></i>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Product Scope */}
          {applyScope === "product" && (
            <div className="space-y-4 animate-in fade-in duration-300">
              <div className="relative">
                <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-xs"></i>
                <input
                  type="text"
                  placeholder="Search product name, category or gender..."
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all outline-none"
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar border border-dashed border-gray-100 p-2 rounded-2xl">
                {products.filter(p => {
                  const foundCategory = categories.find(c => c.id === p.category_id);
                  const catNameForSearch = foundCategory ? foundCategory.name : "";
                  return (
                    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    catNameForSearch.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    (p.gender || "").toLowerCase().includes(searchTerm.toLowerCase())
                  );
                }).map(p => {
                  const isSelected = selectedProductIds.includes(p.id);
                  const foundCategory = categories.find(c => c.id === p.category_id);
                  const displayCatName = foundCategory ? foundCategory.name : "Uncategorized";

                  return (
                    <div
                      key={p.id}
                      onClick={() => toggleProduct(p.id)}
                      className={`p-3 rounded-2xl border flex items-center justify-between cursor-pointer transition-all duration-200 ${
                        isSelected ? 'border-blue-500 bg-blue-50/50 shadow-sm' : 'border-gray-100 bg-white hover:border-gray-300'
                      }`}
                    >
                      <div className="flex flex-col gap-1 overflow-hidden">
                        <span className={`text-[11px] font-black truncate ${isSelected ? 'text-blue-700' : 'text-gray-700'}`}>
                          {p.name}
                        </span>
                        <div className="flex gap-1.5">
                          <span className="text-[9px] px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded font-bold uppercase tracking-tighter">
                            {displayCatName}
                          </span>
                          {p.gender && (
                            <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-tighter ${getGenderBadge(p.gender)}`}>
                              {p.gender}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="ml-2 flex-shrink-0">
                        <i className={`fa-solid ${isSelected ? 'fa-check-circle text-blue-500 text-lg' : 'fa-circle text-gray-100 text-lg'}`}></i>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
