import { useState, useCallback } from "react";
import type { ChangeEvent } from "react";
import { useToast } from "../../../context/ToastContext";
import { useLanguage } from "../../../context/LanguageContext";
import { productApi } from "./productApi";
import type { ProductRecord } from "./useProductList";

export const EMPTY_PRODUCT_FORM = {
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
};
export type ProductFormData = Omit<typeof EMPTY_PRODUCT_FORM, "price" | "import_price"> & { price: string | number; import_price: string | number };
export interface ProductCategory { id: number | string; name: string; name_vi?: string; name_en?: string; gender: string; [key: string]: unknown }

/** Form thêm/sửa sản phẩm: state form, chế độ sửa, mở form trên mobile và upload ảnh. */
export function useProductForm() {
  const { showToast } = useToast();
  const { t } = useLanguage();

  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<ProductFormData>({ ...EMPTY_PRODUCT_FORM });
  const [mobileFormOpen, setMobileFormOpen] = useState(false);
  const [uploading, setUploading] = useState(false);

  const resetForm = useCallback(() => {
    setEditingId(null);
    setForm({ ...EMPTY_PRODUCT_FORM });
    setMobileFormOpen(false);
  }, []);

  const handleEdit = useCallback((p: ProductRecord) => {
    setForm({
      name: p.name || "",
      name_vi: p.name_vi || p.name || "",
      name_en: p.name_en || p.name || "",
      description_vi: p.description_vi || "",
      description_en: p.description_en || "",
      import_price: p.import_price || "",
      price: p.price,
      image_url: p.image_url || "",
      gender: p.gender,
      category_id: String(p.category_id),
    });
    setEditingId(p.id);
    setMobileFormOpen(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const handleFileUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("image", file);

    try {
      const response = await productApi.post("/upload", formData);
      setForm((prev) => ({ ...prev, image_url: response.data.url }));
      showToast(t("admin.product.toast_image_uploaded", "Image uploaded successfully"));
    } catch {
      showToast(t("admin.product.toast_image_upload_failed", "Image upload failed"), "error");
    } finally {
      setUploading(false);
    }
  };

  return {
    editingId,
    form,
    setForm,
    mobileFormOpen,
    setMobileFormOpen,
    uploading,
    resetForm,
    handleEdit,
    handleFileUpload,
  };
}
