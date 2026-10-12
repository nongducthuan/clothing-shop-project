// Hằng số trạng thái đơn hàng dùng chung cho admin/customer controller và orderStatusService.

export const ENUM_TO_DISPLAY_STATUS: Record<string, string> = {
    "Return_Requested": "Return Requested",
    "Return_Rejected":  "Return Rejected",
    "Return_Approved":  "Return Approved",
};

// Map display names (with spaces, as sent by frontend) → Prisma enum names (with underscores)
export const STATUS_DISPLAY_TO_ENUM: Record<string, string> = {
    "Return Requested": "Return_Requested",
    "Return Rejected":  "Return_Rejected",
    "Return Approved":  "Return_Approved",
};

// Luồng trạng thái hợp lệ (khớp với frontend/src/utils/orderUtils.ts):
// Pending → Confirmed → Shipping → Delivered, hoặc Cancelled ở bất kỳ bước nào.
// Phải validate ở backend vì UI chỉ chặn được ở dropdown —
// gọi API trực tiếp vẫn có thể nhảy bước và làm sai kho/doanh thu.
export const ALLOWED_STATUS_TRANSITIONS: Record<string, string[]> = {
    Pending: ["Confirmed", "Cancelled"],
    Confirmed: ["Shipping", "Cancelled"],
    Shipping: ["Delivered", "Cancelled"],
    Delivered: [],
    Cancelled: [],
};

// 3 trạng thái đổi trả chỉ được đổi qua /return/approve hoặc /return/reject
export const RETURN_STATUS_ENUMS = ["Return_Requested", "Return_Approved", "Return_Rejected"];

// Admin bấm nhầm hay đổi ý: cho phép quay lại đúng 3 cặp an toàn, mỗi cặp có
// hậu quả đảo chiều được changeOrderStatusLogic xử lý đối xứng:
//   Delivered → Shipping            : trừ doanh thu/total_spent đúng ngày delivered_at
//   Cancelled → Pending             : trừ lại kho (chặn nếu không đủ kho)
//   Return_Rejected → Return_Requested : chỉ đổi nhãn (reject chưa đụng kho/tiền) và trả
//                                     yêu cầu đổi trả về Pending → đơn quay lại đúng vòng
//                                     "chờ duyệt đổi trả" như khi khách vừa gửi yêu cầu.
//                                     KHÔNG đưa về Delivered: yêu cầu còn mở thì đơn không
//                                     còn là "Đã giao", và nếu để Delivered thì 2 chiều
//                                     hoàn tác (duyệt nhầm / từ chối nhầm) bị trùng nhau.
// Mọi cặp khác vẫn bị chặn: Return_Approved → Delivered bị cấm vì tiền có thể
// đã hoàn thật cho khách, undo sẽ làm sổ lệch ngoài hệ thống.
export const UNDO_TRANSITIONS: Record<string, string> = {
    "Delivered": "Shipping",
    "Cancelled": "Pending",
    "Return_Rejected": "Return_Requested",
};

export const isUndoTransition = (from: string, to: string): boolean =>
    UNDO_TRANSITIONS[from] === to;

// Rank tiến trình của luồng chính, dùng để CHỐNG ĐI LÙI trong changeOrderStatusLogic.
// Webhook IPN (MoMo/VNPay) có thể đến TRỄ hoặc được gateway retry nhiều lần: nếu admin
// đã đẩy đơn lên Shipping/Delivered mà IPN vẫn yêu cầu set về 'Confirmed' thì phải chặn,
// nếu không doanh thu/total_spent sẽ bị trừ sai (Delivered → khác = -total_price).
// - Cùng rank (IPN retry / no-op) → cho phép, idempotent.
// - Cancelled và 3 trạng thái Return_* không nằm trong rank → luôn cho phép
//   (hủy/đổi trả là luồng riêng; admin API còn có ALLOWED_STATUS_TRANSITIONS chặn trước).
// - Guard chỉ chặn phần TRẠNG THÁI ĐƠN; payment_status do caller set TRƯỚC khi gọi
//   hàm này nên tiền đã thu vẫn được ghi nhận bình thường.
export const STATUS_RANK: Record<string, number> = {
    Pending: 1,
    Confirmed: 2,
    Shipping: 3,
    Delivered: 4,
    Return_Requested: 5,
    Return_Rejected: 5,
    Return_Approved: 5,
};
