import { useState, useEffect, useCallback } from "react";
import API from "../../services/apiClient.js";

// Constants
export const SIZE_ORDER = ["XS", "S", "M", "L", "XL", "XXL", "FreeSize", "29", "30", "31", "32"];
export const API_URL = import.meta.env.VITE_API_URL;

/**
 * Custom hook managing the inventory (colors & sizes) of a specific product.
 * @param {string|number} productId - The ID of the product being managed.
 */
export function useProductInventory(productId) {
  const token = localStorage.getItem("token");

  // Data States
  const [product, setProduct] = useState(null);
  const [colors, setColors] = useState([]);
  const [selectedColorId, setSelectedColorId] = useState(null);

  // Form States
  const [colorForm, setColorForm] = useState({ color_name: "", color_code: "#000000", image_url: "" });
  const [sizeForm, setSizeForm] = useState({ size: "S", stock: 10 });

  // UI States
  const [isUploading, setIsUploading] = useState(false);

  /**
   * Fetches product details and its associated colors/sizes from the server.
   * Uses a timeout to force a clean UI re-render as per original logic.
   */
  const fetchProductData = useCallback(async () => {
    try {
      const { data } = await API.get(`/products/${productId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setProduct(null); // Reset to trigger loading state if needed

      setTimeout(() => {
        setProduct(data);
        if (data.colors) {
          setColors([...data.colors]);
          // Auto-select the first color if none is selected
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
      alert("Upload failed. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  /**
   * Sends a request to add a new color variant to the current product.
   */
  const addColor = async () => {
    if (!colorForm.color_name) return alert("Please enter a color name.");

    try {
      await API.post(`/products/${productId}/colors`, colorForm, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Reset form & refresh data
      setColorForm({ color_name: "", color_code: "#000000", image_url: "" });
      fetchProductData();
      alert("Color added successfully!");
    } catch (err) {
      alert("Failed to add color. Please try again.");
    }
  };

  /**
   * Deletes a color variant and all associated sizes after user confirmation.
   */
  const deleteColor = async (colorId) => {
    if (!window.confirm("Deleting this color will delete all associated sizes. Continue?")) return;

    try {
      await API.delete(`/colors/${colorId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Clear selection if the deleted color was selected
      if (selectedColorId === colorId) setSelectedColorId(null);
      fetchProductData();
    } catch (err) {
      alert("Failed to delete color.");
    }
  };

  /**
   * Adds a new size or increments stock for an existing size under the selected color.
   */
  const addSize = async () => {
    if (!selectedColorId) return alert("Please select a color first!");
    if (!sizeForm.size?.trim()) return alert("Please select a size.");

    const stockValue = Number(sizeForm.stock);
    if (isNaN(stockValue) || stockValue < 0) return alert("Invalid stock value.");

    try {
      const currentColor = colors.find((c) => c.id === selectedColorId);
      const existingSize = currentColor.sizes.find((s) => s.size === sizeForm.size);

      const { data } = await API.post(
        `/colors/${selectedColorId}/sizes`,
        { size: sizeForm.size, stock: stockValue, increment: true },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Local state update for immediate UI feedback without refetching the whole product
      if (existingSize) {
        existingSize.stock += stockValue;
      } else {
        currentColor.sizes.push({ id: data.id, size: sizeForm.size, stock: stockValue });
      }

      setColors([...colors]); // Trigger re-render
      setSizeForm({ size: "S", stock: 0 }); // Reset form
      alert("Size stock updated successfully!");
    } catch (err) {
      alert("Failed to add/update size stock.");
    }
  };

  /**
   * Deletes a specific size entry from the database.
   */
  const deleteSize = async (sizeId) => {
    if (!window.confirm("Are you sure you want to delete this size?")) return;

    try {
      await API.delete(`/sizes/${sizeId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchProductData();
    } catch (err) {
      console.error("Delete Size Error:", err);
      alert("Failed to delete size.");
    }
  };

  // Initial Data Fetch
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
    deleteSize
  };
}

