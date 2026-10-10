import { useState, useEffect } from "react";
import API from "../../services/apiClient"; // Adjust path as needed
import { useToast } from "../../context/ToastContext";
import { useLanguage } from "../../context/LanguageContext";
import type { FormEvent } from "react";

interface CatalogItem { id: number; name: string; name_vi?: string; name_en?: string; gender?: string; category_id?: number; [key: string]: unknown }
type Scope = "all" | "category" | "product";
export interface VoucherRecord { id: number; code: string; discount_percent: number | string; max_discount_amount?: number | string; min_order_value?: number | string; usage_limit?: number | string | null; start_date?: string; end_date?: string; apply_scope?: Scope; [key: string]: unknown }
export interface VoucherForm { code: string; discount_percent: string | number; max_discount_amount: string | number; min_order_value: string | number; usage_limit: string | number; start_date: string; end_date: string; apply_scope: Scope }

export default function useVoucherManager() {
  const { showToast } = useToast();
  const { t, translateApiMessage } = useLanguage();
  const [vouchers, setVouchers] = useState<VoucherRecord[]>([]);
  const [products, setProducts] = useState<CatalogItem[]>([]);
  const [categories, setCategories] = useState<CatalogItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<number[]>([]);
  const [selectedProductIds, setSelectedProductIds] = useState<number[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [applyScope, setApplyScope] = useState<Scope>("all");
  const [detailModal, setDetailModal] = useState<{ isOpen: boolean; data: CatalogItem[]; title: string }>({
    isOpen: false,
    data: [],
    title: ""
  });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<VoucherForm>({
    code: "",
    discount_percent: "",
    max_discount_amount: "",
    min_order_value: "",
    usage_limit: "",
    start_date: "",
    end_date: "",
    apply_scope: "all"
  });

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setIsLoading(true);
    try {
      const [vouchRes, prodRes, catRes] = await Promise.all([
        API.get("/admin/vouchers"),
        API.get("/admin/products?limit=1000"),
        API.get("/admin/categories")
      ]);
      setVouchers([...(vouchRes.data?.data || vouchRes.data || [])]);
      setProducts([...(prodRes.data?.products || prodRes.data?.data || prodRes.data || [])]);
      setCategories([...(catRes.data?.data || catRes.data || [])]);
    } catch (error) {
      console.error("Error fetching voucher data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleCategory = (id: number) => {
    setSelectedCategoryIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const toggleProduct = (id: number) => {
    setSelectedProductIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm(t("admin.confirm_delete", "Are you sure you want to delete this item?"))) return;
    try {
      await API.delete(`/admin/vouchers/${id}`);
      showToast(t("admin.toast_deleted", "Đã xóa thành công!"), "success");
      fetchInitialData();
    } catch (error) {
      const apiError = error as { response?: { data?: { message?: string } }; message?: string };
      showToast(t("admin.toast_delete_failed", "Xóa thất bại: {error}").replace("{error}", translateApiMessage(apiError.response?.data?.message) || apiError.message || ""), "error");
    }
  };

  const handleShowDetail = async (id: number, scope: Scope) => {
    if (scope === 'all') return;
    try {
      const response = await API.get(`/admin/vouchers/${id}/details`);
      setDetailModal({
        isOpen: true,
        data: response.data.details || [],
        title: scope === 'category' ? t("admin.selected_categories") : t("admin.selected_products")
      });
    } catch (error) {
      console.error("Error fetching voucher details:", error);
    }
  };

  const emptyVoucherForm: VoucherForm = {
    code: "", discount_percent: "", max_discount_amount: "",
    min_order_value: "", usage_limit: "", start_date: "", end_date: "", apply_scope: "all"
  };

  const handleEdit = (voucher: VoucherRecord) => {
    setEditingId(voucher.id);
    setFormData({
      code: voucher.code || "",
      discount_percent: String(voucher.discount_percent),
      max_discount_amount: voucher.max_discount_amount ? String(voucher.max_discount_amount) : "",
      min_order_value: voucher.min_order_value ? String(voucher.min_order_value) : "",
      usage_limit: voucher.usage_limit ? String(voucher.usage_limit) : "",
      start_date: voucher.start_date ? voucher.start_date.slice(0, 16) : "",
      end_date: voucher.end_date ? voucher.end_date.slice(0, 16) : "",
      apply_scope: voucher.apply_scope || "all"
    });
    setApplyScope(voucher.apply_scope || "all");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setFormData({ ...emptyVoucherForm });
    setApplyScope("all");
    setSelectedCategoryIds([]);
    setSelectedProductIds([]);
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const payload = {
      ...formData,
      start_date: formData.start_date || null,
      end_date: formData.end_date || null,
      apply_scope: applyScope,
      productIds: applyScope === "product" ? selectedProductIds : [],
      categoryIds: applyScope === "category" ? selectedCategoryIds : [],
    };

    try {
      if (editingId) {
        await API.put(`/admin/vouchers/${editingId}`, payload);
        showToast(t("admin.toast_voucher_updated", "Cập nhật mã giảm giá thành công!"), "success");
      } else {
        await API.post("/admin/vouchers", payload);
        showToast(t("admin.toast_voucher_created", "Tạo mã giảm giá thành công!"), "success");
      }
      setEditingId(null);
      setFormData({ ...emptyVoucherForm });
      setApplyScope("all");
      setSelectedCategoryIds([]);
      setSelectedProductIds([]);
      fetchInitialData();
    } catch (error) {
      const apiError = error as { response?: { data?: { message?: string } }; message?: string };
      showToast(t("admin.toast_error", "Error: {error}").replace("{error}", translateApiMessage(apiError.response?.data?.message) || apiError.message || ""), "error");
    }
  };

  return {
    vouchers,
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
    handleDelete,
    handleEdit,
    handleCancelEdit,
    handleShowDetail,
    handleSubmit
  };
}
