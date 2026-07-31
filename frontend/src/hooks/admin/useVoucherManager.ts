import { useState, useEffect } from "react";
import API from "../../services/apiClient"; // Adjust path as needed

export default function useVoucherManager() {
  const [vouchers, setVouchers] = useState([]);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState([]);
  const [selectedProductIds, setSelectedProductIds] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [applyScope, setApplyScope] = useState("all");
  const [detailModal, setDetailModal] = useState({
    isOpen: false,
    data: [],
    title: ""
  });
  const [formData, setFormData] = useState({
    code: "",
    description: "",
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
        API.get("/vouchers"),
        API.get("/products?limit=1000"),
        API.get("/categories")
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

  const toggleCategory = (id) => {
    setSelectedCategoryIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const toggleProduct = (id) => {
    setSelectedProductIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this voucher?")) return;
    try {
      await API.delete(`/vouchers/${id}`);
      alert("Deleted successfully!");
      fetchInitialData();
    } catch (error) {
      alert("Delete failed: " + (error.response?.data?.message || error.message));
    }
  };

  const handleShowDetail = async (id, scope) => {
    if (scope === 'all') return;
    try {
      const response = await API.get(`/vouchers/${id}/details`);
      setDetailModal({
        isOpen: true,
        data: response.data.details || [],
        title: scope === 'category' ? "Selected Categories" : "Selected Products"
      });
    } catch (error) {
      console.error("Error fetching voucher details:", error);
    }
  };

  const handleSubmit = async (e) => {
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
      await API.post("/vouchers", payload);
      alert("Create voucher successfully! 🎉");
      setFormData({
        code: "",
        description: "",
        discount_percent: "",
        max_discount_amount: "",
        min_order_value: "",
        usage_limit: "",
        start_date: "",
        end_date: "",
        apply_scope: "all"
      });
      setApplyScope("all");
      setSelectedCategoryIds([]);
      setSelectedProductIds([]);
      fetchInitialData();
    } catch (error) {
      alert("Error: " + error.message);
    }
  };

  return {
    vouchers,
    products,
    categories,
    isLoading,
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
    handleShowDetail,
    handleSubmit
  };
}
