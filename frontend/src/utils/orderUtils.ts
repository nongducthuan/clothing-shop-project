// Nguồn dữ liệu DUY NHẤT cho các enum trạng thái đơn hàng và luật chuyển trạng thái.
// Khớp với enum trong DB (backend/database/schema.sql - bảng orders):
// Pending | Confirmed | Shipping | Delivered | Cancelled |
// Return Requested | Return Rejected | Return Approved
// Được dùng chung bởi: useOrderManager (nơi giữ state tab/lọc), OrderTable (desktop), OrderCard (mobile).

/** 5 trạng thái của luồng giao hàng chuẩn */
export const STANDARD_STATUSES = ["Pending", "Confirmed", "Shipping", "Delivered", "Cancelled"];

/** 3 trạng thái đổi trả (tab Returns) */
export const RETURN_STATUSES = ["Return Requested", "Return Rejected", "Return Approved"];

/** Toàn bộ trạng thái hiển thị trên dropdown / bộ lọc */
export const STATUS_OPTIONS = [...STANDARD_STATUSES, ...RETURN_STATUSES];

/** 3 trạng thái thanh toán của đơn hàng */
export const PAYMENT_OPTIONS = ["Unpaid", "Paid", "Refunded"];

/**
 * Trạng thái đơn mà khách còn được thanh toán lại / đổi phương thức thanh toán.
 * MIRROR của REPAYABLE_ORDER_STATUSES ở backend/src/controllers/customer/paymentController.ts.
 */
export const REPAYABLE_ORDER_STATUSES = ["Pending", "Confirmed"];

/** Hiện nút "Thanh toán" chỉ khi đơn chưa trả tiền VÀ backend sẽ chấp nhận repay. */
export function canRepayOrder(order: { status?: string | null; payment_status?: string | null }): boolean {
  return order.payment_status === "Unpaid" && REPAYABLE_ORDER_STATUSES.includes(order.status ?? "");
}

/**
 * Trạng thái đổi trả tồn tại ở 2 dạng giá trị:
 * dạng hiển thị ("Return Requested") và dạng enum DB ("Return_Requested").
 * Sinh tự động từ RETURN_STATUSES → thêm trạng thái mới chỉ phải sửa 1 chỗ.
 */
export const RETURN_STATUS_VARIANTS: string[] = RETURN_STATUSES.flatMap((status) => [
  status,
  status.replace(/\s+/g, "_"),
]);

/**
 * Luồng hợp lệ: Pending -> Confirmed -> Shipping -> Delivered, hoặc Cancelled ở bất kỳ bước nào.
 * Trạng thái KHÔNG có trong map này (Return Requested/Approved/Rejected...) là trạng thái cuối
 * nên chỉ chính nó được chọn.
 */
export const ORDER_STATUS_FLOW: Record<string, string[]> = {
  Pending: ["Confirmed", "Cancelled"],
  Confirmed: ["Shipping", "Cancelled"],
  Shipping: ["Delivered", "Cancelled"],
  Delivered: [],
  Cancelled: [],
};

/**
 * UNDO có kiểm soát: bấm nhầm / đổi ý — admin chỉ được quay lại ĐÚNG 1 bước với
 * 3 cặp an toàn (khớp với UNDO_TRANSITIONS ở backend admin/orderController.ts):
 *   Delivered → Shipping              : trừ doanh thu khỏi ngày đã ghi nhận (đối xứng lúc cộng)
 *   Cancelled → Pending               : kho bị TRỪ LẠI (backend chặn nếu không đủ kho)
 *   Return Rejected → Return Requested: chỉ đổi nhãn — reject chưa hề đụng kho/tiền, và
 *                                       yêu cầu đổi trả được trả về Pending nên đơn phải
 *                                       quay lại đúng vòng "Yêu cầu đổi trả" để admin
 *                                       duyệt lại (KHÔNG về Delivered: yêu cầu còn mở thì
 *                                       đơn không còn là "Đã giao", nếu không 2 chiều hoàn
 *                                       tác — duyệt nhầm / từ chối nhầm — bị trùng nhau).
 * Return Approved KHÔNG được undo: tiền có thể đã hoàn thật cho khách.
 */
export const UNDO_TRANSITIONS: Record<string, string> = {
  Delivered: "Shipping",
  Cancelled: "Pending",
  "Return Rejected": "Return Requested",
};

/**
 * Kiểm tra admin có được phép chuyển đơn từ trạng thái A sang B hay không.
 * Dùng để disable các <option> không hợp lệ trong dropdown trạng thái.
 *
 * @param currentStatus Trạng thái hiện tại của đơn
 * @param targetStatus  Trạng thái admin muốn chọn
 */
export function isStatusAllowed(currentStatus: string, targetStatus: string): boolean {
  if (currentStatus === targetStatus) return true;
  const current = currentStatus.replace(/_/g, " ");
  if (UNDO_TRANSITIONS[current] === targetStatus) return true;
  return ORDER_STATUS_FLOW[current]?.includes(targetStatus) ?? false;
}

/**
 * Dropdown có bị khoá cứng hoàn toàn không.
 * Trạng thái còn có đường UNDO (Delivered / Cancelled / Return Rejected) thì KHÔNG
 * khoá — dropdown chỉ mở đúng option hiện tại + option hoàn tác.
 * Return Requested / Return Approved vẫn khoá cứng (đi qua nút Approve/Reject riêng).
 * Trạng thái lạ KHÔNG bị khoá để dữ liệu cũ vẫn chỉnh sửa được.
 *
 * @param currentStatus Trạng thái hiện tại của đơn
 */
