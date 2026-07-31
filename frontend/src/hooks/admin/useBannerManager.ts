import { useState, useEffect, useCallback } from "react";
import API from "../../services/apiClient.js";

/**
 * Custom hook to manage Banner business logic: fetching, uploading, saving, and deleting.
 */
export function useBannerManager() {
  const token = localStorage.getItem("token");

  // State management
  const [banners, setBanners] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ imageUrl: "", title: "", subtitle: "" });

  /**
   * Fetches all banners from the backend and maps field names for consistency.
   */
  const fetchBanners = useCallback(async () => {
    try {
      const res = await API.get("/banners", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const mappedData = Array.isArray(res.data)
        ? res.data.map((banner) => ({
            ...banner,
            imageUrl: banner.image_url || banner.imageUrl,
          }))
        : [];

      setBanners(mappedData);
    } catch (err) {
      console.error("Fetch Banners Error:", err);
    }
  }, [token]);

  /**
   * Handles image file upload to the server.
   * @param {File} file - The image file from input.
   */
  const uploadImage = async (file) => {
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append("image", file);

    try {
      const res = await API.post("/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setForm((prev) => ({ ...prev, imageUrl: res.data.url }));
    } catch (err) {
      alert("Image upload failed");
    } finally {
      setIsUploading(false);
    }
  };

  /**
   * Saves a new banner or updates an existing one based on editingId.
   */
  const saveBanner = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...form, image_url: form.imageUrl };
      const endpoint = editingId ? `/banners/${editingId}` : "/banners";
      const method = editingId ? "put" : "post";

      await API[method](endpoint, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      resetForm();
      fetchBanners();
      alert("Banner saved successfully!");
    } catch (err) {
      alert("Failed to save banner!");
    }
  };

  /**
   * Deletes a banner by ID after user confirmation.
   */
  const deleteBanner = async (id) => {
    if (!window.confirm("Delete this banner?")) return;
    try {
      await API.delete(`/banners/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchBanners();
    } catch (err) {
      alert("Delete failed!");
    }
  };

  /**
   * Populates the form with existing banner data for editing.
   */
  const selectForEdit = (banner) => {
    setForm({
      imageUrl: banner.image_url,
      title: banner.title,
      subtitle: banner.subtitle,
    });
    setEditingId(banner.id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  /**
   * Resets the form and editing state.
   */
  const resetForm = () => {
    setEditingId(null);
    setForm({ imageUrl: "", title: "", subtitle: "" });
  };

  useEffect(() => {
    fetchBanners();
  }, [fetchBanners]);

  return {
    banners, isUploading, editingId, form, setForm,
    uploadImage, saveBanner, deleteBanner, selectForEdit, resetForm
  };
}
