import { useState, useEffect } from "react";
import API from "../../services/apiClient";

export default function usePromotionManager() {
  const initialFormState = {
    name: "",
    description: "",
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

  const [promotions, setPromotions] = useState([]);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [searchBuyTerm, setSearchBuyTerm] = useState("");
  const [searchGetTerm, setSearchGetTerm] = useState("");
  const [formData, setFormData] = useState(initialFormState);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setIsLoading(true);
    try {
      const [promoRes, prodRes, catRes] = await Promise.all([
        API.get("/promotions/admin").catch(() => ({ data: [] })),
        API.get("/products?limit=1000").catch(() => ({ data: { data: [] } })),
        API.get("/categories").catch(() => ({ data: { data: [] } })),
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

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
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

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.buy_product_id || !formData.gift_product_id) {
      alert("Please select both a Buy Product and a Gift Product.");
      return;
    }

    try {
      setIsLoading(true);
      const payload = { ...formData };
      payload.max_gift_per_order = payload.max_gift_per_order || null;
      payload.total_gift_limit = payload.total_gift_limit || null;

      if (editingId) {
        await API.put(`/promotions/admin/${editingId}`, payload);
        alert("Promotion updated successfully!");
      } else {
        await API.post("/promotions/admin", payload);
        alert("Promotion created successfully!");
      }

      await fetchInitialData();
      handleResetForm();
    } catch (error) {
      console.error("Error saving promotion:", error);
      alert("Failed to save promotion. Please check console.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditClick = (promo) => {
    setEditingId(promo.id);
    setFormData({
      ...promo,
      start_date: formatForInputDate(promo.start_date),
      end_date: formatForInputDate(promo.end_date),
      is_stackable: Boolean(promo.is_stackable),
      max_gift_per_order: promo.max_gift_per_order || "",
      total_gift_limit: promo.total_gift_limit || "",
      priority: promo.priority || "0",
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteClick = async (id) => {
    if (!window.confirm("Are you sure you want to delete this promotion?")) return;
    try {
      await API.delete(`/promotions/admin/${id}`);
      setPromotions((prev) => prev.filter((p) => p.id !== id));
      if (editingId === id) handleResetForm();
    } catch (error) {
      console.error("Error deleting promotion:", error);
      alert("Failed to delete promotion.");
    }
  };

  // --- Helpers ---
  const formatDateDisplay = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-GB");
  };

  const formatForInputDate = (dateString) => {
    if (!dateString) return "";
    return new Date(dateString).toISOString().substring(0, 16);
  };

  const getProductName = (id) => {
    const product = products.find((p) => p.id === id);
    return product ? product.name : `Product #${id}`;
  };

  const getCategoryName = (categoryId) => {
    const category = categories.find((c) => c.id === categoryId);
    return category ? category.name : "Uncategorized";
  };

  const getProductStock = (product) => {
    return product.total_stock !== undefined ? product.total_stock : (product.stock || 0);
  };

  const getGenderStyle = (gender) => {
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
      (p.description || "").toLowerCase().includes(term) ||
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
