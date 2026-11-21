import bcrypt from 'bcryptjs';
import { AdminUserService } from '../../admin/services/admin-user.service';
import { PrismaService } from '../../prisma/prisma.service';
import { AppError } from '../../utils/AppError';

jest.mock('bcryptjs', () => ({
  __esModule: true,
  default: {
    hash: jest.fn(async (value: string) => `hashed:${value}`),
    compare: jest.fn(async () => true),
  },
}));

const prismaMock = {
  user: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    count: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  membership: {
    findFirst: jest.fn(),
    findUnique: jest.fn(),
  },
};

const service = new AdminUserService(prismaMock as unknown as PrismaService);
const ADMIN_ID = 1;

beforeEach(() => {
  jest.clearAllMocks();
});

describe('AdminUserService.getUsers – bộ lọc danh sách người dùng', () => {
  it('dựng điều kiện OR khi có ?search= và lọc theo ?role=', async () => {
    prismaMock.user.findMany.mockResolvedValue([{ id: 2, name: 'Khach A' }]);

    const result = await service.getUsers({ search: '  khach ', role: 'customer' });

    expect(prismaMock.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          role: 'customer',
          OR: [
            { name: { contains: 'khach' } },
            { email: { contains: 'khach' } },
            { phone: { contains: 'khach' } },
          ],
        },
      })
    );
    expect(result).toEqual({ data: [{ id: 2, name: 'Khach A' }] });
  });

  it('không truyền bộ lọc nào thì trả về toàn bộ người dùng', async () => {
    prismaMock.user.findMany.mockResolvedValue([]);

    const result = await service.getUsers({});

    expect(prismaMock.user.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: {} }));
    expect(result).toEqual({ data: [] });
  });

  it('hỗ trợ phân trang khi truyền page và limit', async () => {
    prismaMock.user.findMany.mockResolvedValue([{ id: 3, name: 'Khach B' }]);
    prismaMock.user.count.mockResolvedValue(45);

    const result = await service.getUsers({ page: '2', limit: '20' });

    expect(prismaMock.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: 20,
        take: 20,
      })
    );
    expect(prismaMock.user.count).toHaveBeenCalled();
    expect(result).toEqual({
      data: [{ id: 3, name: 'Khach B' }],
      currentPage: 2,
      totalPages: 3,
      totalUsers: 45,
    });
  });
});

describe('AdminUserService.createUser – tạo tài khoản từ trang quản trị', () => {
  it('chặn email đã tồn tại (400), không gọi create', async () => {
    prismaMock.user.findUnique.mockResolvedValue({ id: 5, email: 'cu@shop.com' });

    await expect(service.createUser({
      name: 'Khach Moi', email: 'CU@shop.com', phone: '0912345678', password: '123456',
    })).rejects.toThrow(AppError);

    expect(prismaMock.user.create).not.toHaveBeenCalled();
  });

  it('mật khẩu dưới 6 ký tự bị chặn trước khi chạm DB', async () => {
    await expect(service.createUser({
      name: 'Khach Moi', email: 'moi@shop.com', phone: '0912345678', password: '123',
    })).rejects.toThrow(AppError);

    expect(prismaMock.user.findUnique).not.toHaveBeenCalled();
  });

  it('tạo thành công: hash mật khẩu, chuẩn hóa email thường và gán hạng mặc định', async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);
    prismaMock.membership.findFirst.mockResolvedValue({ id: 3, min_spending: 0 });
    prismaMock.user.create.mockResolvedValue({ id: 10, email: 'moi@shop.com' });

    const result = await service.createUser({
      name: '  Khach Moi ', email: 'MOI@Shop.com', phone: '0912345678', password: '123456',
    });

    expect(prismaMock.user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          name: 'Khach Moi',
          email: 'moi@shop.com',
          role: 'customer',
          membership_id: 3,
          password: 'hashed:123456',
        }),
      })
    );
    expect(result.message).toBe('User account created successfully');
  });

  it('gán admin khi role=admin được gửi lên, SĐT rỗng lưu thành null', async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);
    prismaMock.membership.findUnique.mockResolvedValue({ id: 2 });
    prismaMock.user.create.mockResolvedValue({ id: 11, email: 'nv@shop.com', role: 'admin' });

    await service.createUser({
      name: 'NhanVien',
      email: 'nv@shop.com',
      phone: '',
      password: '123456',
      role: 'admin',
      membership_id: 2,
    });

    expect(prismaMock.user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ role: 'admin', membership_id: 2, phone: null }),
      })
    );
  });
});

