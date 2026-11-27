import { useState, useRef } from "react";
import API from "@shop/shared/services/apiClient";
import { useToast } from "@shop/shared/context/ToastContext";
import { useLanguage } from "@shop/shared/context/LanguageContext";
import { buildReturnItems, buildReturnFormData } from "@shop/shared/utils/returnRequestUtils";
import type { ProfileOrder, ProfileOrderItem } from "./profileTypes";

type AxiosErr = { response?: { data?: { message?: string } } };

type ReturnDataState = {
  reason: string;
  note: string;
  bankName: string;
  bankNumber: string;
  accountHolder: string;
  images: File[];
  selectedItems: Record<number, { selected: boolean; return_quantity: number }>;
};

const INITIAL_RETURN_DATA: ReturnDataState = {
  reason: "",
  note: "",
  bankName: "",
  bankNumber: "",
  accountHolder: "",
  images: [],
  selectedItems: {},
};

/**
 * Modal + form yêu cầu đổi trả: mở modal (chọn sẵn các item không phải quà tặng),
 * quản lý dữ liệu form và gửi yêu cầu lên server.
 * `onSubmitted` được gọi sau khi gửi thành công (thường là tải lại danh sách đơn).
 */
export function useReturnRequestForm(orders: ProfileOrder[], onSubmitted: () => void) {
  const { showToast } = useToast();
  const { t, translateApiMessage } = useLanguage();

  const [showReturnModal, setShowReturnModal] = useState(false);
  const [returnOrderId, setReturnOrderId] = useState<number | null>(null);
  const [returnOrder, setReturnOrder] = useState<ProfileOrder | null>(null);
  const [returnData, setReturnData] = useState<ReturnDataState>({
    ...INITIAL_RETURN_DATA,
    selectedItems: {}
  });
  // F-4: double-submit guard
  const submittingRef = useRef(false);

  const handleOpenReturnModal = (orderOrId: ProfileOrder | number) => {
    const targetOrder = typeof orderOrId === 'object' ? orderOrId : orders.find((o) => o.id === orderOrId);
    const orderId = targetOrder?.id ?? (typeof orderOrId === "number" ? orderOrId : orderOrId.id);

    setReturnOrderId(typeof orderId === "number" ? orderId : null);
    setReturnOrder(targetOrder || null);

    // Initial selectedItems: select all non-gift items by default
    const initialSelectedItems: Record<number, { selected: boolean; return_quantity: number }> = {};
    if (targetOrder?.items) {
      targetOrder.items.forEach((item: ProfileOrderItem) => {
        initialSelectedItems[item.id] = {
          selected: !item.is_gift,
          return_quantity: item.quantity || 1
        };
      });
    }

    setReturnData({
      ...INITIAL_RETURN_DATA,
      selectedItems: initialSelectedItems
    });
    setShowReturnModal(true);
  };

  const handleSubmitReturn = async () => {
    // F-4: prevent double-submit
    if (submittingRef.current) return;
    submittingRef.current = true;
    const { bankName, bankNumber, accountHolder, reason, note, images, selectedItems } = returnData;

    if (!bankName || !bankNumber || !accountHolder) {
      showToast(t("profile.fill_bank"), "warning");
      submittingRef.current = false;
      return;
    }

    if (!reason) {
      showToast(t("lookup.no_reason_selected_err", "Vui lòng chọn lý do đổi trả."), "warning");
      submittingRef.current = false;
      return;
    }

    if (!note || !String(note).trim()) {
      showToast(t("lookup.desc_required_err", "Vui lòng mô tả chi tiết vấn đề."), "warning");
      submittingRef.current = false;
      return;
    }

    const currentOrder = returnOrder || orders.find((o) => o.id === returnOrderId);
    if (!currentOrder?.email) {
      showToast(t("profile.order_email_not_found"), "error");
      submittingRef.current = false;
      return;
    }

    const returnItems = buildReturnItems(selectedItems, currentOrder?.items);

    if (returnItems.length === 0) {
      showToast(t("lookup.no_items_selected_err", "Vui lòng chọn ít nhất 1 sản phẩm để trả."), "warning");
      submittingRef.current = false;
      return;
    }

    const formData = buildReturnFormData({
      reasonCode: reason,
      description: note,
      email: currentOrder.email,
      returnItems,
      bankFieldName: "bankInfo",
      bankInfo: { name: bankName, acc: bankNumber, owner: accountHolder },
      images,
    });

    try {
      const response = await API.post(
        `/orders/${returnOrder?.id ?? returnOrderId}/return`,
        formData,
        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
      );

      if (response.status === 200 || response.status === 201) {
        showToast(t("profile.return_submitted"), "success");
        setShowReturnModal(false);
        onSubmitted();
      }
    } catch (error: unknown) {
      console.error("Connection error:", error);
      const err = error as AxiosErr;
      showToast(translateApiMessage(err.response?.data?.message) || t("profile.connect_error"), "error");
    } finally {
      submittingRef.current = false;
    }
  };

  const handleReturnDataChange = <K extends keyof ReturnDataState>(field: K, value: ReturnDataState[K]) =>
    setReturnData((prev) => ({ ...prev, [field]: value }));

  return {
    showReturnModal,
    setShowReturnModal,
    returnOrderId,
    returnOrder,
    returnData,
    handleOpenReturnModal,
    handleSubmitReturn,
    handleReturnDataChange,
  };
}
