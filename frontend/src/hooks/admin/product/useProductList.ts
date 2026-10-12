import { useState, useEffect, useCallback } from "react";
import { useToast } from "../../../context/ToastContext";
import { useLanguage } from "../../../context/LanguageContext";
import { productApi, PAGE_SIZE } from "./productApi";

interface ProductListQuery {
  page: number;
  filterGender: string;
  selectedCategoryIds: string;
  debouncedSearch: string;
}
export interface ProductRecord { id: number; name: string; name_vi?: string; name_en?: string; description_vi?: string; description_en?: string; price: number | string; import_price?: number | string; image_url?: string; category_name?: string; gender: string; category_id: number | string; total_stock?: number; [key: string]: unknown }

/**
 * Tải 1 trang sản phẩm từ server (GET /admin/products) theo bộ lọc hiện tại.
 * Server lọc + sắp xếp (Nam → Nữ → Unisex) nên `products` đã đúng trang, đúng thứ tự.
 */
export function useProductList({ page, filterGender, selectedCategoryIds, debouncedSearch }: ProductListQuery) {
  const token = localStorage.getItem("token");
  const { showToast } = useToast();
  const { t } = useLanguage();

  const [products, setProducts] = useState<ProductRecord[]>([]);
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, totalProducts: 0 });
  const [loading, setLoading] = useState(false);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE) });
      if (filterGender !== "all") params.set("gender", filterGender);
      if (selectedCategoryIds) params.set("category_ids", selectedCategoryIds);
      if (debouncedSearch) params.set("search", debouncedSearch);

      const prodRes = await productApi.get(`/admin/products?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const payload = prodRes.data;

      setProducts(Array.isArray(payload?.data) ? payload.data : []);
      setPagination({
        currentPage: payload?.currentPage || 1,
        totalPages: payload?.totalPages || 1,
        totalProducts: payload?.totalProducts ?? 0,
      });
    } catch (err: unknown) {
      console.error("Data Load Error:", err);
      showToast(t("admin.product.toast_load_failed", "Failed to load data"), "error");
    } finally {
      setLoading(false);
    }
  }, [token, showToast, t, page, filterGender, selectedCategoryIds, debouncedSearch]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  return { products, setProducts, pagination, loading, fetchProducts };
}
