import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../../../prisma/client';
import { catchAsync } from '../../utils/catchAsync';
import { AppError } from '../../utils/AppError';

/**
 * Quản lý người dùng (Admin) — danh sách / tạo / sửa / đặt lại mật khẩu / xóa.
 *
 * Nguyên tắc an toàn:
 *  - Không bao giờ trả về `password` hay `refresh_token` (chỉ dùng USER_SAFE_SELECT).
 *  - Admin không thể tự hạ quyền hoặc tự xóa chính mình (tránh tự khóa cửa vào hệ thống).
 *  - Không thể hạ quyền / xóa admin cuối cùng của hệ thống.
 *  - Đổi vai trò hoặc đặt lại mật khẩu sẽ thu hồi `refresh_token` => phiên cũ phải đăng nhập lại.
 */

const USER_SAFE_SELECT = {
    id: true,
    name: true,
    email: true,
    phone: true,
    role: true,
    total_spent: true,
    membership_id: true,
    created_at: true,
} as const;

const MEMBERSHIP_SELECT = {
    id: true,
    name: true,
    name_vi: true,
    name_en: true,
    discount_percent: true,
} as const;

const PHONE_REGEX = /^[0-9]{10,11}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 6;

const parseId = (raw: unknown, label: string): number => {
    const id = Number(raw);
    if (!Number.isInteger(id) || id <= 0) {
        throw new AppError(`Invalid ${label} id`, 400);
    }
    return id;
};

/** Chỉ nhận 2 giá trị hợp lệ của enum UserRole, mọi giá trị khác coi như customer. */
const normalizeRole = (role: unknown): 'admin' | 'customer' => (role === 'admin' ? 'admin' : 'customer');

