import { useState, useEffect, useMemo, useCallback } from "react";

import type { ProductCategory } from "./useProductCategories";
type ProductFilterCategory = ProductCategory;

/**
 * Bộ lọc (giới tính / danh mục / tìm kiếm) + trang hiện tại của danh sách sản phẩm.
 * Việc lọc và phân trang thật sự chạy ở server; hook này chỉ giữ state và dựng tham số.
 */
export function useProductFilters(categories: ProductFilterCategory[]) {
  const [filterGender, setFilterGender] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);

  // Gõ tìm kiếm liên tục không nên bắn request mỗi ký tự => chờ 300ms (giống useUserManager).
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm.trim()), 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    setFilterCategory("all");
  }, [filterGender]);

  /**
   * Lọc danh mục theo TÊN: "Áo thun" tồn tại riêng cho nam/nữ nên chọn 1 danh mục phải
   * gom cả các danh mục cùng tên. Trước đây client tự gom; giờ gửi sẵn nhóm id lên server.
   */
  const selectedCategoryIds = useMemo(() => {
    if (filterCategory === "all") return "";
    const target = categories.find((c) => String(c.id) === String(filterCategory));
    if (!target) return String(filterCategory);
    const nameKey = (target.name || "").trim().toLowerCase();
    return categories
      .filter((c) => (c.name || "").trim().toLowerCase() === nameKey)
      .map((c) => c.id)
      .join(",");
  }, [categories, filterCategory]);

  /** Danh sách danh mục (đã gộp trùng tên) cho ô chọn lọc, theo giới tính đang chọn. */
  const uniqueCategoriesForFilter = useMemo(() => {
    const activeList = filterGender === "all"
      ? categories
      : categories.filter((c) => c.gender === filterGender);

    const uniqueList: typeof categories = [];
    const seenNames = new Set();

    activeList.forEach((cat) => {
      const nameKey = cat.name.trim().toLowerCase();
      if (!seenNames.has(nameKey)) {
        seenNames.add(nameKey);
        uniqueList.push(cat);
      }
    });
    return uniqueList;
  }, [categories, filterGender]);

  // Gộp setTrang vào cùng 1 lần render với setBộ lọc (React batch) nên chỉ bắn 1
  // request duy nhất; nếu tách thành effect riêng sẽ fetch trang cũ trước rồi mới fetch trang 1.
  const changeFilterGender = useCallback((value: string) => {
    setFilterGender(value);
    setPage(1);
  }, []);

  const changeFilterCategory = useCallback((value: string) => {
    setFilterCategory(value);
    setPage(1);
  }, []);

  const changeSearchTerm = useCallback((value: string) => {
    setSearchTerm(value);
    setPage(1);
  }, []);

  return {
    filterGender,
    filterCategory,
    searchTerm,
    debouncedSearch,
    page,
    setPage,
    selectedCategoryIds,
    uniqueCategoriesForFilter,
    changeFilterGender,
    changeFilterCategory,
    changeSearchTerm,
  };
}
