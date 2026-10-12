import { useState, useEffect } from "react";
import type { ChangeEvent, FormEvent } from "react";
import type { PromotionProduct } from "../../components/admin/promotions/PromotionProductPair";
import type { PromotionFormData } from "../../components/admin/promotions/PromotionForm";
import API from "../../services/apiClient";
import { useToast } from "../../context/ToastContext";
import { useLanguage } from "../../context/LanguageContext";

interface CatalogProduct extends PromotionProduct { name_vi?: string; name_en?: string; total_stock?: number; stock?: number }
interface CatalogCategory { id: number; name: string; name_vi?: string; name_en?: string; [key: string]: unknown }
interface PromotionRecord {
  id: number; name?: string; name_vi?: string; name_en?: string; status?: string;
  buy_product_id: number | string; buy_quantity: number; gift_product_id: number | string; gift_quantity: number;
  start_date?: string | null; end_date?: string | null; is_stackable?: boolean;
  max_gift_per_order?: string | number | null; total_gift_limit?: string | number | null;
  priority?: string | number; [key: string]: unknown;
}

export default function usePromotionManager() {
  const { showToast } = useToast();
  const { getLocalizedText, t } = useLanguage();
  const initialFormState = {
    name: "",
    name_vi: "",
    name_en: "",
    buy_product_id: "",
    buy_quantity: "",
    gift_product_id: "",
    gift_quantity: "",
    start_date: "",
    end_date: "",
    max_gift_per_order: "",
    total_gift_limit: "",
    priority: "0",
    is_stackable: false,
  };

  const [promotions, setPromotions] = useState<PromotionRecord[]>([]);
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [categories, setCategories] = useState<CatalogCategory[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [searchBuyTerm, setSearchBuyTerm] = useState("");
  const [searchGetTerm, setSearchGetTerm] = useState("");
  const [formData, setFormData] = useState<PromotionFormData>({ ...initialFormState });

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setIsLoading(true);
    try {
      const [promoRes, prodRes, catRes] = await Promise.all([
        API.get("/admin/promotions").catch(() => ({ data: [] })),
        API.get("/admin/products?limit=1000").catch(() => ({ data: { data: [] } })),
        API.get("/admin/categories").catch(() => ({ data: { data: [] } })),
      ]);

      setPromotions(promoRes.data || []);
      setProducts(prodRes.data?.data || prodRes.data || []);
      setCategories(catRes.data?.data || catRes.data || []);
    } catch (error) {
      console.error("Failed to fetch initial data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = e.target instanceof HTMLInputElement ? e.target.checked : false;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleResetForm = () => {
    setEditingId(null);
    setFormData(initialFormState);
    setSearchBuyTerm("");
    setSearchGetTerm("");
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!formData.buy_product_id || !formData.gift_product_id) {
      showToast(t("admin.promotion.toast_select_both", "Please select both a Buy Product and a Gift Product."), "warning");
      return;
    }

    try {
      setIsLoading(true);
      const payload = {
        ...formData,
        name_vi: (formData.name_vi || "").trim?.() || formData.name_vi || formData.name || "",
        name_en: (formData.name_en || "").trim?.() || formData.name_en || formData.name || "",
        max_gift_per_order: formData.max_gift_per_order || null,
        total_gift_limit: formData.total_gift_limit || null,
      };

      if (editingId) {
        await API.put(`/admin/promotions/${editingId}`, payload);
        showToast(t("admin.promotion.toast_updated", "Promotion updated successfully!"), "success");
      } else {
        await API.post("/admin/promotions", payload);
        showToast(t("admin.promotion.toast_created", "Promotion created successfully!"), "success");
      }

      await fetchInitialData();
      handleResetForm();
    } catch (error) {
      console.error("Error saving promotion:", error);
      showToast(t("admin.promotion.toast_save_failed", "Failed to save promotion. Please check console."), "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditClick = (promo: PromotionRecord) => {
    setEditingId(promo.id);
    setFormData({
      ...initialFormState,
      buy_product_id: String(promo.buy_product_id),
      buy_quantity: String(promo.buy_quantity),
      gift_product_id: String(promo.gift_product_id),
      gift_quantity: String(promo.gift_quantity),
      name: promo.name || "",
      name_vi: promo.name_vi || promo.name || "",
      name_en: promo.name_en || promo.name || "",
      start_date: formatForInputDate(promo.start_date),
      end_date: formatForInputDate(promo.end_date),
      is_stackable: Boolean(promo.is_stackable),
      max_gift_per_order: String(promo.max_gift_per_order || ""),
      total_gift_limit: String(promo.total_gift_limit || ""),
      priority: String(promo.priority || "0"),
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteClick = async (id: number) => {
    if (!window.confirm(t("admin.confirm_delete", "Are you sure you want to delete this item?"))) return;
    try {
      await API.delete(`/admin/promotions/${id}`);
      setPromotions((prev) => prev.filter((p) => p.id !== id));
      if (editingId === id) handleResetForm();
      showToast(t("admin.promotion.toast_deleted", "Promotion deleted."), "success");
    } catch (error) {
      console.error("Error deleting promotion:", error);
      showToast(t("admin.promotion.toast_delete_failed", "Failed to delete promotion."), "error");
    }
  };

  const formatDateDisplay = (dateString?: string | null) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-GB");
  };

  const formatForInputDate = (dateString?: string | null) => {
    if (!dateString) return "";
    return new Date(dateString).toISOString().substring(0, 16);
  };

  const getProductName = (id: number | string) => {
    const product = products.find((p) => p.id === id);
    return product ? (getLocalizedText(product, "name") || product.name) : t("admin.product_id_fallback").replace("{id}", String(id));
  };

  const getCategoryName = (categoryId: number) => {
    const category = categories.find((c) => c.id === categoryId);
    return category ? (getLocalizedText(category, "name") || category.name) : t("admin.uncategorized");
  };

  const getProductStock = (product: CatalogProduct) => {
    return product.total_stock !== undefined ? product.total_stock : (product.stock || 0);
  };

  const getGenderStyle = (gender?: string) => {
    const normalizedGender = (gender || "").toLowerCase();
    if (normalizedGender === "men" || normalizedGender === "male") return "bg-blue-100 text-blue-600";
    if (normalizedGender === "women" || normalizedGender === "female") return "bg-pink-100 text-pink-600";
    return "bg-emerald-100 text-emerald-600";
  };

  const filteredPromotions = promotions.filter((p) => {
    if (!searchTerm) return true; // Nếu không nhập gì thì hiện tất cả
    const term = searchTerm.toLowerCase();
    return (
      (p.name || "").toLowerCase().includes(term) ||
      (p.name_vi || "").toLowerCase().includes(term) ||
      (p.name_en || "").toLowerCase().includes(term) ||
      (p.status || "").toLowerCase().includes(term)
    );
  });

  return {
    state: {
      filteredPromotions,
      products,
      isLoading,
      editingId,
      searchTerm,
      searchBuyTerm,
      searchGetTerm,
      formData
    },
    actions: {
      setSearchTerm,
      setSearchBuyTerm,
      setSearchGetTerm,
      setFormData,
      handleInputChange,
      handleResetForm,
      handleSubmit,
      handleEditClick,
      handleDeleteClick
    },
    helpers: {
      formatDateDisplay,
      getProductName,
      getCategoryName,
      getProductStock,
      getGenderStyle
    }
  };
}
