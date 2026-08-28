import { useState, useEffect, useCallback } from "react";
import API from "../../services/apiClient";
import { useToast } from "../../context/ToastContext";

/**
 * Custom hook to manage category-related operations including fetching,
 * recommendations, and CRUD actions.
 */
export function useCategoryManager() {
  const { showToast } = useToast();
  const token = localStorage.getItem("token");
  const authConfig = { headers: { Authorization: `Bearer ${token}` } };

  // Core States
  const [categories, setCategories] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [filterGender, setFilterGender] = useState("male");

  // Contextual States (Images from products & recommended names)
  const [categoryImages, setCategoryImages] = useState([]);
  const [recommendNames, setRecommendNames] = useState([]);

  // Form State
  const [form, setForm] = useState({ name: "", gender: "", image_url: "" });

  /**
   * Fetches all categories and sorts them by a predefined gender order.
   * Order: Male -> Female -> Unisex
   */
  const fetchCategories = useCallback(async () => {
    try {
      const res = await API.get("/admin/categories");
      let categoryList = Array.isArray(res.data) ? res.data : res.data.data;

      const genderOrder = { male: 1, female: 2, unisex: 3 };
      categoryList = [...categoryList].sort(
        (a, b) => genderOrder[a.gender] - genderOrder[b.gender]
      );

      setCategories(categoryList || []);
    } catch (error) {
      console.error("Failed to fetch categories:", error);
    }
  }, []);

  /**
   * Handles input changes and fetches name recommendations when gender is selected.
   * @param {Object} e - Input change event
   */
  const handleChange = async (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));

    // Fetch naming suggestions when user selects a gender
    if (name === "gender" && value) {
      try {
        const res = await API.get(`/admin/categories/recommend?gender=${value}`);
        setRecommendNames(res.data.data || []);
      } catch (error) {
        setRecommendNames([]);
      }
    }
  };

  /**
   * Submits the form to either create a new category or update an existing one.
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editingId) {
        await API.put(`/admin/categories/${editingId}`, form, authConfig);
      } else {
        await API.post("/admin/categories", form, authConfig);
      }
      resetForm();
      await fetchCategories();
      // Sync other components if needed
      window.dispatchEvent(new Event("categories-updated"));
      showToast(`Category ${editingId ? "updated" : "added"} successfully!`, "success");
    } catch (err) {
      showToast(`Error: ${err.response?.data?.message || err.message}`, "error");
    } finally {
      setLoading(false);
    }
  };

  /**
   * Prepares the UI for editing by loading category data and its associated product images.
   * @param {Object} cat - The category object to edit
   */
  const handleEdit = async (cat) => {
    setEditingId(cat.id);
    setForm({
      name: cat.name,
      gender: cat.gender,
      image_url: cat.image_url || "",
    });

    try {
      // Load preview images from existing products and current recommendations
      const [imagesRes, recommendRes] = await Promise.all([
        API.get(`/admin/categories/${cat.id}/images`),
        API.get(`/admin/categories/recommend?gender=${cat.gender}`),
      ]);
      setCategoryImages(imagesRes.data.data || []);
      setRecommendNames(recommendRes.data.data || []);
    } catch (error) {
      console.error("Failed to load editing context:", error);
    }
  };

  /**
   * Deletes a category. Prevents deletion if the category is not empty (handled by backend).
   * @param {number|string} id - Category ID
   */
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this category?")) return;
    try {
      await API.delete(`/admin/categories/${id}`, authConfig);
      await fetchCategories();
      showToast("Category deleted successfully!", "success");
    } catch (err) {
      showToast("Cannot delete category containing products.", "error");
    }
  };

  /**
   * Resets form and all temporary data (images, suggestions).
   */
  const resetForm = () => {
    setEditingId(null);
    setForm({ name: "", gender: "", image_url: "" });
    setCategoryImages([]);
    setRecommendNames([]);
  };

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  return {
    categories, editingId, loading, filterGender, setFilterGender,
    categoryImages, recommendNames, form, setForm,
    handleChange, handleSubmit, handleEdit, handleDelete, resetForm
  };
}
