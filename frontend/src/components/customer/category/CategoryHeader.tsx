import { useLanguage } from "../../../context/LanguageContext";

export default function CategoryHeader({ category, productCount }) {
  const { t, getLocalizedText } = useLanguage();
  const categoryName = getLocalizedText(category, 'name') || t("category.product_category", "Product Category");

  return (
    <div className="flex flex-col md:flex-row justify-between mb-10 border-b border-slate-100 dark:border-slate-800 pb-6">
      <h1 className="text-4xl sm:text-5xl font-medium text-slate-900 dark:text-slate-100 tracking-tight capitalize">
        {categoryName}
      </h1>
      <span className="text-slate-500 dark:text-slate-400 mt-4 md:mt-0 font-medium self-start md:self-end">
        {productCount > 0 ? `${productCount} ${t("category.products_available", "products available")}` : t("category.fetching", "Fetching products...")}
      </span>
    </div>
  );
}
