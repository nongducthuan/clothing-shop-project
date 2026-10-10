import prisma from '../../prisma/client';
import { AppError } from '../utils/AppError';

export const USER_SAFE_SELECT = {
    id: true,
    name: true,
    email: true,
    phone: true,
    role: true,
    total_spent: true,
    membership_id: true,
    created_at: true,
} as const;

export const MEMBERSHIP_SELECT = {
    id: true,
    name: true,
    name_vi: true,
    name_en: true,
    discount_percent: true,
} as const;

/** Kiểm tra hạng thành viên tồn tại trước khi gán.
 * Thống nhất mới/cũ đều là "Thường" (min_spending = 0): giá trị rỗng (""/null)
 * được coi như "chưa chọn" => tự thay bằng hạng "Thường" thay vì giữ null
 * ("Chưa có hạng"). Chỉ khi không tìm thấy hạng nào trong DB mới trả về null. */
export const resolveMembershipId = async (membershipId: unknown): Promise<number | null> => {
    // Thống nhất: rỗng/null => gán "Thường" thay vì giữ null ("Chưa có hạng").
    if (membershipId === null || membershipId === undefined || membershipId === '') {
        return resolveDefaultMembershipId();
    }

    const id = Number(membershipId);
    if (!Number.isInteger(id) || id <= 0) {
        throw new AppError('Invalid membership id', 400);
    }

    const membership = await prisma.membership.findUnique({ where: { id } });
    if (!membership) {
        throw new AppError('Membership tier not found', 404);
    }
    return id;
};

/** Hạng mặc định cho tài khoản mới — giống lúc khách tự đăng ký (min_spending = 0). */
export const resolveDefaultMembershipId = async (): Promise<number | null> => {
    const normalMembership = await prisma.membership.findFirst({
        where: { min_spending: 0 },
        orderBy: { id: 'asc' },
    });
    return normalMembership ? normalMembership.id : null;
};