describe('AdminUserService.updateUser – chốt an toàn khi đổi vai trò', () => {
  it('admin không thể tự hạ quyền chính mình (400)', async () => {
    prismaMock.user.findUnique.mockResolvedValue({ id: ADMIN_ID, role: 'admin', phone: null });

    await expect(service.updateUser(String(ADMIN_ID), ADMIN_ID, { role: 'customer' }))
      .rejects.toThrow(/your own admin role/);

    expect(prismaMock.user.update).not.toHaveBeenCalled();
  });

  it('không thể hạ quyền admin cuối cùng của hệ thống (400)', async () => {
    prismaMock.user.findUnique.mockResolvedValue({ id: 2, role: 'admin', phone: null });
    prismaMock.user.count.mockResolvedValue(1);

    await expect(service.updateUser('2', ADMIN_ID, { role: 'customer' }))
      .rejects.toThrow(/last admin/);

    expect(prismaMock.user.update).not.toHaveBeenCalled();
  });

  it('nâng quyền customer → admin: ghi role và thu hồi refresh token', async () => {
    prismaMock.user.findUnique.mockResolvedValue({ id: 7, role: 'customer', phone: null });
    prismaMock.user.update.mockResolvedValue({ id: 7, role: 'admin' });

    const result = await service.updateUser('7', ADMIN_ID, { role: 'admin' });

    expect(prismaMock.user.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 7 }, data: { role: 'admin', refresh_token: null } })
    );
    expect(result.message).toBe('User account updated successfully');
  });

  it('không gửi trường nào thay đổi thì ném 400 thay vì update rỗng', async () => {
    prismaMock.user.findUnique.mockResolvedValue({ id: 7, role: 'customer', phone: null });

    await expect(service.updateUser('7', ADMIN_ID, {}))
      .rejects.toThrow(AppError);

    expect(prismaMock.user.update).not.toHaveBeenCalled();
  });

  it('chặn số điện thoại đã thuộc tài khoản khác', async () => {
    prismaMock.user.findUnique
      .mockResolvedValueOnce({ id: 7, role: 'customer', phone: '0900000000' })
      .mockResolvedValueOnce({ id: 9, phone: '0911111111' });

    await expect(service.updateUser('7', ADMIN_ID, { phone: '0911111111' }))
      .rejects.toThrow(AppError);

    expect(prismaMock.user.update).not.toHaveBeenCalled();
  });

  it('tự phân giải về hạng mặc định (Thường) khi cập nhật membership_id=null hoặc chuỗi rỗng', async () => {
    prismaMock.user.findUnique.mockResolvedValue({ id: 7, role: 'customer', phone: null });
    prismaMock.membership.findFirst.mockResolvedValue({ id: 1, min_spending: 0 });
    prismaMock.user.update.mockResolvedValue({ id: 7, membership_id: 1 });

    await service.updateUser('7', ADMIN_ID, { membership_id: null });

    expect(prismaMock.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 7 },
        data: expect.objectContaining({ membership_id: 1 }),
      })
    );
  });
});

describe('AdminUserService.resetUserPassword – đặt lại mật khẩu hộ khách', () => {
  it('mật khẩu mới dưới 6 ký tự bị chặn (400)', async () => {
    await expect(service.resetUserPassword('7', { newPassword: '123' }))
      .rejects.toThrow(AppError);

    expect(prismaMock.user.update).not.toHaveBeenCalled();
  });

  it('đặt lại thành công: lưu hash và đăng xuất mọi phiên cũ', async () => {
    prismaMock.user.findUnique.mockResolvedValue({ id: 7 });
    prismaMock.user.update.mockResolvedValue({ id: 7 });

    const result = await service.resetUserPassword('7', { newPassword: 'matkhaumoi' });

    expect(prismaMock.user.update).toHaveBeenCalledWith({
      where: { id: 7 },
      data: { password: 'hashed:matkhaumoi', refresh_token: null },
    });
    expect(result).toEqual({ message: 'Password reset successfully' });
  });
});

describe('AdminUserService.deleteUser – xóa tài khoản an toàn', () => {
  it('không cho admin tự xóa chính mình', async () => {
    await expect(service.deleteUser(String(ADMIN_ID), ADMIN_ID))
      .rejects.toThrow(AppError);

    expect(prismaMock.user.delete).not.toHaveBeenCalled();
  });

  it('chặn xóa tài khoản đã có đơn hàng để giữ lịch sử đơn', async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      id: 2,
      role: 'customer',
      _count: { orders: 3 },
    });

    await expect(service.deleteUser('2', ADMIN_ID))
      .rejects.toThrow(AppError);

    expect(prismaMock.user.delete).not.toHaveBeenCalled();
  });

  it('chặn xóa admin cuối cùng', async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      id: 2,
      role: 'admin',
      _count: { orders: 0 },
    });
    prismaMock.user.count.mockResolvedValue(1);

    await expect(service.deleteUser('2', ADMIN_ID))
      .rejects.toThrow(AppError);

    expect(prismaMock.user.delete).not.toHaveBeenCalled();
  });

  it('xóa thành công tài khoản chưa có đơn hàng', async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      id: 2,
      role: 'customer',
      _count: { orders: 0 },
    });
    prismaMock.user.delete.mockResolvedValue({ id: 2 });

    const result = await service.deleteUser('2', ADMIN_ID);

    expect(prismaMock.user.delete).toHaveBeenCalledWith({ where: { id: 2 } });
    expect(result).toEqual({ message: 'User account deleted successfully' });
  });
});
