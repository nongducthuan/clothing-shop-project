import { useState, useEffect, useCallback } from "react";
import API from "../../services/apiClient.ts";
import { useToast } from "../../context/ToastContext";
import { useLanguage } from "../../context/LanguageContext";
import type { FormEvent } from "react";

export interface BannerRecord { id: number; image_url?: string; imageUrl?: string; title?: string; title_vi?: string; title_en?: string; subtitle?: string; subtitle_vi?: string; subtitle_en?: string; [key: string]: unknown }
export interface BannerFormData { imageUrl: string; title: string; title_vi: string; title_en: string; subtitle: string; subtitle_vi: string; subtitle_en: string }

/**
 * Custom hook to manage Banner business logic: fetching, uploading, saving, and deleting.
 */
export function useBannerManager() {
  const { showToast } = useToast();
  const { t } = useLanguage();
  const token = localStorage.getItem("token");

  const [banners, setBanners] = useState<BannerRecord[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<BannerFormData>({ imageUrl: "", title: "", title_vi: "", title_en: "", subtitle: "", subtitle_vi: "", subtitle_en: "" });

  /**
   * Fetches all banners from the backend and maps field names for consistency.
   */
  const fetchBanners = useCallback(async () => {
    try {
      const res = await API.get("/admin/banners", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const mappedData = Array.isArray(res.data)
        ? res.data.map((banner: BannerRecord) => ({
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
  const uploadImage = async (file: File) => {
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append("image", file);

    try {
      const res = await API.post("/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setForm((prev) => ({ ...prev, imageUrl: res.data.url }));
    } catch {
      showToast(t("admin.banner.toast_upload_failed", "Image upload failed"), "error");
    } finally {
      setIsUploading(false);
    }
  };

  /**
   * Saves a new banner or updates an existing one based on editingId.
   */
  const saveBanner = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      const payload = {
        ...form,
        image_url: form.imageUrl,
        title_vi: (form.title_vi || "").trim() || form.title.trim(),
        title_en: (form.title_en || "").trim() || form.title.trim(),
        subtitle_vi: (form.subtitle_vi || "").trim() || (form.subtitle || "").trim(),
        subtitle_en: (form.subtitle_en || "").trim() || (form.subtitle || "").trim(),
      };
      const endpoint = editingId ? `/admin/banners/${editingId}` : "/admin/banners";
      const method = editingId ? "put" : "post";

      await API[method](endpoint, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      resetForm();
      fetchBanners();
      showToast(t("admin.banner.toast_saved", "Banner saved successfully!"), "success");
    } catch {
      showToast(t("admin.banner.toast_save_failed", "Failed to save banner!"), "error");
    }
  };

  /**
   * Deletes a banner by ID after user confirmation.
   */
  const deleteBanner = async (id: number) => {
    if (!window.confirm(t("admin.confirm_delete", "Are you sure you want to delete this item?"))) return;
    try {
      await API.delete(`/admin/banners/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchBanners();
      showToast(t("admin.banner.toast_deleted", "Banner deleted."), "success");
    } catch {
      showToast(t("admin.banner.toast_delete_failed", "Delete failed!"), "error");
    }
  };

  /**
   * Populates the form with existing banner data for editing.
   */
  const selectForEdit = (banner: BannerRecord) => {
    setForm({
      imageUrl: banner.image_url || "",
      title: banner.title || "",
      title_vi: banner.title_vi || banner.title || "",
      title_en: banner.title_en || banner.title || "",
      subtitle: banner.subtitle || "",
      subtitle_vi: banner.subtitle_vi || banner.subtitle || "",
      subtitle_en: banner.subtitle_en || banner.subtitle || "",
    });
    setEditingId(banner.id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  /**
   * Resets the form and editing state.
   */
  const resetForm = () => {
    setEditingId(null);
    setForm({ imageUrl: "", title: "", title_vi: "", title_en: "", subtitle: "", subtitle_vi: "", subtitle_en: "" });
  };

  useEffect(() => {
    fetchBanners();
  }, [fetchBanners]);

  return {
    banners, isUploading, editingId, form, setForm,
    uploadImage, saveBanner, deleteBanner, selectForEdit, resetForm
  };
}
