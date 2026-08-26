import { useState, useEffect } from "react";
import API from "../../services/apiClient";

export default function useSaleManager() {
  const [sales, setSales] = useState([]);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const [selectedCategoryIds, setSelectedCategoryIds] = useState([]);
  const [selectedProductIds, setSelectedProductIds] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [applyScope, setApplyScope] = useState("all");

  const [detailModal, setDetailModal] = useState({ isOpen: false, data: [], title: "" });
  const [editingId, setEditingId] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
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

  const toggleCategory = (catId) => {
    setSelectedCategoryIds(prev =>
      prev.includes(catId) ? prev.filter(id => id !== catId) : [...prev, catId]
    );
  };

  const toggleProduct = (prodId) => {
    setSelectedProductIds(prev =>
      prev.includes(prodId) ? prev.filter(id => id !== prodId) : [...prev, prodId]
    );
  };

  const handleShowDetail = async (id, type) => {
    try {
      const response = await API.get(`/sales/admin/${id}/details?type=${type}`);
      setDetailModal({
        isOpen: true,
        data: response.data.details || [],
        title: type === 'category' ? "Selected Categories" : "Selected Products"
      });
    } catch (error) {
      alert("Could not load details");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this item?")) return;
    try {
      await API.delete(`/sales/admin/${id}`);
      alert("Deleted successfully!");
      fetchInitialData();
    } catch (error) {
      alert("Delete failed: " + (error.response?.data?.message || error.message));
    }
  };

  const handleEdit = (sale) => {
    setEditingId(sale.id);
    setFormData({
      name: sale.name,
      discount_percent: sale.discount_percent,
      start_date: sale.start_date ? sale.start_date.slice(0, 16) : "",
      end_date: sale.end_date ? sale.end_date.slice(0, 16) : "",
      apply_scope: sale.apply_scope || "all"
    });
    setApplyScope(sale.apply_scope || "all");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setFormData({ name: "", discount_percent: "", start_date: "", end_date: "", apply_scope: "all" });
    setApplyScope("all");
    setSelectedCategoryIds([]);
    setSelectedProductIds([]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const payload = {
      ...formData,
      apply_scope: applyScope,
      categoryIds: applyScope === "category" ? selectedCategoryIds : [],
      productIds: applyScope === "product" ? selectedProductIds : []
    };

    try {
      if (editingId) {
        await API.put(`/sales/admin/${editingId}`, payload);
        alert("Updated Successfully!");
      } else {
        await API.post("/sales/admin", payload);
        alert("Created Successfully!");
      }
      // Reset form
      setEditingId(null);
      setFormData({ name: "", discount_percent: "", start_date: "", end_date: "", apply_scope: "all" });
      setApplyScope("all");
      setSelectedCategoryIds([]);
      setSelectedProductIds([]);
      fetchInitialData();
    } catch (error) {
      alert("Error: " + error.message);
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
