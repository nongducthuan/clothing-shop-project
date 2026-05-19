import { useState, useEffect, useMemo, useCallback } from "react";

const BACKEND_URL = "http://localhost:5000";

// Internal API Wrapper (Kept exact logic from original file)
const API = {
  get: async (endpoint, options = {}) => {
    const res = await fetch(`${BACKEND_URL}${endpoint}`, {
      ...options,
      method: "GET",
      headers: { "Content-Type": "application/json", ...options.headers }
    });
    if (!res.ok) throw new Error("API Error");
    return { data: await res.json() };
  },
  post: async (endpoint, body, options = {}) => {
    const isFormData = body instanceof FormData;
    const headers = { ...options.headers };
    if (!isFormData) headers["Content-Type"] = "application/json";

    const res = await fetch(`${BACKEND_URL}${endpoint}`, {
      ...options,
      method: "POST",
      headers,
      body: isFormData ? body : JSON.stringify(body),
    });
    if (!res.ok) throw new Error("API Error");
    return { data: await res.json() };
  },
  put: async (endpoint, body, options = {}) => {
    const res = await fetch(`${BACKEND_URL}${endpoint}`, {
      ...options,
      method: "PUT",
      headers: { "Content-Type": "application/json", ...options.headers },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error("API Error");
    return { data: await res.json() };
  },
  delete: async (endpoint, options = {}) => {
    const res = await fetch(`${BACKEND_URL}${endpoint}`, {
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

  // --- State ---
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [toast, setToast] = useState(null);

  const [filterGender, setFilterGender] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    name: "",
    description: "",
    price: "",
    image_url: "",
    gender: "unisex",
    category_id: "",
  });

  const [mobileFormOpen, setMobileFormOpen] = useState(false);

  // --- Helpers ---
  const showToast = useCallback((message, type = "success") => {
    setToast({ message, type });
  }, []);

  const resetForm = useCallback(() => {
    setEditingId(null);
    setForm({ name: "", description: "", price: "", image_url: "", gender: "unisex", category_id: "" });
    setMobileFormOpen(false);
  }, []);

  // --- Data Fetching ---
  const fetchData = useCallback(async () => {
    try {
      const [prodRes, catRes] = await Promise.all([
        API.get("/admin/products", { headers: { Authorization: `Bearer ${token}` } }),
        API.get("/categories"),
      ]);
      setProducts(Array.isArray(prodRes.data) ? prodRes.data : []);
      setCategories(Array.isArray(catRes.data) ? catRes.data : catRes.data?.data || []);
    } catch (err) {
      console.error("Data Load Error:", err);
      showToast("Failed to load data", "error");
    }
  }, [token, showToast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    setFilterCategory("all");
  }, [filterGender]);

  // --- Actions ---
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("image", file);

    try {
      const response = await API.post("/upload", formData);
      setForm((prev) => ({ ...prev, image_url: response.data.url }));
      showToast("Image uploaded successfully");
    } catch {
      showToast("Image upload failed", "error");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const cleanName = form.name.trim();
    if (!cleanName || !form.price || !form.category_id) return showToast("Required fields missing", "error");

    const categoryObj = categories.find((c) => String(c.id) === String(form.category_id));
    if (categoryObj && categoryObj.gender !== form.gender) {
      return showToast("Gender mismatch with category!", "error");
    }

    const payload = { ...form, name: cleanName, description: form.description.trim() };

    try {
      const endpoint = editingId ? `/admin/products/${editingId}` : "/admin/products";
      const method = editingId ? API.put : API.post;
      await method(endpoint, payload, { headers: { Authorization: `Bearer ${token}` } });

      showToast(editingId ? "Product updated!" : "Product created!");
      resetForm();
      window.dispatchEvent(new Event("categories-updated"));
      await fetchData();
    } catch (err) {
      showToast("Save failed", "error");
    }
  };

  const handleEdit = useCallback((p) => {
    setForm({
      name: p.name,
      description: p.description || "",
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
    if (!window.confirm("Delete this product?")) return;
    try {
      await API.delete(`/admin/products/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      setProducts((prev) => prev.filter((p) => p.id !== id));
      showToast("Product deleted");
    } catch {
      showToast("Delete failed", "error");
    }
  }, [token, showToast]);

  // --- Derived State (Memos) ---
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
      toast,
      filterGender,
      filterCategory,
      searchTerm,
      editingId,
      form,
      mobileFormOpen,
      BACKEND_URL
    },
    actions: {
      setToast,
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
