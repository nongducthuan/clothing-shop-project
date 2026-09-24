import { useState, useEffect, useCallback } from "react";
import API from "../../services/apiClient.ts";
import { useToast } from "../../context/ToastContext";
import { useLanguage } from "../../context/LanguageContext";

export const SIZE_ORDER = ["XS", "S", "M", "L", "XL", "XXL", "FreeSize", "29", "30", "31", "32"];
export const API_URL = import.meta.env.VITE_API_URL;

export function useProductInventory(productId) {
  const { showToast } = useToast();
  const { t } = useLanguage();
  const token = localStorage.getItem("token");

  const [product, setProduct] = useState(null);
  const [colors, setColors] = useState([]);
  const [selectedColorId, setSelectedColorId] = useState(null);

  const [colorForm, setColorForm] = useState({ color_name: "", color_name_vi: "", color_name_en: "", color_code: "#000000", image_url: "" });
  const [sizeForm, setSizeForm] = useState({ size: "S", stock: 10 });

  const [isUploading, setIsUploading] = useState(false);

  /**
   * Fetches product details and its associated colors/sizes from the server.
   * Uses a timeout to force a clean UI re-render as per original logic.
   */
  const fetchProductData = useCallback(async () => {
    try {
      const { data } = await API.get(`/admin/products/${productId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setProduct(null); // Reset to trigger loading state if needed

      setTimeout(() => {
        setProduct(data);
        if (data.colors) {
          setColors([...data.colors]);
          if (!selectedColorId && data.colors.length > 0) {
            setSelectedColorId(data.colors[0].id);
          }
        }
      }, 0);
    } catch (err) {
      console.error("Fetch Error:", err);
    }
  }, [productId, token, selectedColorId]);

  /**
   * Handles uploading a color image to the server and updates the form state.
   */
  const uploadImage = async (file) => {
    if (!file) return;
    setIsUploading(true);

    const formData = new FormData();
    formData.append("image", file);

    try {
      const { data } = await API.post("/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setColorForm((prev) => ({ ...prev, image_url: data.url }));
    } catch (err) {
      showToast(t("admin.pd.toast_upload_failed", "Upload failed. Please try again."), "error");
    } finally {
      setIsUploading(false);
    }
  };

  /**
   * Sends a request to add a new color variant to the current product.
   */
  const addColor = async () => {
    // Accept any of the 3 name fields; backend derives the canonical color_name
    if (!colorForm.color_name && !colorForm.color_name_vi && !colorForm.color_name_en)
      return showToast(t("admin.pd.toast_name_required", "Please enter a color name."), "warning");

    try {
      await API.post(`/admin/products/${productId}/colors`, colorForm, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setColorForm({ color_name: "", color_name_vi: "", color_name_en: "", color_code: "#000000", image_url: "" });
      fetchProductData();
      showToast(t("admin.pd.toast_color_added", "Color added successfully!"), "success");
    } catch (err) {
      showToast(t("admin.pd.toast_color_add_failed", "Failed to add color. Please try again."), "error");
    }
  };

  /**
   * Deletes a color variant and all associated sizes after user confirmation.
   */
  const deleteColor = async (colorId) => {
    if (!window.confirm(t("admin.pd.confirm_delete_color", "Deleting this color will delete all associated sizes. Continue?"))) return;

    try {
      await API.delete(`/admin/colors/${colorId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (selectedColorId === colorId) setSelectedColorId(null);
      fetchProductData();
      showToast(t("admin.pd.toast_color_deleted", "Color deleted."), "success");
    } catch (err) {
      showToast(t("admin.pd.toast_color_delete_failed", "Failed to delete color."), "error");
    }
  };

  /**
   * Adds a new size or increments stock for an existing size under the selected color.
   */
  const addSize = async () => {
    if (!selectedColorId) return showToast(t("admin.pd.toast_select_color", "Please select a color first!"), "warning");
    if (!sizeForm.size?.trim()) return showToast(t("admin.pd.toast_select_size", "Please select a size."), "warning");

    const stockValue = Number(sizeForm.stock);
    if (isNaN(stockValue) || stockValue < 0) return showToast(t("admin.pd.toast_invalid_stock", "Invalid stock value."), "warning");

    try {
      const currentColor = colors.find((c) => c.id === selectedColorId);
      const existingSize = currentColor.sizes.find((s) => s.size === sizeForm.size);

      const { data } = await API.post(
        `/admin/colors/${selectedColorId}/sizes`,
        { size: sizeForm.size, stock: stockValue, increment: true },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Local state update for immediate UI feedback without refetching the whole product
      if (existingSize) {
        existingSize.stock += stockValue;
      } else {
        currentColor.sizes.push({ id: data.id, size: sizeForm.size, stock: stockValue });
      }

      setColors([...colors]);
      setSizeForm({ size: "S", stock: 0 });
      showToast(t("admin.pd.toast_stock_updated", "Size stock updated successfully!"), "success");
    } catch (err) {
      showToast(t("admin.pd.toast_add_size_failed", "Failed to add/update size stock."), "error");
    }
  };

  /**
   * Deletes a specific size entry from the database.
   */
  const deleteSize = async (sizeId) => {
    if (!window.confirm(t("admin.pd.confirm_delete_size", "Are you sure you want to delete this size?"))) return;

    try {
      await API.delete(`/admin/sizes/${sizeId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchProductData();
      showToast(t("admin.pd.toast_size_deleted", "Size deleted."), "success");
    } catch (err) {
      console.error("Delete Size Error:", err);
      showToast(t("admin.pd.toast_size_delete_failed", "Failed to delete size."), "error");
    }
  };

  /**
   * Sets the absolute stock quantity for an existing size (inline edit mode).
   * Unlike addSize (which increments), this corrects the stock to an exact value.
   * @returns {Promise<boolean>} true if the update succeeded.
   */
  const updateSizeStock = async (sizeId, stock) => {
    const stockValue = Number(stock);
    if (stock === "" || stock === null || isNaN(stockValue) || !Number.isInteger(stockValue) || stockValue < 0) {
      showToast(t("admin.pd.toast_invalid_stock", "Invalid stock value."), "warning");
      return false;
    }

    try {
      const { data } = await API.put(
        `/admin/sizes/${sizeId}`,
        { stock: stockValue },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Local state update for immediate UI feedback without refetching the whole product
      setColors((prev) =>
        prev.map((color) => ({
          ...color,
          sizes: color.sizes?.map((s) => (s.id === Number(sizeId) ? { ...s, stock: data.stock ?? stockValue } : s)) || [],
        }))
      );
      showToast(t("admin.pd.toast_stock_updated", "Stock updated successfully!"), "success");
      return true;
    } catch (err) {
      console.error("Update Size Error:", err);
      showToast(t("admin.pd.toast_stock_update_failed", "Failed to update stock."), "error");
      return false;
    }
  };

  useEffect(() => {
    fetchProductData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId]);

  return {
    product,
    colors,
    selectedColorId,
    setSelectedColorId,
    colorForm,
    setColorForm,
    sizeForm,
    setSizeForm,
    isUploading,
    uploadImage,
    addColor,
    deleteColor,
    addSize,
    deleteSize,
    updateSizeStock
  };
}

