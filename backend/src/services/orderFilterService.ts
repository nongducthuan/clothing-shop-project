import type { Prisma } from '../generated/prisma/client';
import { STATUS_DISPLAY_TO_ENUM } from '../constants/orderStatus';

// Bộ lọc tab + trạng thái vì vậy phải chạy cùng phân trang ngay tại server.

/** 3 trạng thái đổi trả ở dạng enum Prisma (DB lưu "Return Requested") */
const RETURN_ENUM_STATUSES = ['Return_Requested', 'Return_Rejected', 'Return_Approved'] as const;

/** Trạng thái đổi trả ở dạng hiển thị (như frontend gửi lên) */
const RETURN_STATUS_OPTIONS = ['Return Requested', 'Return Rejected', 'Return Approved'];

/** 5 trạng thái luồng giao hàng chuẩn (tab "Quản lý Đơn hàng") */
const STANDARD_STATUS_OPTIONS = ['Pending', 'Confirmed', 'Shipping', 'Delivered', 'Cancelled'];

/**
 * Đơn ĐÃ GIAO nhưng yêu cầu đổi trả còn Pending (admin hoàn tác duyệt nhầm) được
 * UI hiển thị như "Return Requested" → server phải lọc y hệt, nếu không đơn này
 * vừa nằm sai tab vừa biến mất khỏi tab đổi trả.
 */
const PENDING_REDO_FILTER: Prisma.OrderWhereInput = {
    status: 'Delivered',
    return_request: { status: 'Pending' },
};

/**
 * Dựng `where` cho danh sách đơn của admin theo tab + trạng thái đang chọn.
 * - tab=Standard: đơn luồng giao hàng (bỏ mọi đơn thuộc luồng đổi trả)
 * - tab=Returns : chỉ đơn thuộc luồng đổi trả
 * - status      : "All" hoặc 1 trạng thái hiển thị; giá trị lạ → coi như "All"
 * Không truyền `tab` (client cũ / gọi API trực tiếp) → KHÔNG lọc, giữ hành vi cũ.
 */
export const buildOrderFilter = (tab?: unknown, status?: unknown): Prisma.OrderWhereInput | undefined => {
    if (tab !== 'Standard' && tab !== 'Returns') return undefined;

    const wanted = typeof status === 'string' && status.trim() ? status.trim() : 'All';
    const isKnownStatus =
        STANDARD_STATUS_OPTIONS.includes(wanted) || RETURN_STATUS_OPTIONS.includes(wanted);
    const enumStatus = STATUS_DISPLAY_TO_ENUM[wanted] || wanted;

    if (tab === 'Standard') {
        const conditions: Prisma.OrderWhereInput[] = [
            { status: { notIn: [...RETURN_ENUM_STATUSES] } },
            { NOT: PENDING_REDO_FILTER },
        ];
        // Trạng thái cụ thể: Delivered vẫn phải loại đơn đang chờ duyệt lại đổi trả.
        if (isKnownStatus && wanted !== 'All') conditions.push({ status: enumStatus as Prisma.OrderWhereInput['status'] });
        return { AND: conditions };
    }

    // tab=Returns: chỉ đơn đang ở luồng đổi trả (hoặc Delivered chờ duyệt lại)
    if (wanted === 'All' || !isKnownStatus) {
        return { OR: [{ status: { in: [...RETURN_ENUM_STATUSES] } }, PENDING_REDO_FILTER] };
    }
    if (wanted === 'Return Requested') {
        return { OR: [{ status: 'Return_Requested' }, PENDING_REDO_FILTER] };
    }
    return { status: enumStatus as Prisma.OrderWhereInput['status'] };
};
