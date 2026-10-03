import { useState, useEffect, useMemo, useCallback } from "react";
import { useToast } from "../../context/ToastContext";
import { useLanguage } from "../../context/LanguageContext";

const API_URL = import.meta.env.VITE_API_URL;

/** Số sản phẩm mỗi trang — khớp mặc định của GET /admin/products (backend chặn tối đa 100). */
const PAGE_SIZE = 50;

interface ApiOptions extends RequestInit {
  headers?: Record<string, string>;
}

const API = {
  get: async (endpoint: string, options: ApiOptions = {}) => {
    const res = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      method: "GET",
      headers: { "Content-Type": "application/json", ...options.headers }
    });
    if (!res.ok) throw new Error("API Error");
    return { data: await res.json() };
  },
  post: async (endpoint: string, body: unknown, options: ApiOptions = {}) => {
    const isFormData = body instanceof FormData;
    const headers: Record<string, string> = { ...options.headers };
    if (!isFormData) headers["Content-Type"] = "application/json";

    const res = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      method: "POST",
      headers,
      body: isFormData ? body : JSON.stringify(body),
    });
    if (!res.ok) throw new Error("API Error");
    return { data: await res.json() };
  },
  put: async (endpoint: string, body: unknown, options: ApiOptions = {}) => {
    const res = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      method: "PUT",
      headers: { "Content-Type": "application/json", ...options.headers },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error("API Error");
    return { data: await res.json() };
  },
  delete: async (endpoint: string, options: ApiOptions = {}) => {
    const res = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      method: "DELETE",
      headers: { ...options.headers }
    });
    if (!res.ok) throw new Error("API Error");
    return { data: await res.json() };
  }
};

