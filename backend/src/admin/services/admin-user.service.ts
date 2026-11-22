import { Injectable } from '@nestjs/common';
import bcrypt from 'bcryptjs';
import { PrismaService } from '../../prisma/prisma.service';
import { AppError } from '../../utils/AppError';
import {
  EMAIL_REGEX,
  normalizeRole,
  parseId,
  validatePassword,
  validatePhone,
} from '../utils/userValidation';

export const ADMIN_USER_SAFE_SELECT = {
  id: true,
  name: true,
  email: true,
  phone: true,
  role: true,
  total_spent: true,
  membership_id: true,
  created_at: true,
} as const;

export const ADMIN_MEMBERSHIP_SELECT = {
  id: true,
  name: true,
  name_vi: true,
  name_en: true,
  discount_percent: true,
} as const;

@Injectable()
export class AdminUserService {
  constructor(private readonly prisma: PrismaService) {}

  private async resolveMembershipId(value: unknown): Promise<number | null> {
    if (value === null || value === undefined || value === '') {
      const normal = await this.prisma.membership.findFirst({ where: { min_spending: 0 }, orderBy: { id: 'asc' } });
      return normal?.id ?? null;
    }
    const id = Number(value);
    if (!Number.isInteger(id) || id <= 0) throw new AppError('Invalid membership id', 400);
    const membership = await this.prisma.membership.findUnique({ where: { id } });
    if (!membership) throw new AppError('Membership tier not found', 404);
    return id;
  }

  async getUsers(query: { search?: string; role?: string; page?: string; limit?: string }) {
    const keyword = (query.search || '').trim();
    const where: Record<string, unknown> = {};
    if (query.role === 'admin' || query.role === 'customer') where.role = query.role;
    if (keyword) where.OR = [
      { name: { contains: keyword } },
      { email: { contains: keyword } },
      { phone: { contains: keyword } },
    ];

    if (query.page === undefined && query.limit === undefined) {
      const users = await this.prisma.user.findMany({
        where: where as never,
        select: { ...ADMIN_USER_SAFE_SELECT, membership: { select: ADMIN_MEMBERSHIP_SELECT }, _count: { select: { orders: true } } },
        orderBy: [{ created_at: 'desc' }, { id: 'desc' }],
      });
      return { data: users };
    }
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
    const [users, totalUsers] = await Promise.all([
      this.prisma.user.findMany({
        where: where as never,
        skip: (page - 1) * limit,
        take: limit,
        select: { ...ADMIN_USER_SAFE_SELECT, membership: { select: ADMIN_MEMBERSHIP_SELECT }, _count: { select: { orders: true } } },
        orderBy: [{ created_at: 'desc' }, { id: 'desc' }],
      }),
      this.prisma.user.count({ where: where as never }),
    ]);
    return { data: users, currentPage: page, totalPages: Math.ceil(totalUsers / limit) || 1, totalUsers };
  }