const validatePassword = (password: unknown): string => {
    const value = typeof password === 'string' ? password : '';
    if (value.length < MIN_PASSWORD_LENGTH) {
        throw new AppError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters`, 400);
    }
    return value;
};

const validatePhone = (phone: unknown): string | null => {
    const value = typeof phone === 'string' ? phone.trim() : '';
    if (!value) return null;
    if (!PHONE_REGEX.test(value)) {
        throw new AppError('Phone must be 10-11 digits', 400);
    }
    return value;
};

/** Kiểm tra hạng thành viên tồn tại trước khi gán.
 * Thống nhất mới/cũ đều là "Thường" (min_spending = 0): giá trị rỗng (""/null)
 * được coi như "chưa chọn" => tự thay bằng hạng "Thường" thay vì giữ null
 * ("Chưa có hạng"). Chỉ khi không tìm thấy hạng nào trong DB mới trả về null. */
const resolveMembershipId = async (membershipId: unknown): Promise<number | null> => {
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
const resolveDefaultMembershipId = async (): Promise<number | null> => {
    const normalMembership = await prisma.membership.findFirst({
        where: { min_spending: 0 },
        orderBy: { id: 'asc' },
    });
    return normalMembership ? normalMembership.id : null;
};

/**
 * GET /admin/users
 * Hỗ trợ phân trang: ?page= & ?limit= (mặc định 20, max 100).
 * Hỗ trợ lọc phía server: ?search= (tên/email/SĐT) & ?role= (admin|customer).
 */
export const getUsers = catchAsync(async (req: Request, res: Response) => {
    const { search, role, page, limit } = req.query as {
        search?: string;
        role?: string;
        page?: string;
        limit?: string;
    };
    const keyword = (search || '').trim();

    const where: Record<string, unknown> = {};

    if (role === 'admin' || role === 'customer') {
        where.role = role;
    }

    if (keyword) {
        where.OR = [
            { name: { contains: keyword } },
            { email: { contains: keyword } },
            { phone: { contains: keyword } },
        ];
    }

    // Nếu không truyền cả page và limit, giữ tương thích ngược trả toàn bộ danh sách
    if (page === undefined && limit === undefined) {
        const users = await prisma.user.findMany({
            where,
            select: {
                ...USER_SAFE_SELECT,
                membership: { select: MEMBERSHIP_SELECT },
                _count: { select: { orders: true } },
            },
            orderBy: [{ created_at: 'desc' }, { id: 'desc' }],
        });

        res.status(200).json({ data: users });
        return;
    }

    const p = Math.max(1, Number(page) || 1);
    const l = Math.min(100, Math.max(1, Number(limit) || 20));
    const offset = (p - 1) * l;

    const [users, totalUsers] = await Promise.all([
        prisma.user.findMany({
            where,
            skip: offset,
            take: l,
            select: {
                ...USER_SAFE_SELECT,
                membership: { select: MEMBERSHIP_SELECT },
                _count: { select: { orders: true } },
            },
            orderBy: [{ created_at: 'desc' }, { id: 'desc' }],
        }),
        prisma.user.count({ where }),
    ]);

    res.status(200).json({
        data: users,
        currentPage: p,
        totalPages: Math.ceil(totalUsers / l) || 1,
        totalUsers,
    });
});

/**
 * GET /admin/users/:id
 * Kèm 10 đơn hàng gần nhất để admin đối chiếu chi tiêu / lịch sử mua.
 */
export const getUserDetail = catchAsync(async (req: Request, res: Response) => {
    const id = parseId(req.params.id, 'user');

    const user = await prisma.user.findUnique({
        where: { id },
        select: {
            ...USER_SAFE_SELECT,
            membership: { select: MEMBERSHIP_SELECT },
            orders: {
                select: {
                    id: true,
                    status: true,
                    payment_status: true,
                    payment_method: true,
                    total_price: true,
                    created_at: true,
                },
                orderBy: { created_at: 'desc' },
                take: 10,
            },
            _count: { select: { orders: true, interactions: true } },
        },
    });

    if (!user) {
        throw new AppError('User not found', 404);
    }

    res.status(200).json({ data: user });
});

/**
 * POST /admin/users
 * Tạo tài khoản mới từ trang quản trị (khách tự đăng ký là luồng khác).
 */
export const createUser = catchAsync(async (req: Request, res: Response) => {
    const { name, email, phone, password, role, membership_id } = req.body;

    const trimmedName = typeof name === 'string' ? name.trim() : '';
    const trimmedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';

    if (!trimmedName) {
        throw new AppError('Name is required', 400);
    }
    if (!EMAIL_REGEX.test(trimmedEmail)) {
        throw new AppError('Invalid email format', 400);
    }

    const plainPassword = validatePassword(password);
    const trimmedPhone = validatePhone(phone);

    const existingEmail = await prisma.user.findUnique({ where: { email: trimmedEmail } });
    if (existingEmail) {
        throw new AppError('Email is already registered', 400);
    }

    if (trimmedPhone) {
        const existingPhone = await prisma.user.findUnique({ where: { phone: trimmedPhone } });
        if (existingPhone) {
            throw new AppError('Phone number is already in use', 400);
        }
    }

    const hashedPassword = await bcrypt.hash(plainPassword, 10);
    const membershipId =
        membership_id === undefined || membership_id === null || membership_id === ''
            ? await resolveDefaultMembershipId()
            : await resolveMembershipId(membership_id);

    const created = await prisma.user.create({
        data: {
            name: trimmedName,
            email: trimmedEmail,
            phone: trimmedPhone,
            password: hashedPassword,
            role: normalizeRole(role),
            membership_id: membershipId,
        },
        select: { ...USER_SAFE_SELECT, membership: { select: MEMBERSHIP_SELECT } },
    });

    res.status(201).json({ message: 'User account created successfully', data: created });
});

/**
 * PUT /admin/users/:id
 * Chỉ cập nhật thông tin hồ sơ + vai trò + hạng thành viên (mật khẩu có endpoint riêng).
 */
export const updateUser = catchAsync(async (req: Request, res: Response) => {
    const id = parseId(req.params.id, 'user');
    const currentAdminId = req.user?.id;
    const { name, phone, role, membership_id } = req.body;

    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) {
        throw new AppError('User not found', 404);
    }

    const data: Record<string, unknown> = {};

    if (name !== undefined) {
        const trimmedName = typeof name === 'string' ? name.trim() : '';
        if (!trimmedName) {
            throw new AppError('Name is required', 400);
        }
        data.name = trimmedName;
    }

    if (phone !== undefined) {
        const trimmedPhone = validatePhone(phone);
        if (trimmedPhone && trimmedPhone !== existing.phone) {
            const duplicated = await prisma.user.findUnique({ where: { phone: trimmedPhone } });
            if (duplicated) {
                throw new AppError('Phone number is already in use', 400);
            }
        }
        data.phone = trimmedPhone;
    }

    if (role !== undefined) {
        const nextRole = normalizeRole(role);

        if (id === currentAdminId && nextRole !== 'admin') {
            throw new AppError('You cannot remove your own admin role', 400);
        }

        if (existing.role === 'admin' && nextRole !== 'admin') {
            const adminCount = await prisma.user.count({ where: { role: 'admin' } });
            if (adminCount <= 1) {
                throw new AppError('Cannot demote the last admin account', 400);
            }
        }

        if (nextRole !== existing.role) {
            data.role = nextRole;
            // Thu hồi refresh token: access token cũ vẫn mang quyền admin tối đa 15 phút.
            data.refresh_token = null;
        }
    }

    if (membership_id !== undefined) {
        data.membership_id = await resolveMembershipId(membership_id);
    }

    if (Object.keys(data).length === 0) {
        throw new AppError('No changes provided', 400);
    }

    const updated = await prisma.user.update({
        where: { id },
        data,
        select: { ...USER_SAFE_SELECT, membership: { select: MEMBERSHIP_SELECT } },
    });

    res.status(200).json({ message: 'User account updated successfully', data: updated });
});

/**
 * PUT /admin/users/:id/password
 * Admin đặt lại mật khẩu hộ khách (quên mật khẩu) và thu hồi mọi phiên đăng nhập cũ.
 */
export const resetUserPassword = catchAsync(async (req: Request, res: Response) => {
    const id = parseId(req.params.id, 'user');
    const { newPassword, password } = req.body;
    const plainPassword = validatePassword(newPassword ?? password);

    const existing = await prisma.user.findUnique({ where: { id }, select: { id: true } });
    if (!existing) {
        throw new AppError('User not found', 404);
    }

    const hashedPassword = await bcrypt.hash(plainPassword, 10);
    await prisma.user.update({
        where: { id },
        // Đặt lại mật khẩu phải kèm thu hồi refresh token => mọi phiên cũ bị đăng xuất.
        data: { password: hashedPassword, refresh_token: null },
    });

    res.status(200).json({ message: 'Password reset successfully' });
});

/**
 * DELETE /admin/users/:id
 * Chỉ xóa được tài khoản chưa phát sinh đơn hàng (giữ toàn vẹn lịch sử đơn).
 */
export const deleteUser = catchAsync(async (req: Request, res: Response) => {
    const id = parseId(req.params.id, 'user');

    if (id === req.user?.id) {
        throw new AppError('You cannot delete your own account', 400);
    }

    const existing = await prisma.user.findUnique({
        where: { id },
        select: { id: true, role: true, _count: { select: { orders: true } } },
    });

    if (!existing) {
        throw new AppError('User not found', 404);
    }

    if (existing._count.orders > 0) {
        throw new AppError('Cannot delete a user who already has orders', 400);
    }

    if (existing.role === 'admin') {
        const adminCount = await prisma.user.count({ where: { role: 'admin' } });
        if (adminCount <= 1) {
            throw new AppError('Cannot delete the last admin account', 400);
        }
    }

    await prisma.user.delete({ where: { id } });

    res.status(200).json({ message: 'User account deleted successfully' });
});
