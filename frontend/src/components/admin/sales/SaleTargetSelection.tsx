import React from "react";
import { useLanguage } from "../../../context/LanguageContext";

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
  const { getLocalizedText } = useLanguage();

  const getGenderLabel = (gender) => {
    const g = (gender || "").toLowerCase();
    if (g === 'men' || g === 'male') return 'Nam';
    if (g === 'women' || g === 'female') return 'Nữ';
    return 'Unisex';
  };

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

  const scopeLabels = { all: "Toàn bộ", category: "Danh mục", product: "Sản phẩm" };

  return (
    <>
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 5px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background-color: #e2e8f0; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background-color: #cbd5e1; }
      `}</style>

      <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-200/80 dark:border-slate-700 h-full">
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 mb-8">
          <h3 className="text-sm font-bold text-slate-400 dark:text-slate-400 uppercase tracking-widest">Chọn mục tiêu</h3>
          <div className="flex flex-wrap gap-2 bg-slate-100 dark:bg-slate-700/50 p-1 rounded-xl w-full xl:w-auto">
            {["all", "category", "product"].map((scope) => (
              <button
                key={scope}
                type="button"
                onClick={() => handleScopeChange(scope)}
                className={`flex-1 xl:flex-none px-4 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${
                  applyScope === scope ? 'bg-white dark:bg-slate-600 shadow-sm text-blue-600 dark:text-blue-400' : 'bg-transparent text-slate-400'
                }`}
              >
                {scopeLabels[scope]}
              </button>
            ))}
          </div>
        </div>

        <div className="min-h-[300px]">
          {/* All Scope */}
          {applyScope === "all" && (
            <div className="flex flex-col items-center justify-center h-full border-4 border-dashed border-slate-100 dark:border-slate-700 rounded-3xl p-10 text-center min-h-[300px]">
              <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900/40 rounded-full flex items-center justify-center mb-4">
                <i className="fa-solid fa-globe text-3xl text-blue-600 dark:text-blue-400"></i>
              </div>
              <h4 className="font-bold text-slate-800 dark:text-slate-100 text-lg">Giảm giá toàn cửa hàng</h4>
              <p className="text-slate-400 text-sm max-w-xs mt-2">Chiến dịch này sẽ tự động áp dụng cho tất cả sản phẩm trong cửa hàng.</p>
            </div>
          )}

          {/* Category Scope */}
          {applyScope === "category" && (
            <div className="space-y-4 animate-in fade-in duration-300">
              <div className="relative">
                <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
                <input
                  type="text"
                  placeholder="Tìm tên danh mục..."
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-700/60 border border-slate-200/80 dark:border-slate-600 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 transition-all outline-none text-slate-800 dark:text-slate-100"
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar border border-dashed border-slate-200/80 dark:border-slate-600/60 p-2 rounded-2xl">
                {categories.filter(cat =>
                  cat.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  getLocalizedText(cat, "name").toLowerCase().includes(searchTerm.toLowerCase()) ||
                  (cat.gender || "").toLowerCase().includes(searchTerm.toLowerCase())
                ).map((cat) => {
                  const isSelected = selectedCategoryIds.includes(cat.id);
                  return (
                    <div
                      key={cat.id}
                      onClick={() => toggleCategory(cat.id)}
                      className={`p-3 rounded-2xl border flex items-center justify-between cursor-pointer transition-all duration-200 ${
                        isSelected ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-900/20 shadow-sm' : 'border-slate-200/80 dark:border-slate-600/60 bg-white dark:bg-slate-700/40 hover:border-slate-300 dark:hover:border-slate-500'
                      }`}
                    >
                      <div className="flex flex-col gap-1 overflow-hidden">
                        <span className={`text-[11px] font-black truncate ${isSelected ? 'text-blue-700 dark:text-blue-300' : 'text-slate-700 dark:text-slate-200'}`}>
                          {getLocalizedText(cat, "name") || cat.name}
                        </span>
                        <div className="flex">
                          <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-tighter ${getGenderBadge(cat.gender)}`}>
                            {getGenderLabel(cat.gender)}
                          </span>
                        </div>
                      </div>
                      <div className="ml-2 flex-shrink-0">
                        <i className={`fa-solid ${isSelected ? 'fa-check-circle text-blue-500 text-lg' : 'fa-circle text-slate-200 dark:text-slate-600 text-lg'}`}></i>
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
                <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
                <input
                  type="text"
                  placeholder="Tìm tên sản phẩm, danh mục hoặc giới tính..."
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-700/60 border border-slate-200/80 dark:border-slate-600 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 transition-all outline-none text-slate-800 dark:text-slate-100"
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar border border-dashed border-slate-200/80 dark:border-slate-600/60 p-2 rounded-2xl">
                {products.filter(p => {
                  const foundCategory = categories.find(c => c.id === p.category_id);
                  const catNameForSearch = foundCategory ? (getLocalizedText(foundCategory, "name") || foundCategory.name) : "";
                  const pLocalName = getLocalizedText(p, "name") || p.name || "";
                  const searchLower = searchTerm.toLowerCase();
                  return (
                    pLocalName.toLowerCase().includes(searchLower) ||
                    catNameForSearch.toLowerCase().includes(searchLower) ||
                    getGenderLabel(p.gender).toLowerCase().includes(searchLower) ||
                    (p.gender || "").toLowerCase().includes(searchLower)
                  );
                }).map(p => {
                  const isSelected = selectedProductIds.includes(p.id);
                  const foundCategory = categories.find(c => c.id === p.category_id);
                  const displayCatName = foundCategory ? (getLocalizedText(foundCategory, "name") || foundCategory.name) : "Không phân loại";

                  return (
                    <div
                      key={p.id}
                      onClick={() => toggleProduct(p.id)}
                      className={`p-3 rounded-2xl border flex items-center justify-between cursor-pointer transition-all duration-200 ${
                        isSelected ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-900/20 shadow-sm' : 'border-slate-200/80 dark:border-slate-600/60 bg-white dark:bg-slate-700/40 hover:border-slate-300 dark:hover:border-slate-500'
                      }`}
                    >
                      <div className="flex flex-col gap-1 overflow-hidden">
                        <span className={`text-[11px] font-black truncate ${isSelected ? 'text-blue-700 dark:text-blue-300' : 'text-slate-700 dark:text-slate-200'}`}>
                          {getLocalizedText(p, "name") || p.name}
                        </span>
                        <div className="flex gap-1.5">
                          <span className="text-[9px] px-1.5 py-0.5 bg-slate-100 dark:bg-slate-600 text-slate-500 dark:text-slate-300 rounded font-bold uppercase tracking-tighter">
                            {displayCatName}
                          </span>
                          {p.gender && (
                            <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-tighter ${getGenderBadge(p.gender)}`}>
                              {getGenderLabel(p.gender)}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="ml-2 flex-shrink-0">
                        <i className={`fa-solid ${isSelected ? 'fa-check-circle text-blue-500 text-lg' : 'fa-circle text-slate-200 dark:text-slate-600 text-lg'}`}></i>
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
