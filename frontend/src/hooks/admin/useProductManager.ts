import { useCallback } from "react";
import { useToast } from "../../context/ToastContext";
import { useLanguage } from "../../context/LanguageContext";
import { productApi } from "./product/productApi";
import { useProductCategories } from "./product/useProductCategories";
import { useProductFilters } from "./product/useProductFilters";
import { useProductList } from "./product/useProductList";
import { useProductForm } from "./product/useProductForm";
import type { FormEvent } from "react";

/**
 * Quản lý sản phẩm phía Admin. Hook này chỉ ghép các hook con lại:
 * - useProductCategories: tải danh mục
 * - useProductFilters   : bộ lọc + trang hiện tại
 * - useProductList      : tải 1 trang sản phẩm (phân trang chạy ở server)
 * - useProductForm      : form thêm/sửa + upload ảnh
 * và giữ 2 thao tác cần phối hợp nhiều phần: lưu (handleSubmit) và xoá (handleDelete).
 */
export default function useProductManager() {
  const token = localStorage.getItem("token");
  const { showToast } = useToast();
  const { t } = useLanguage();

  const { categories, fetchCategories } = useProductCategories();
  const filters = useProductFilters(categories);
  const { page, setPage } = filters;
  const { products, setProducts, pagination, loading, fetchProducts } = useProductList({
    page,
    filterGender: filters.filterGender,
    selectedCategoryIds: filters.selectedCategoryIds,
    debouncedSearch: filters.debouncedSearch,
  });
  const productForm = useProductForm();
  const { form, editingId, resetForm } = productForm;

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const cleanName = form.name.trim();
    if (!cleanName || !form.price || !form.category_id) {
      showToast(t("admin.product.toast_required_missing", "Required fields missing"), "error");
      return;
    }

    const categoryObj = categories.find((c: { id: number | string; gender: string }) => String(c.id) === String(form.category_id));
    if (categoryObj && categoryObj.gender !== form.gender) {
      showToast(t("admin.product.toast_gender_mismatch", "Gender mismatch with category!"), "error");
      return;
    }

    const descVi = (form.description_vi || "").trim();
    const descEn = (form.description_en || "").trim();
    const baseDesc = descVi || descEn;

    const payload = {
      ...form,
      name: cleanName,
      name_vi: (form.name_vi || "").trim() || cleanName,
      name_en: (form.name_en || "").trim() || cleanName,
      description: baseDesc,
      description_vi: descVi || baseDesc,
      description_en: descEn || baseDesc,
      import_price: form.import_price ? +form.import_price : 0,
      price: +form.price
    };

    try {
      const endpoint = editingId ? `/admin/products/${editingId}` : "/admin/products";
      const method = editingId ? productApi.put : productApi.post;
      await method(endpoint, payload, { headers: { Authorization: `Bearer ${token}` } });

      showToast(editingId ? t("admin.product.toast_updated", "Product updated!") : t("admin.product.toast_created", "Product created!"));
      resetForm();
      window.dispatchEvent(new Event("categories-updated"));
      fetchCategories();
      // Sản phẩm mới nằm ở đầu nhóm giới tính của nó (orderBy gender asc, id desc)
      // nên nhảy về trang 1 để admin thấy ngay kết quả vừa tạo.
      if (!editingId && page !== 1) setPage(1);
      else await fetchProducts();
    } catch {
      showToast(t("admin.product.toast_save_failed", "Save failed"), "error");
    }
  };

  const handleDelete = useCallback(async (id: number) => {
    if (!window.confirm(t("admin.product.confirm_delete", "Delete this product?"))) return;
    try {
      await productApi.delete(`/admin/products/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      setProducts((prev) => prev.filter((p) => p.id !== id));
      showToast(t("admin.product.toast_deleted", "Product deleted"));
      // Xoá bản ghi cuối cùng của trang cuối → lùi 1 trang, nếu không bảng sẽ trống
      // dù dữ liệu vẫn còn ở trang trước.
      if (page > 1 && products.length === 1) setPage((prev) => prev - 1);
      else fetchProducts();
    } catch {
      showToast(t("admin.product.toast_delete_failed", "Delete failed"), "error");
    }
  }, [token, showToast, t, page, setPage, products.length, setProducts, fetchProducts]);

  return {
    state: {
      products,
      categories,
      uniqueCategoriesForFilter: filters.uniqueCategoriesForFilter,
      uploading: productForm.uploading,
      loading,
      filterGender: filters.filterGender,
      filterCategory: filters.filterCategory,
      searchTerm: filters.searchTerm,
      editingId,
      form,
      mobileFormOpen: productForm.mobileFormOpen,
      pagination
    },
    actions: {
      setFilterGender: filters.changeFilterGender,
      setFilterCategory: filters.changeFilterCategory,
      setSearchTerm: filters.changeSearchTerm,
      setPage,
      setForm: productForm.setForm,
      setMobileFormOpen: productForm.setMobileFormOpen,
      handleFileUpload: productForm.handleFileUpload,
      handleSubmit,
      handleEdit: productForm.handleEdit,
      handleDelete,
      resetForm
    }
  };
}
