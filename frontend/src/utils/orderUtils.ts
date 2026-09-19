// ─── ORDER UTILITIES ──────────────────────────────────────────────────────────
// Nguồn dữ liệu DUY NHẤT cho các enum trạng thái đơn hàng và luật chuyển trạng thái.
// Khớp với enum trong DB (backend/database/schema.sql - bảng orders):
// Pending | Confirmed | Shipping | Delivered | Cancelled |
// Return Requested | Return Rejected | Return Approved
// Được dùng chung bởi: useOrderManager, useOrderFilters, OrderTable (desktop), OrderCard (mobile).

// ─── STATUS LISTS ─────────────────────────────────────────────────────────────

/** 5 trạng thái của luồng giao hàng chuẩn */
export const STANDARD_STATUSES = ["Pending", "Confirmed", "Shipping", "Delivered", "Cancelled"];

/** 3 trạng thái đổi trả (tab Returns) */
export const RETURN_STATUSES = ["Return Requested", "Return Rejected", "Return Approved"];

/** Toàn bộ trạng thái hiển thị trên dropdown / bộ lọc */
export const STATUS_OPTIONS = [...STANDARD_STATUSES, ...RETURN_STATUSES];

/** 3 trạng thái thanh toán của đơn hàng */
export const PAYMENT_OPTIONS = ["Unpaid", "Paid", "Refunded"];

/**
 * Trạng thái đổi trả tồn tại ở 2 dạng giá trị:
 * dạng hiển thị ("Return Requested") và dạng enum DB ("Return_Requested").
 * Sinh tự động từ RETURN_STATUSES → thêm trạng thái mới chỉ phải sửa 1 chỗ.
 */
export const RETURN_STATUS_VARIANTS: string[] = RETURN_STATUSES.flatMap((status) => [
  status,
  status.replace(/\s+/g, "_"),
]);

// ─── STATUS FLOW GUARD ────────────────────────────────────────────────────────

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
 *   Delivered → Shipping        : trừ doanh thu khỏi ngày đã ghi nhận (đối xứng lúc cộng)
 *   Cancelled → Pending         : kho bị TRỪ LẠI (backend chặn nếu không đủ kho)
 *   Return Rejected → Delivered : chỉ đổi nhãn — reject chưa hề đụng kho/tiền
 * Return Approved KHÔNG được undo: tiền có thể đã hoàn thật cho khách.
 */
export const UNDO_TRANSITIONS: Record<string, string> = {
  Delivered: "Shipping",
  Cancelled: "Pending",
  "Return Rejected": "Delivered",
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
 * Đơn đã ĐÓNG (bị hủy / đổi trả xong) — dùng để đổi NGÔN NGỮ hiển thị của payment badge:
 * Unpaid trên đơn đóng = "Chưa thu tiền" (trung tính, xám) — KHÔNG phải "Chờ thanh toán"
 * (cam + đồng hồ, ngụ ý vẫn còn chờ khách trả tiền).
 * Chỉ ảnh hưởng cách trình bày; dữ liệu payment_status không đổi.
 */
export function isClosedOrderStatus(status: string): boolean {
  return status === "Cancelled" || RETURN_STATUS_VARIANTS.includes(status);
}
