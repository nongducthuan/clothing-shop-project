import ProductCard from "../../components/customer/product/ProductCard";
import { useCategoryPage } from "../../hooks/customer/useCategoryPage";
import { useLanguage } from "../../context/LanguageContext";
import CategoryHeader from "../../components/customer/category/CategoryHeader";
import VoucherBanner from "../../components/customer/category/VoucherBanner";
import PaginationControls from "../../components/customer/category/PaginationControls";
import { ProductGridSkeleton, EmptyState } from "../../components/customer/category/CategoryStates";

export default function CategoryPage() {
  const { state, actions } = useCategoryPage();
  const { t } = useLanguage();

  if (state.error) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-rose-500">
        <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center mb-4">
          <i className="fa-solid fa-triangle-exclamation text-2xl"></i>
        </div>
        <p className="text-xl font-medium mb-6">{state.error}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-8 py-3 bg-slate-900 rounded-full text-white font-medium hover:bg-slate-800 transition-colors"
        >
          {t("category.reload", "Reload Page")}
        </button>
      </div>
    );
  }

  return (
    <div className="w-full flex-1 bg-white dark:bg-slate-900 transition-colors">
      <div className="max-w-[1400px] mx-auto py-12 px-6">

      <CategoryHeader
        category={state.currentCategory}
        productCount={state.totalProducts}
      />

      {state.activeVoucher && (
        <VoucherBanner
          voucher={state.activeVoucher}
          category={state.currentCategory}
        />
      )}

      {state.isInitialLoad ? (
        <ProductGridSkeleton />
      ) : state.products.length === 0 ? (
        <EmptyState />
      ) : (
        <div className={`transition-opacity duration-500 ${state.isLoading ? "opacity-50 pointer-events-none" : "opacity-100"}`}>

          {/* Products Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-12">
            {state.products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                promotion={actions.getPromotionForProduct(product.id)}
              />
            ))}
          </div>

          <PaginationControls
            currentPage={state.currentPage}
            totalPages={state.totalPages}
            onPrev={actions.handlePrevPage}
            onNext={actions.handleNextPage}
          />

        </div>
      )}
      </div>
    </div>
  );
}