  async getUserDetail(rawId: string) {
    const id = parseId(rawId, 'user');
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        ...ADMIN_USER_SAFE_SELECT,
        membership: { select: ADMIN_MEMBERSHIP_SELECT },
        orders: {
          select: { id: true, status: true, payment_status: true, payment_method: true, total_price: true, created_at: true },
          orderBy: { created_at: 'desc' },
          take: 10,
        },
        _count: { select: { orders: true, interactions: true } },
      },
    });
    if (!user) throw new AppError('User not found', 404);
    return { data: user };
  }

  async createUser(payload: Record<string, unknown>) {
    const { name, email, phone, password, role, membership_id } = payload;
    const trimmedName = typeof name === 'string' ? name.trim() : '';
    const trimmedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
    if (!trimmedName) throw new AppError('Name is required', 400);
    if (!EMAIL_REGEX.test(trimmedEmail)) throw new AppError('Invalid email format', 400);
    const plainPassword = validatePassword(password);
    const trimmedPhone = validatePhone(phone);
    if (await this.prisma.user.findUnique({ where: { email: trimmedEmail } })) throw new AppError('Email is already registered', 400);
    if (trimmedPhone && await this.prisma.user.findUnique({ where: { phone: trimmedPhone } })) throw new AppError('Phone number is already in use', 400);
    const passwordHash = await bcrypt.hash(plainPassword, 10);
    const membershipId = await this.resolveMembershipId(membership_id);
    const created = await this.prisma.user.create({
      data: { name: trimmedName, email: trimmedEmail, phone: trimmedPhone, password: passwordHash, role: normalizeRole(role), membership_id: membershipId },
      select: { ...ADMIN_USER_SAFE_SELECT, membership: { select: ADMIN_MEMBERSHIP_SELECT } },
    });
    return { message: 'User account created successfully', data: created };
  }

  async updateUser(rawId: string, currentAdminId: number | undefined, payload: Record<string, unknown>) {
    const id = parseId(rawId, 'user');
    const { name, phone, role, membership_id } = payload;
    const existing = await this.prisma.user.findUnique({ where: { id } });
    if (!existing) throw new AppError('User not found', 404);
    const data: Record<string, unknown> = {};
    if (name !== undefined) {
      const trimmedName = typeof name === 'string' ? name.trim() : '';
      if (!trimmedName) throw new AppError('Name is required', 400);
      data.name = trimmedName;
    }
    if (phone !== undefined) {
      const trimmedPhone = validatePhone(phone);
      if (trimmedPhone && trimmedPhone !== existing.phone && await this.prisma.user.findUnique({ where: { phone: trimmedPhone } })) {
        throw new AppError('Phone number is already in use', 400);
      }
      data.phone = trimmedPhone;
    }
    if (role !== undefined) {
      const nextRole = normalizeRole(role);
      if (id === currentAdminId && nextRole !== 'admin') throw new AppError('You cannot remove your own admin role', 400);
      if (existing.role === 'admin' && nextRole !== 'admin' && await this.prisma.user.count({ where: { role: 'admin' } }) <= 1) {
        throw new AppError('Cannot demote the last admin account', 400);
      }
      if (nextRole !== existing.role) {
        data.role = nextRole;
        data.refresh_token = null;
      }
    }
    if (membership_id !== undefined) data.membership_id = await this.resolveMembershipId(membership_id);
    if (!Object.keys(data).length) throw new AppError('No changes provided', 400);
    const updated = await this.prisma.user.update({
      where: { id },
      data: data as never,
      select: { ...ADMIN_USER_SAFE_SELECT, membership: { select: ADMIN_MEMBERSHIP_SELECT } },
    });
    return { message: 'User account updated successfully', data: updated };
  }

  async resetUserPassword(rawId: string, payload: Record<string, unknown>) {
    const id = parseId(rawId, 'user');
    const plainPassword = validatePassword(payload.newPassword ?? payload.password);
    const existing = await this.prisma.user.findUnique({ where: { id }, select: { id: true } });
    if (!existing) throw new AppError('User not found', 404);
    const passwordHash = await bcrypt.hash(plainPassword, 10);
    await this.prisma.user.update({ where: { id }, data: { password: passwordHash, refresh_token: null } });
    return { message: 'Password reset successfully' };
  }

  async deleteUser(rawId: string, currentAdminId: number | undefined) {
    const id = parseId(rawId, 'user');
    if (id === currentAdminId) throw new AppError('You cannot delete your own account', 400);
    const existing = await this.prisma.user.findUnique({ where: { id }, select: { id: true, role: true, _count: { select: { orders: true } } } });
    if (!existing) throw new AppError('User not found', 404);
    if (existing._count.orders > 0) throw new AppError('Cannot delete a user who already has orders', 400);
    if (existing.role === 'admin' && await this.prisma.user.count({ where: { role: 'admin' } }) <= 1) {
      throw new AppError('Cannot delete the last admin account', 400);
    }
    await this.prisma.user.delete({ where: { id } });
    return { message: 'User account deleted successfully' };
  }
}
