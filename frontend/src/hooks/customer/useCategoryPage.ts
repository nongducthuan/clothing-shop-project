import { useState, useEffect, useCallback } from "react";
import { useParams, useSearchParams, useLocation } from "react-router-dom";
import { useLanguage } from "../../context/LanguageContext";
import API from "../../services/apiClient";

const ITEMS_PER_PAGE = 8;

export function useCategoryPage() {
  const { id } = useParams();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { t } = useLanguage();
  const { getLocalizedText, language } = useLanguage();

  const rawGender = searchParams.get("gender");
  const gender = ["male", "female", "unisex"].includes(rawGender) ? rawGender : null;

  const [products, setProducts] = useState([]);
  const [currentCategory, setCurrentCategory] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const [activeVoucher, setActiveVoucher] = useState(null);
  const [activePromotions, setActivePromotions] = useState([]);

  const fetchCategoryData = useCallback(async () => {
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
          params: { category_id: id, gender: gender, page: currentPage, limit: ITEMS_PER_PAGE },
        }),
        API.get("/categories"),
        API.get("/vouchers", { params: { category_id: id } }).catch(() => ({ data: [] })),
        API.get("/promotions").catch(() => ({ data: [] })),
      ]);

      const safeProducts = Array.isArray(productsResponse.data) ? productsResponse.data : productsResponse.data?.data || [];
      setProducts(safeProducts);
      setTotalPages(productsResponse.data?.totalPages || 1);
      setTotalProducts(productsResponse.data?.totalProducts || safeProducts.length);

      const categoryList = Array.isArray(categoriesResponse.data) ? categoriesResponse.data : categoriesResponse.data?.data || [];
      const found = categoryList.find((c) => String(c.id) === String(id));
      setCurrentCategory(found || null);

      const voucherList = vouchersResponse.data?.data || vouchersResponse.data;
      setActiveVoucher(Array.isArray(voucherList) && voucherList.length > 0 ? voucherList[0] : null);

      const promoList = promotionsResponse.data?.data || promotionsResponse.data || [];
      setActivePromotions(Array.isArray(promoList) ? promoList : []);

    } catch (err) {
      console.error("Error loading category data:", err);
      setError(t("category.error_loading", "Unable to load data. Please check your connection."));
      setProducts([]);
    } finally {
      setIsLoading(false);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [id, gender, currentPage]);

  useEffect(() => {
    fetchCategoryData();
  }, [fetchCategoryData, location.search]);

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage((prev) => prev + 1);
  };

  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage((prev) => prev - 1);
  };

  const getPromotionForProduct = (productId) => {
    return activePromotions.find((promo) => String(promo.buy_product_id) === String(productId));
  };

  const isInitialLoad = isLoading && products.length === 0;

  const categoryName = getLocalizedText(currentCategory, 'name') || t("category.product_category", "Product Category");

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