export function isStatusFlowLocked(currentStatus: string): boolean {
  const normalized = currentStatus.replace(/_/g, " ");
  if (UNDO_TRANSITIONS[normalized]) return false;
  if (RETURN_STATUS_VARIANTS.includes(currentStatus)) return true;
  const allowedTargets = ORDER_STATUS_FLOW[currentStatus];
  return Array.isArray(allowedTargets) && allowedTargets.length === 0;
}

/**
 * Luật chuyển payment_status — MIRROR của ALLOWED_PAYMENT_TRANSITIONS ở backend
 * (admin/orderController.ts → confirmPayment):
 *   Unpaid   → Paid | Refunded
 *   Paid     → Refunded | Unpaid  (lỡ bấm Paid nhầm mà CHƯA thu tiền thật — COD;
 *                                  MoMo/VNPay cần đối chiếu cổng trước, UI có confirm)
 *   Refunded → Paid               (lỡ bấm hoàn nhầm mà chưa chuyển tiền thật)
 * + Refunded chỉ hợp lệ khi đơn đã đóng (Cancelled / Return Approved).
 * Dùng để disable các <option> sai luật trong dropdown thanh toán (giống isStatusAllowed
 * làm với dropdown trạng thái đơn) — thay vì để chọn rồi mới báo "cập nhật thất bại".
 *
 * @param currentPayment payment_status hiện tại của đơn
 * @param targetPayment  payment_status admin muốn chọn
 * @param orderStatus    status hiện tại của đơn (để check điều kiện Refunded)
 */
export function isPaymentAllowed(currentPayment: string, targetPayment: string, orderStatus?: string): boolean {
  if (currentPayment === targetPayment) return true;
  const ALLOWED: Record<string, string[]> = {
    Unpaid: ["Paid", "Refunded"],
    Paid: ["Refunded", "Unpaid"],
    Refunded: ["Paid"],
  };
  if (!ALLOWED[currentPayment]?.includes(targetPayment)) return false;
  if (targetPayment === "Refunded" && currentPayment !== "Refunded") {
    const normalized = (orderStatus || "").replace(/_/g, " ");
    if (normalized !== "Cancelled" && normalized !== "Return Approved") return false;
  }
  return true;
}

/**
 * Đơn đã ĐÓNG (bị hủy / đổi trả xong) — dùng để đổi NGÔN NGỮ hiển thị của payment badge:
 * Unpaid trên đơn đóng = "Chưa thu tiền" (trung tính, xám) — KHÔNG phải "Chờ thanh toán"
 * (cam + đồng hồ, ngụ ý vẫn còn chờ khách trả tiền).
 * Chỉ ảnh hưởng cách trình bày; dữ liệu payment_status không đổi.
 */
export function isClosedOrderStatus(status: string): boolean {
  return status === "Cancelled" || RETURN_STATUS_VARIANTS.includes(status);
}

/**
 * Phân bổ / làm tròn số tiền hoàn cho từng sản phẩm trả hàng thành số nguyên (VNĐ),
 * đồng thời bù trừ số dư chênh lệch (nếu có do làm tròn) vào sản phẩm có giá trị lớn nhất
 * để tổng các sản phẩm luôn khớp 100% với tổng tiền hoàn (refund_amount).
 */
export function balanceReturnItemsRefund<T extends { refund_amount?: number | string; is_gift?: boolean }>(
  items: T[] | null | undefined,
  totalRefundAmount?: number | string | null
): T[] {
  if (!items || !items.length) return [];
  const expectedTotal = totalRefundAmount != null ? Math.round(Number(totalRefundAmount) || 0) : null;

  // Làm tròn số nguyên cho từng item
  const balanced = items.map((item) => ({
    ...item,
    refund_amount: item.is_gift ? 0 : Math.round(Number(item.refund_amount) || 0),
  }));

  if (expectedTotal !== null && expectedTotal >= 0) {
    const currentSum = balanced.reduce((sum, it) => sum + (Number(it.refund_amount) || 0), 0);
    const diff = expectedTotal - currentSum;
    if (diff !== 0) {
      // Tìm item non-gift có refund_amount lớn nhất để bù trừ
      let maxIdx = -1;
      let maxVal = -Infinity;
      balanced.forEach((it, idx) => {
        if (!it.is_gift && Number(it.refund_amount || 0) > maxVal) {
          maxVal = Number(it.refund_amount || 0);
          maxIdx = idx;
        }
      });
      if (maxIdx >= 0) {
        balanced[maxIdx].refund_amount = (Number(balanced[maxIdx].refund_amount) || 0) + diff;
      }
    }
  }

  return balanced;
}

export const ORDER_STATUS_COLORS = {
  Pending: "#ffc107",
  Confirmed: "#17a2b8",
  Shipping: "#007bff",
  Delivered: "#28a745",
  Cancelled: "#dc3545",
  "Return Requested": "#fd7e14",
  "Return_Requested": "#fd7e14",
  "Return Rejected": "#6c757d",
  "Return_Rejected": "#6c757d",
  "Return Approved": "#6f42c1",
  "Return_Approved": "#6f42c1",
};

export const PAYMENT_STATUS_COLORS = {
  Unpaid: "#dc3545",
  Paid: "#28a745",
  Refunded: "#6f42c1",
};
