import { useState, useEffect } from "react";

/** Tìm kiếm (debounce) + lọc vai trò + trang hiện tại của danh sách người dùng. */
export function useUserFilters() {
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filterRole, setFilterRole] = useState("all");

  // Gõ tìm kiếm liên tục không nên bắn request mỗi ký tự => chờ 300ms.
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm.trim()), 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Đổi từ khóa tìm kiếm hoặc vai trò => tự reset về trang 1.
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, filterRole]);

  return { page, setPage, searchTerm, setSearchTerm, debouncedSearch, filterRole, setFilterRole };
}
