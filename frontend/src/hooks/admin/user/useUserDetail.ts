import { useState } from "react";
import API from "../../../services/apiClient";
import { useToast } from "../../../context/ToastContext";
import { useLanguage } from "../../../context/LanguageContext";
import { readErrorMessage, type AdminUser, type UserOrderSummary } from "./userTypes";

/** Modal xem nhanh chi tiết người dùng + các đơn hàng gần đây. */
export function useUserDetail() {
  const { showToast } = useToast();
  const { t, translateApiMessage } = useLanguage();

  const [detailModal, setDetailModal] = useState<{
    isOpen: boolean;
    loading: boolean;
    user: AdminUser | null;
    orders: UserOrderSummary[];
  }>({ isOpen: false, loading: false, user: null, orders: [] });

  const handleShowDetail = async (user: AdminUser) => {
    setDetailModal({ isOpen: true, loading: true, user, orders: [] });

    try {
      const res = await API.get(`/admin/users/${user.id}`);
      const detail = res.data.data || res.data;
      setDetailModal({
        isOpen: true,
        loading: false,
        user: detail,
        orders: Array.isArray(detail.orders) ? detail.orders : [],
      });
    } catch (error) {
      setDetailModal({ isOpen: true, loading: false, user, orders: [] });
      showToast(`${t("common.error")}: ${translateApiMessage(readErrorMessage(error))}`, "error");
    }
  };

  const closeDetail = () => setDetailModal((prev) => ({ ...prev, isOpen: false }));

  return { detailModal, handleShowDetail, closeDetail };
}
