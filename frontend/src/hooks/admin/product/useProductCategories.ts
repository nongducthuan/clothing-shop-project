import { useState, useEffect, useCallback } from "react";
import { productApi } from "./productApi";

export interface ProductCategory { id: number | string; name: string; name_vi?: string; name_en?: string; gender: string; [key: string]: unknown }

/** Danh mục chỉ cần tải 1 lần (không phụ thuộc trang/bộ lọc) — tách khỏi fetch sản phẩm. */
export function useProductCategories() {
  const [categories, setCategories] = useState<ProductCategory[]>([]);

  const fetchCategories = useCallback(async () => {
    try {
      const catRes = await productApi.get("/categories");
      setCategories(Array.isArray(catRes.data) ? catRes.data : catRes.data?.data || []);
    } catch (err: unknown) {
      console.error("Category Load Error:", err);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  return { categories, fetchCategories };
}
