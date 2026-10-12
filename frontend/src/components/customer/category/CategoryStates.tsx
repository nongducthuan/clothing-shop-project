import { useLanguage } from "../../../context/LanguageContext";

export function ProductGridSkeleton() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {[...Array(8)].map((_, i) => (
        <div key={i} className="bg-slate-100 dark:bg-slate-800 h-[400px] rounded-3xl animate-pulse"></div>
      ))}
    </div>
  );
}

export function EmptyState() {
  const { t } = useLanguage();
  return (
    <div className="text-center py-24 bg-slate-50 dark:bg-slate-800/50 rounded-[2rem] border border-slate-100 dark:border-slate-800">
      <div className="w-20 h-20 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm border dark:border-slate-700">
        <i className="fa-solid fa-box-open text-2xl text-slate-300 dark:text-slate-500"></i>
      </div>
      <p className="text-slate-600 dark:text-slate-300 text-lg font-medium">{t("category.empty_title", "No matching products found.")}</p>
      <button
        onClick={() => window.history.back()}
        className="mt-6 px-8 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-full font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
      >
        &larr; {t("category.go_back", "Go Back")}
      </button>
    </div>
  );
}
