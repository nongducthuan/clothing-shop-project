import { useLanguage } from "../../../context/LanguageContext";

export interface PromotionSelectorProduct {
  id: number;
  name: string;
  category_id: number;
  gender?: string;
  [key: string]: unknown;
}

interface Props {
  type: "buy" | "get";
  products: PromotionSelectorProduct[];
  searchTerm: string;
  selectedId: number | string | null;
  setSearchTerm: (value: string) => void;
  setSelectedId: (id: number) => void;
  getCategoryName: (id: number) => string;
  getProductStock: (product: PromotionSelectorProduct) => number;
  getGenderStyle: (gender: string) => string;
}

export default function ProductSelector({
  type, products, searchTerm, selectedId, setSearchTerm, setSelectedId,
  getCategoryName, getProductStock, getGenderStyle,
}: Props) {
  const { t, getLocalizedText } = useLanguage();
  const isBuyType = type === "buy";
  const activeColorClasses = isBuyType
    ? { border: "border-indigo-500", bg: "bg-indigo-50", text: "text-indigo-700", check: "text-indigo-500" }
    : { border: "border-purple-500", bg: "bg-purple-50", text: "text-purple-700", check: "text-purple-500" };

  const getGenderLabel = (gender: string) => {
    const g = (gender || "").toLowerCase();
    if (g === "men" || g === "male") return "Nam";
    if (g === "women" || g === "female") return "Nữ";
    return "Unisex";
  };

  const filteredProducts = products.filter((p) => {
    const catName = getCategoryName(p.category_id);
    const pLocalName = getLocalizedText(p, "name") || p.name || "";
    const searchLower = searchTerm.toLowerCase();
    return pLocalName.toLowerCase().includes(searchLower)
      || catName.toLowerCase().includes(searchLower)
      || getGenderLabel(p.gender || "").toLowerCase().includes(searchLower)
      || (p.gender || "").toLowerCase().includes(searchLower);
  });

  return (
    <div className="space-y-3 mt-3">
      <div className="relative">
        <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
        <input
          type="text"
          placeholder={isBuyType ? t("admin.promo_search_buy_ph") : t("admin.promo_search_gift_ph")}
          className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-700/60 border border-slate-200/80 dark:border-slate-600 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 transition-all outline-none text-slate-800 dark:text-slate-100"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className={`grid grid-cols-1 gap-2 max-h-[250px] overflow-y-auto pr-2 border border-slate-200/50 dark:border-slate-600/50 bg-white/30 dark:bg-slate-700/20 rounded-2xl p-2 custom-scrollbar ${isBuyType ? "[&::-webkit-scrollbar-thumb]:bg-indigo-200" : "[&::-webkit-scrollbar-thumb]:bg-purple-200"}`}>
        {filteredProducts.map((p) => {
          const isSelected = selectedId === p.id;
          const displayCatName = getCategoryName(p.category_id);
          const stockAmount = getProductStock(p);

          return (
            <div
              key={p.id}
              onClick={() => setSelectedId(p.id)}
              className={`p-3 rounded-2xl border flex items-center justify-between cursor-pointer transition-all duration-200 ${isSelected ? `${activeColorClasses.border} ${activeColorClasses.bg} shadow-sm` : "border-slate-200/80 dark:border-slate-600/60 bg-white dark:bg-slate-700/40 hover:border-slate-300 dark:hover:border-slate-500"}`}
            >
              <div className="flex flex-col gap-1.5 overflow-hidden pr-2">
                <span className={`text-[11px] font-black truncate ${isSelected ? activeColorClasses.text : "text-slate-700 dark:text-slate-200"}`}>
                  {getLocalizedText(p, "name") || p.name}
                </span>
                <div className="flex gap-1.5 flex-wrap items-center">
                  <span className="text-[9px] px-1.5 py-0.5 bg-slate-100 dark:bg-slate-600 text-slate-500 dark:text-slate-300 rounded font-bold uppercase tracking-tighter">{displayCatName}</span>
                  {p.gender && <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-tighter ${getGenderStyle(p.gender)}`}>{getGenderLabel(p.gender)}</span>}
                  <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-tighter ${stockAmount > 0 ? "bg-amber-100 text-amber-600" : "bg-red-100 text-red-600"}`}>
                    {t("admin.promo_stock")}: {stockAmount}
                  </span>
                </div>
              </div>
              <div className="ml-1 flex-shrink-0">
                <i className={`fa-solid ${isSelected ? `fa-check-circle ${activeColorClasses.check} text-lg` : "fa-circle text-slate-200 dark:text-slate-600 text-lg"}`}></i>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
