import { useLanguage } from "@shop/shared/context/LanguageContext";

export default function CategoryHeader({ category, productCount, isLoading }: {
  category: Record<string, unknown> | null;
  productCount: number;
  isLoading?: boolean;
}) {
  const { t, getLocalizedText } = useLanguage();
  const categoryName = category ? getLocalizedText(category, 'name') : t("category.product_category", "Product Category");

  const countLabel = isLoading
    ? t("category.fetching", "Fetching products...")
    : productCount > 0
    ? `${productCount} ${t("category.products_available", "products available")}`
    : t("category.no_products", "No products found");

  return (
    <div className="flex flex-col md:flex-row justify-between items-center md:items-end mb-10 border-b border-slate-100 dark:border-slate-800 pb-6">
      <h1 className="text-4xl sm:text-5xl font-medium text-slate-900 dark:text-slate-100 tracking-tight capitalize text-center md:text-left">
        {categoryName}
      </h1>
      <span className="text-slate-500 dark:text-slate-400 mt-3 md:mt-0 font-medium text-center md:text-right">
        {countLabel}
      </span>
    </div>
  );
}
