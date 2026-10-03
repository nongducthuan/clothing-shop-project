import React from "react";
import { useLanguage } from "../../../context/LanguageContext";

interface AdminPaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems?: number;
  onPageChange: (page: number) => void;
  disabled?: boolean;
}

/**
 * Phân trang dùng chung cho các trang quản lý của admin (Đơn hàng, Sản phẩm, Người dùng, ...).
 * 
 * Thiết kế giao diện hiện đại:
 * - Hiển thị tổng số mục (total items)
 * - Nút Trước (Previous) / Sau (Next)
 * - Các nút số trang trực tiếp [1, 2, 3, ...] kèm dấu ba chấm [...] khi có nhiều trang
 * - Luôn hiển thị thanh thông tin kể cả khi chỉ có 1 trang (để admin biết tổng số lượng bản ghi)
 */
export default function AdminPagination({
  currentPage,
  totalPages,
  totalItems,
  onPageChange,
  disabled = false,
}: AdminPaginationProps) {
  const { t } = useLanguage();

  const safeTotalPages = Math.max(totalPages || 1, 1);
  const safeCurrentPage = Math.min(Math.max(currentPage || 1, 1), safeTotalPages);

  // Sinh danh sách các số trang cần hiển thị kèm dấu ba chấm '...'
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisibleButtons = 5;

    if (safeTotalPages <= maxVisibleButtons) {
      for (let i = 1; i <= safeTotalPages; i++) {
        pages.push(i);
      }
    } else {
      // Luôn có trang 1
      pages.push(1);

      if (safeCurrentPage > 3) {
        pages.push("...");
      }

      // Các trang lân cận trang hiện tại
      const start = Math.max(2, safeCurrentPage - 1);
      const end = Math.min(safeTotalPages - 1, safeCurrentPage + 1);

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (safeCurrentPage < safeTotalPages - 2) {
        pages.push("...."); // Dùng chuỗi khác biệt chút làm key
      }

      // Luôn có trang cuối
      pages.push(safeTotalPages);
    }

    return pages;
  };

  const navButtonClass =
    "inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200/80 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-xs shadow-xs transition-colors duration-200 hover:bg-slate-900 dark:hover:bg-slate-100 hover:text-white dark:hover:text-slate-900 hover:border-slate-900 dark:hover:border-slate-100 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-white dark:disabled:hover:bg-slate-800 disabled:hover:text-slate-600 dark:disabled:hover:text-slate-300 disabled:hover:border-slate-200/80 dark:disabled:hover:border-slate-700";

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 pt-5 border-t border-slate-200/80 dark:border-slate-700">
      {/* Hiển thị tổng số lượng bản ghi */}
      <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
        {t("admin.page_total", "{total} items").replace("{total}", String(totalItems ?? 0))}
      </span>

      {/* Cụm điều hướng trang: [Prev] [1] [2] [...] [Next] */}
      <div className="flex items-center gap-1.5 flex-wrap justify-center">
        <button
          type="button"
          disabled={disabled || safeCurrentPage <= 1}
          onClick={() => onPageChange(safeCurrentPage - 1)}
          className={navButtonClass}
          title={t("admin.page_prev", "Previous")}
        >
          <i className="fa-solid fa-chevron-left text-[10px]"></i>
          <span className="hidden sm:inline">{t("admin.page_prev", "Previous")}</span>
        </button>

        {getPageNumbers().map((item, idx) => {
          if (typeof item === "string") {
            return (
              <span
                key={`ellipsis-${idx}`}
                className="w-8 h-8 flex items-center justify-center text-xs font-bold text-slate-400 select-none"
              >
                ...
              </span>
            );
          }

          const isActive = item === safeCurrentPage;
          return (
            <button
              key={`page-${item}`}
              type="button"
              disabled={disabled}
              onClick={() => onPageChange(item)}
              className={`w-8 h-8 rounded-xl font-extrabold text-xs transition-all duration-200 flex items-center justify-center shadow-xs ${
                isActive
                  ? "bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-md scale-105"
                  : "bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/60"
              }`}
            >
              {item}
            </button>
          );
        })}

        <button
          type="button"
          disabled={disabled || safeCurrentPage >= safeTotalPages}
          onClick={() => onPageChange(safeCurrentPage + 1)}
          className={navButtonClass}
          title={t("admin.page_next", "Next")}
        >
          <span className="hidden sm:inline">{t("admin.page_next", "Next")}</span>
          <i className="fa-solid fa-chevron-right text-[10px]"></i>
        </button>
      </div>
    </div>
  );
}
