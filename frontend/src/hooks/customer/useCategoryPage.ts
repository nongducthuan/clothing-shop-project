import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useSearchParams, useLocation } from "react-router-dom";
import { useLanguage } from "../../context/LanguageContext";
import API from "../../services/apiClient";

const ITEMS_PER_PAGE = 8;

interface CategoryProduct { id: number; name: string; price: number; name_vi?: string; name_en?: string; description?: string; description_vi?: string; description_en?: string; image_url?: string; sale_percent?: number; gender?: "male" | "female" | "unisex"; category_id?: number; [key: string]: unknown }
interface CategoryRecord { id: number; name: string; name_vi?: string; name_en?: string; [key: string]: unknown }
interface CategoryPromotion { buy_product_id: number | string; buy_quantity: number; gift_quantity: number; [key: string]: unknown }
interface CategoryVoucher { code: string; discount_percent: number | string; usage_limit?: number | null; min_order_value?: number; max_discount_amount?: number; apply_scope?: string; [key: string]: unknown }

export function useCategoryPage() {
  const { id } = useParams();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { t } = useLanguage();
  const { getLocalizedText } = useLanguage();

  const rawGender = searchParams.get("gender");
  const gender = rawGender && ["male", "female", "unisex"].includes(rawGender) ? rawGender : null;

  const [products, setProducts] = useState<CategoryProduct[]>([]);
  const [currentCategory, setCurrentCategory] = useState<CategoryRecord | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [activeVoucher, setActiveVoucher] = useState<CategoryVoucher | null>(null);
  const [activePromotions, setActivePromotions] = useState<CategoryPromotion[]>([]);
  const requestIdRef = useRef(0);
  const categoryContextRef = useRef(`${id ?? ""}:${gender ?? ""}`);

  const fetchCategoryData = useCallback(async () => {
    const requestId = ++requestIdRef.current;
    const context = `${id ?? ""}:${gender ?? ""}`;
    const contextChanged = categoryContextRef.current !== context;
    if (contextChanged) {
      categoryContextRef.current = context;
      setCurrentPage(1);
    }
    const requestedPage = contextChanged ? 1 : currentPage;
    setIsLoading(true);
    setError(null);

    try {
      const [
        productsResponse,
        categoriesResponse,
        vouchersResponse,
        promotionsResponse,
      ] = await Promise.all([
        API.get("/products", {
          params: { category_id: id, gender: gender, page: requestedPage, limit: ITEMS_PER_PAGE },
        }),
        API.get("/categories"),
        API.get("/vouchers", { params: { category_id: id } }).catch(() => ({ data: [] })),
        API.get("/promotions").catch(() => ({ data: [] })),
      ]);

      if (requestId !== requestIdRef.current) return;
      const safeProducts: CategoryProduct[] = Array.isArray(productsResponse.data) ? productsResponse.data : productsResponse.data?.data || [];
      setProducts(safeProducts);
      setTotalPages(productsResponse.data?.totalPages || 1);
      setTotalProducts(productsResponse.data?.totalProducts ?? safeProducts.length);

      const categoryList = Array.isArray(categoriesResponse.data) ? categoriesResponse.data : categoriesResponse.data?.data || [];
      const found = categoryList.find((c: CategoryRecord) => String(c.id) === String(id));
      setCurrentCategory(found || null);

      const voucherList = vouchersResponse.data?.data || vouchersResponse.data;
      setActiveVoucher(Array.isArray(voucherList) && voucherList.length > 0 ? voucherList[0] : null);

      const promoList = promotionsResponse.data?.data || promotionsResponse.data || [];
      setActivePromotions(Array.isArray(promoList) ? promoList : []);

    } catch (err) {
      if (requestId !== requestIdRef.current) return;
      console.error("Error loading category data:", err);
      setError(t("category.error_loading", "Unable to load data. Please check your connection."));
      setProducts([]);
    } finally {
      if (requestId === requestIdRef.current) {
        setIsLoading(false);
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    }
  }, [id, gender, currentPage, t]);

  useEffect(() => {
    fetchCategoryData();
  }, [fetchCategoryData, location.search]);

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage((prev) => prev + 1);
  };

  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage((prev) => prev - 1);
  };

  const getPromotionForProduct = (productId: number) => {
    return activePromotions.find((promo) => String(promo.buy_product_id) === String(productId));
  };

  const isInitialLoad = isLoading && products.length === 0;

  const categoryName = currentCategory ? getLocalizedText(currentCategory, 'name') : t("category.product_category", "Product Category");

  return {
    state: {
      products,
      categoryName,
      currentCategory,
      currentPage,
      totalPages,
      totalProducts,
      isLoading,
      error,
      activeVoucher,
      isInitialLoad
    },
    actions: {
      handleNextPage,
      handlePrevPage,
      getPromotionForProduct
    }
  };
}
