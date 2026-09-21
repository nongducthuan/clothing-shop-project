import { useState, useEffect, useMemo, useCallback } from "react";
import { useToast } from "../../context/ToastContext";
import { useLanguage } from "../../context/LanguageContext";

const API_URL = import.meta.env.VITE_API_URL;

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
  post: async (endpoint: string, body: any, options: ApiOptions = {}) => {
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
  put: async (endpoint: string, body: any, options: ApiOptions = {}) => {
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
    gender: "unisex",
    category_id: "",
  });

  const [mobileFormOpen, setMobileFormOpen] = useState(false);

  const resetForm = useCallback(() => {
    setEditingId(null);
    setForm({ name: "", name_vi: "", name_en: "", description_vi: "", description_en: "", import_price: "", price: "", image_url: "", gender: "unisex", category_id: "" });
    setMobileFormOpen(false);
  }, []);

  const fetchData = useCallback(async () => {
    try {
      const [prodRes, catRes] = await Promise.all([
        API.get("/admin/products", { headers: { Authorization: `Bearer ${token}` } }),
        API.get("/categories"),
      ]);
      setProducts(Array.isArray(prodRes.data) ? prodRes.data : []);
      setCategories(Array.isArray(catRes.data) ? catRes.data : catRes.data?.data || []);
    } catch (err: unknown) {
      console.error("Data Load Error:", err);
      showToast(t("admin.product.toast_load_failed", "Failed to load data"), "error");
    }
  }, [token, showToast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    setFilterCategory("all");
  }, [filterGender]);

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
      await fetchData();
    } catch (err: unknown) {
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
    } catch {
      showToast(t("admin.product.toast_delete_failed", "Delete failed"), "error");
    }
  }, [token, showToast]);

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

  const filteredProducts = useMemo(() => {
    const genderOrder = { male: 1, female: 2, unisex: 3 };
    const sorted = [...products].sort((a, b) => genderOrder[a.gender] - genderOrder[b.gender]);

    return sorted.filter((p) => {
      const matchGender = filterGender === "all" || p.gender === filterGender;

      let matchCategory = true;
      if (filterCategory !== "all") {
        const targetCat = categories.find(c => String(c.id) === String(filterCategory));
        if (targetCat) {
           const siblingIds = categories
             .filter(c => c.name.trim().toLowerCase() === targetCat.name.trim().toLowerCase())
             .map(c => String(c.id));
           matchCategory = siblingIds.includes(String(p.category_id));
        }
      }

      const matchSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
      return matchGender && matchCategory && matchSearch;
    });
  }, [products, filterGender, filterCategory, searchTerm, categories]);

  return {
    state: {
      products: filteredProducts,
      categories,
      uniqueCategoriesForFilter,
      uploading,
      filterGender,
      filterCategory,
      searchTerm,
      editingId,
      form,
      mobileFormOpen
    },
    actions: {
      setFilterGender,
      setFilterCategory,
      setSearchTerm,
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