export default function useProductManager() {
  const token = localStorage.getItem("token");
  const { showToast } = useToast();
  const { t } = useLanguage();

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [uploading, setUploading] = useState(false);

  const [filterGender, setFilterGender] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // ─── PHÂN TRANG CHẠY Ở SERVER ──────────────────────────────────────────────
  // Server lọc + trả từng trang (xem GET /admin/products).
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, totalProducts: 0 });
  const [loading, setLoading] = useState(false);

  // Gõ tìm kiếm liên tục không nên bắn request mỗi ký tự => chờ 300ms (giống useUserManager).
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm.trim()), 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  /**
   * Lọc danh mục theo TÊN: "Áo thun" tồn tại riêng cho nam/nữ nên chọn 1 danh mục phải
   * gom cả các danh mục cùng tên. Trước đây client tự gom; giờ gửi sẵn nhóm id lên server.
   */
  const selectedCategoryIds = useMemo(() => {
    if (filterCategory === "all") return "";
    const target = categories.find((c) => String(c.id) === String(filterCategory));
    if (!target) return String(filterCategory);
    const nameKey = (target.name || "").trim().toLowerCase();
    return categories
      .filter((c) => (c.name || "").trim().toLowerCase() === nameKey)
      .map((c) => c.id)
      .join(",");
  }, [categories, filterCategory]);

  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    name: "",
    name_vi: "",
    name_en: "",
    description_vi: "",
    description_en: "",
    import_price: "",
    price: "",
    image_url: "",
    gender: "",
    category_id: "",
  });

  const [mobileFormOpen, setMobileFormOpen] = useState(false);

  const resetForm = useCallback(() => {
    setEditingId(null);
    setForm({ name: "", name_vi: "", name_en: "", description_vi: "", description_en: "", import_price: "", price: "", image_url: "", gender: "", category_id: "" });
    setMobileFormOpen(false);
  }, []);

  /** Danh mục chỉ cần tải 1 lần (không phụ thuộc trang/bộ lọc) — tách khỏi fetch sản phẩm. */
  const fetchCategories = useCallback(async () => {
    try {
      const catRes = await API.get("/categories");
      setCategories(Array.isArray(catRes.data) ? catRes.data : catRes.data?.data || []);
    } catch (err: unknown) {
      console.error("Category Load Error:", err);
    }
  }, []);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE) });
      if (filterGender !== "all") params.set("gender", filterGender);
      if (selectedCategoryIds) params.set("category_ids", selectedCategoryIds);
      if (debouncedSearch) params.set("search", debouncedSearch);

      const prodRes = await API.get(`/admin/products?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const payload = prodRes.data;

      setProducts(Array.isArray(payload?.data) ? payload.data : []);
      setPagination({
        currentPage: payload?.currentPage || 1,
        totalPages: payload?.totalPages || 1,
        totalProducts: payload?.totalProducts ?? 0,
      });
    } catch (err: unknown) {
      console.error("Data Load Error:", err);
      showToast(t("admin.product.toast_load_failed", "Failed to load data"), "error");
    } finally {
      setLoading(false);
    }
  }, [token, showToast, t, page, filterGender, selectedCategoryIds, debouncedSearch]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    setFilterCategory("all");
  }, [filterGender]);

  // ─── ĐỔI BỘ LỌC → VỀ TRANG 1 ───────────────────────────────────────────────
  // Gộp setTrang vào cùng 1 lần render với setBộ lọc (React batch) nên chỉ bắn 1
  // request duy nhất; nếu tách thành effect riêng sẽ fetch trang cũ trước rồi mới fetch trang 1.
  const changeFilterGender = useCallback((value) => {
    setFilterGender(value);
    setPage(1);
  }, []);

  const changeFilterCategory = useCallback((value) => {
    setFilterCategory(value);
    setPage(1);
  }, []);

  const changeSearchTerm = useCallback((value) => {
    setSearchTerm(value);
    setPage(1);
  }, []);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("image", file);

    try {
      const response = await API.post("/upload", formData);
      setForm((prev) => ({ ...prev, image_url: response.data.url }));
      showToast(t("admin.product.toast_image_uploaded", "Image uploaded successfully"));
    } catch {
      showToast(t("admin.product.toast_image_upload_failed", "Image upload failed"), "error");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
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
      const method = editingId ? API.put : API.post;
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

  const handleEdit = useCallback((p) => {
    setForm({
      name: p.name || "",
      name_vi: p.name_vi || p.name || "",
      name_en: p.name_en || p.name || "",
      description_vi: p.description_vi || p.description || "",
      description_en: p.description_en || p.description || "",
      import_price: p.import_price || "",
      price: p.price,
      image_url: p.image_url || "",
      gender: p.gender,
      category_id: p.category_id,
    });
    setEditingId(p.id);
    setMobileFormOpen(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const handleDelete = useCallback(async (id) => {
    if (!window.confirm(t("admin.product.confirm_delete", "Delete this product?"))) return;
    try {
      await API.delete(`/admin/products/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      setProducts((prev: { id: number }[]) => prev.filter((p) => p.id !== id));
      showToast(t("admin.product.toast_deleted", "Product deleted"));
      // Xoá bản ghi cuối cùng của trang cuối → lùi 1 trang, nếu không bảng sẽ trống
      // dù dữ liệu vẫn còn ở trang trước.
      if (page > 1 && products.length === 1) setPage((prev) => prev - 1);
      else fetchProducts();
    } catch {
      showToast(t("admin.product.toast_delete_failed", "Delete failed"), "error");
    }
  }, [token, showToast, t, page, products.length, fetchProducts]);

  const uniqueCategoriesForFilter = useMemo(() => {
    const activeList = filterGender === "all"
      ? categories
      : categories.filter(c => c.gender === filterGender);

    const uniqueList = [];
    const seenNames = new Set();

    activeList.forEach(cat => {
      const nameKey = cat.name.trim().toLowerCase();
      if (!seenNames.has(nameKey)) {
        seenNames.add(nameKey);
        uniqueList.push(cat);
      }
    });
    return uniqueList;
  }, [categories, filterGender]);

  // Lọc + sắp xếp giờ chạy ở server (xem GET /admin/products) nên `products` đã là
  // đúng trang, đúng bộ lọc, đúng thứ tự Nam → Nữ → Unisex mà không cần xử lý thêm.

  return {
    state: {
      products,
      categories,
      uniqueCategoriesForFilter,
      uploading,
      loading,
      filterGender,
      filterCategory,
      searchTerm,
      editingId,
      form,
      mobileFormOpen,
      pagination
    },
    actions: {
      setFilterGender: changeFilterGender,
      setFilterCategory: changeFilterCategory,
      setSearchTerm: changeSearchTerm,
      setPage,
      setForm,
      setMobileFormOpen,
      handleFileUpload,
      handleSubmit,
      handleEdit,
      handleDelete,
      resetForm
    }
  };
}
