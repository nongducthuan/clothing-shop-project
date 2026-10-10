// Chính sách đổi trả: chỉ nhận yêu cầu trong vòng 7 ngày kể từ khi giao hàng.
// Đây là NGUỒN DUY NHẤT của quy tắc: backend chặn ở submitReturnRequest, đồng thời
// formatOrderResponse trả `can_return` / `return_deadline` để frontend ẩn nút (không tự tính lại).

export const RETURN_WINDOW_DAYS = 7;
const DAY_MS = 24 * 60 * 60 * 1000;

type DateLike = Date | string | null | undefined;
export type ReturnWindowOrder = { delivered_at?: DateLike; updated_at?: DateLike };

export class ReturnWindowExpiredError extends Error {
    constructor() {
        super(`Return period has expired. Returns are accepted within ${RETURN_WINDOW_DAYS} days of delivery.`);
        this.name = 'ReturnWindowExpiredError';
    }
}

/**
 * Hạn chót gửi yêu cầu đổi trả. Mốc bắt đầu là `delivered_at`; đơn cũ chưa có `delivered_at`
 * thì dùng `updated_at` làm mốc gần đúng. Không xác định được mốc → null (không chặn).
 */
export function getReturnDeadline(order: ReturnWindowOrder): Date | null {
    const raw = order.delivered_at ?? order.updated_at;
    if (!raw) return null;
    const start = new Date(raw);
    if (Number.isNaN(start.getTime())) return null;
    return new Date(start.getTime() + RETURN_WINDOW_DAYS * DAY_MS);
}

export function isWithinReturnWindow(order: ReturnWindowOrder, now: Date = new Date()): boolean {
    const deadline = getReturnDeadline(order);
    return deadline === null || now.getTime() <= deadline.getTime();
}
