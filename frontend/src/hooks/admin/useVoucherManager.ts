import { useState, useEffect } from "react";
import API from "../../services/apiClient"; // Adjust path as needed
import { useToast } from "../../context/ToastContext";

export default function useVoucherManager() {
  const { showToast } = useToast();
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
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
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
    if (!window.confirm("Bạn có chắc muốn xóa mã giảm giá này?")) return;
    try {
      await API.delete(`/admin/vouchers/${id}`);
      showToast("Xóa thành công!", "success");
      fetchInitialData();
    } catch (error) {
      showToast("Xóa thất bại: " + (error.response?.data?.message || error.message), "error");
    }
  };

  const handleShowDetail = async (id, scope) => {
    if (scope === 'all') return;
    try {
      const response = await API.get(`/admin/vouchers/${id}/details`);
      setDetailModal({
        isOpen: true,
        data: response.data.details || [],
        title: scope === 'category' ? "Danh mục đã chọn" : "Sản phẩm đã chọn"
      });
    } catch (error) {
      console.error("Error fetching voucher details:", error);
    }
  };

  const emptyVoucherForm = {
    code: "", discount_percent: "", max_discount_amount: "",
    min_order_value: "", usage_limit: "", start_date: "", end_date: "", apply_scope: "all"
  };

  const handleEdit = (voucher) => {
    setEditingId(voucher.id);
    setFormData({
      code: voucher.code || "",
      discount_percent: voucher.discount_percent,
      max_discount_amount: voucher.max_discount_amount || "",
      min_order_value: voucher.min_order_value || "",
      usage_limit: voucher.usage_limit || "",
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
      if (editingId) {
        await API.put(`/admin/vouchers/${editingId}`, payload);
        showToast("Cập nhật mã giảm giá thành công!", "success");
      } else {
        await API.post("/admin/vouchers", payload);
        showToast("Tạo mã giảm giá thành công!", "success");
      }
      setEditingId(null);
      setFormData({ ...emptyVoucherForm });
      setApplyScope("all");
      setSelectedCategoryIds([]);
      setSelectedProductIds([]);
      fetchInitialData();
    } catch (error) {
      showToast("Error: " + error.message, "error");
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
