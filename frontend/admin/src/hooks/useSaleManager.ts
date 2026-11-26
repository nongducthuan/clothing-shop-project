import { useState, useEffect, useRef } from "react";
import API from "@shop/shared/services/apiClient";
import { useToast } from "@shop/shared/context/ToastContext";
import { useLanguage } from "@shop/shared/context/LanguageContext";
import { toLocalDateTimeInput, fromLocalDateTimeInput } from "@shop/shared/utils/dateUtils";
import type { FormEvent } from "react";

interface CatalogItem { id: number; name: string; name_vi?: string; name_en?: string; gender?: string; category_id?: number; [key: string]: unknown }
export interface SaleRecord { id: number; name: string; name_vi?: string; name_en?: string; discount_percent: number | string; start_date: string; end_date: string; apply_scope?: "all" | "category" | "product"; productIds?: number[]; categoryIds?: number[]; [key: string]: unknown }
export interface SaleForm { name: string; name_vi: string; name_en: string; discount_percent: string | number; start_date: string; end_date: string; apply_scope: "all" | "category" | "product" }

export default function useSaleManager() {
  const { showToast } = useToast();
  const { t, translateApiMessage } = useLanguage();
  const [sales, setSales] = useState<SaleRecord[]>([]);
  const [products, setProducts] = useState<CatalogItem[]>([]);
  const [categories, setCategories] = useState<CatalogItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const [selectedCategoryIds, setSelectedCategoryIds] = useState<number[]>([]);
  const [selectedProductIds, setSelectedProductIds] = useState<number[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [applyScope, setApplyScope] = useState<"all" | "category" | "product">("all");

  const [detailModal, setDetailModal] = useState<{ isOpen: boolean; data: CatalogItem[]; title: string }>({ isOpen: false, data: [], title: "" });
  const [editingId, setEditingId] = useState<number | null>(null);
  const isSubmittingRef = useRef(false);

  const [formData, setFormData] = useState<SaleForm>({
    name: "",
    name_vi: "",
    name_en: "",
    discount_percent: "",
    start_date: "",
    end_date: "",
    apply_scope: "all"
  });

  const fetchInitialData = async () => {
    setIsLoading(true);
    try {
      const [salesRes, prodRes, catRes] = await Promise.all([
        API.get("/admin/sales"),
        API.get("/admin/products", { params: { limit: 1000 } }),
        API.get("/admin/categories")
      ]);
      setSales(salesRes.data?.data || salesRes.data || []);
      setProducts(prodRes.data?.products || prodRes.data?.data || prodRes.data || []);
      setCategories(catRes.data?.data || catRes.data || []);
    } catch (error) {
      console.error("Error fetching initial data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  const toggleCategory = (catId: number) => {
    setSelectedCategoryIds(prev =>
      prev.includes(catId) ? prev.filter(id => id !== catId) : [...prev, catId]
    );
  };

  const toggleProduct = (prodId: number) => {
    setSelectedProductIds(prev =>
      prev.includes(prodId) ? prev.filter(id => id !== prodId) : [...prev, prodId]
    );
  };

  const handleShowDetail = async (id: number, type: "category" | "product") => {
    try {
      const response = await API.get(`/admin/sales/${id}/details?type=${type}`);
      setDetailModal({
        isOpen: true,
        data: response.data.details || [],
        title: type === 'category' ? t("admin.selected_categories") : t("admin.selected_products")
      });
    } catch {
      showToast(t("admin.toast_details_failed", "Không thể tải chi tiết"), "error");
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm(t("admin.confirm_delete", "Are you sure you want to delete this item?"))) return;
    try {
      await API.delete(`/admin/sales/${id}`);
      if (editingId === id) handleCancelEdit();
      showToast(t("admin.toast_deleted", "Đã xóa thành công!"), "success");
      fetchInitialData();
    } catch (error) {
      const apiError = error as { response?: { data?: { message?: string } }; message?: string };
      showToast(t("admin.toast_delete_failed", "Xóa thất bại: {error}").replace("{error}", translateApiMessage(apiError.response?.data?.message) || apiError.message || ""), "error");
    }
  };

  const emptySaleForm: SaleForm = { name: "", name_vi: "", name_en: "", discount_percent: "", start_date: "", end_date: "", apply_scope: "all" };

  const handleEdit = (sale: SaleRecord) => {
    const scope = sale.apply_scope || "all";
    setEditingId(sale.id);
    setFormData({
      name: sale.name || "",
      name_vi: sale.name_vi || sale.name || "",
      name_en: sale.name_en || sale.name || "",
      discount_percent: String(sale.discount_percent),
      start_date: toLocalDateTimeInput(sale.start_date),
      end_date: toLocalDateTimeInput(sale.end_date),
      apply_scope: scope
    });
    setApplyScope(scope);
    setSelectedCategoryIds(scope === "category" && Array.isArray(sale.categoryIds) ? sale.categoryIds.map(Number) : []);
    setSelectedProductIds(scope === "product" && Array.isArray(sale.productIds) ? sale.productIds.map(Number) : []);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setFormData({ ...emptySaleForm });
    setApplyScope("all");
    setSelectedCategoryIds([]);
    setSelectedProductIds([]);
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;

    const payload = {
      ...formData,
      start_date: fromLocalDateTimeInput(formData.start_date) || "",
      end_date: fromLocalDateTimeInput(formData.end_date) || "",
      name_vi: (formData.name_vi || "").trim() || (formData.name || "").trim(),
      name_en: (formData.name_en || "").trim() || (formData.name || "").trim(),
      apply_scope: applyScope,
      categoryIds: applyScope === "category" ? selectedCategoryIds : [],
      productIds: applyScope === "product" ? selectedProductIds : []
    };

    try {
      if (editingId) {
        await API.put(`/admin/sales/${editingId}`, payload);
        showToast(t("admin.toast_updated", "Cập nhật thành công!"), "success");
      } else {
        await API.post("/admin/sales", payload);
        showToast(t("admin.toast_created", "Tạo mới thành công!"), "success");
      }
      setEditingId(null);
      setFormData({ ...emptySaleForm });
      setApplyScope("all");
      setSelectedCategoryIds([]);
      setSelectedProductIds([]);
      fetchInitialData();
    } catch (error) {
      const apiError = error as { response?: { data?: { message?: string } }; message?: string };
      showToast(t("admin.toast_error", "Error: {error}").replace("{error}", translateApiMessage(apiError.response?.data?.message) || apiError.message || ""), "error");
    } finally {
      isSubmittingRef.current = false;
    }
  };

  return {
    sales,
    products,
    categories,
    isLoading,
    editingId,
    selectedCategoryIds,
    selectedProductIds,
    searchTerm,
    setSearchTerm,
    applyScope,
    setApplyScope,
    detailModal,
    setDetailModal,
    formData,
    setFormData,
    toggleCategory,
    toggleProduct,
    handleShowDetail,
    handleDelete,
    handleEdit,
    handleCancelEdit,
    handleSubmit
  };
}
