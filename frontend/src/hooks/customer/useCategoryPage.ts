import { useState, useEffect, useCallback } from "react";
import { useParams, useSearchParams, useLocation } from "react-router-dom";
import API from "../../services/apiClient";

const ITEMS_PER_PAGE = 8;

export function useCategoryPage() {
  const { id } = useParams();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const rawGender = searchParams.get("gender");
  const gender = ["male", "female", "unisex"].includes(rawGender) ? rawGender : null;

  // --- State Management ---
  const [products, setProducts] = useState([]);
  const [categoryName, setCategoryName] = useState("Loading...");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const [activeVoucher, setActiveVoucher] = useState(null);
  const [activePromotions, setActivePromotions] = useState([]);

  // --- Data Fetching Logic ---
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

      // Process Products
      const safeProducts = Array.isArray(productsResponse.data) ? productsResponse.data : productsResponse.data?.data || [];
      setProducts(safeProducts);
      setTotalPages(productsResponse.data?.totalPages || 1);

      // Process Categories
      const categoryList = Array.isArray(categoriesResponse.data) ? categoriesResponse.data : categoriesResponse.data?.data || [];
      const currentCategory = categoryList.find((c) => String(c.id) === String(id));
      setCategoryName(currentCategory ? currentCategory.name : "Product Category");

      // Process Vouchers
      const voucherList = vouchersResponse.data?.data || vouchersResponse.data;
      setActiveVoucher(Array.isArray(voucherList) && voucherList.length > 0 ? voucherList[0] : null);

      // Process Promotions
      const promoList = promotionsResponse.data?.data || promotionsResponse.data || [];
      setActivePromotions(Array.isArray(promoList) ? promoList : []);

    } catch (err) {
      console.error("Error loading category data:", err);
      setError("Unable to load data. Please check your connection.");
      setProducts([]);
    } finally {
      setIsLoading(false);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [id, gender, currentPage]);

  useEffect(() => {
    fetchCategoryData();
  }, [fetchCategoryData, location.search]);

  // --- Event Handlers ---
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

  return {
    state: {
      products,
      categoryName,
      currentPage,
      totalPages,
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
