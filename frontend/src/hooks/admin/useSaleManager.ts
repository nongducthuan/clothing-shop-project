import { useState, useEffect } from "react";
import API from "../../services/apiClient";
import { useToast } from "../../context/ToastContext";

export default function useSaleManager() {
  const { showToast } = useToast();
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
      const response = await API.get(`/admin/sales/${id}/details?type=${type}`);
      setDetailModal({
        isOpen: true,
        data: response.data.details || [],
        title: type === 'category' ? "Danh mục đã chọn" : "Sản phẩm đã chọn"
      });
    } catch (error) {
      showToast("Không thể tải chi tiết", "error");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Bạn có chắc muốn xóa mục này?")) return;
    try {
      await API.delete(`/admin/sales/${id}`);
      showToast("Xóa thành công!", "success");
      fetchInitialData();
    } catch (error) {
      showToast("Xóa thất bại: " + (error.response?.data?.message || error.message), "error");
    }
  };

  const emptySaleForm = { name: "", name_vi: "", name_en: "", discount_percent: "", start_date: "", end_date: "", apply_scope: "all" };

  const handleEdit = (sale) => {
    setEditingId(sale.id);
    setFormData({
      name: sale.name || "",
      name_vi: sale.name_vi || sale.name || "",
      name_en: sale.name_en || sale.name || "",
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
    setFormData({ ...emptySaleForm });
    setApplyScope("all");
    setSelectedCategoryIds([]);
    setSelectedProductIds([]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const payload = {
      ...formData,
      name_vi: (formData.name_vi || "").trim() || (formData.name || "").trim(),
      name_en: (formData.name_en || "").trim() || (formData.name || "").trim(),
      apply_scope: applyScope,
      categoryIds: applyScope === "category" ? selectedCategoryIds : [],
      productIds: applyScope === "product" ? selectedProductIds : []
    };

    try {
      if (editingId) {
        await API.put(`/admin/sales/${editingId}`, payload);
        showToast("Cập nhật thành công!", "success");
      } else {
        await API.post("/admin/sales", payload);
        showToast("Tạo mới thành công!", "success");
      }
      // Reset form
      setEditingId(null);
      setFormData({ ...emptySaleForm });
      setApplyScope("all");
      setSelectedCategoryIds([]);
      setSelectedProductIds([]);
      fetchInitialData();
    } catch (error) {
      showToast("Error: " + error.message, "error");
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
