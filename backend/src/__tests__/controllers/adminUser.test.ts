import { Request, Response } from 'express';

jest.mock('../../../prisma/client', () => ({
  __esModule: true,
  default: {
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
  },
}));

// bcrypt thật tốn ~100ms/lần và hash đổi mỗi lần chạy => mock để test tất định.
jest.mock('bcryptjs', () => ({
  __esModule: true,
  default: {
    hash: jest.fn(async (value: string) => `hashed:${value}`),
    compare: jest.fn(async () => true),
  },
}));

import prisma from '../../../prisma/client';
import {
  createUser,
  deleteUser,
  getUsers,
  resetUserPassword,
  updateUser,
} from '../../controllers/admin/userController';

const ADMIN = { id: 1, name: 'Admin', email: 'admin@shop.com', role: 'admin' };

const next = jest.fn();

function mockRes() {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  } as unknown as Response;
}

function mockReq(
  body: Record<string, unknown> = {},
  params: Record<string, string> = {},
  user: typeof ADMIN | undefined = ADMIN
): Request {
  return { params, body, user } as unknown as Request;
}

/**
 * Controller bọc bởi catchAsync nên hàm trả về là ĐỒNG BỘ (không phải promise),
 * `await handler(...)` không chờ xử lý xong => phải nhường 1 nhịp event loop.
 */
async function invoke(
  handler: (req: Request, res: Response, nextFn: jest.Mock) => unknown,
  req: Request
) {
  const res = mockRes();
  handler(req, res, next);
  await new Promise((resolve) => setImmediate(resolve));
  return res;
}

/** Lỗi đi qua catchAsync được đẩy vào next(err). */
const capturedError = () => next.mock.calls[0]?.[0];

beforeEach(() => {
  jest.clearAllMocks();
});

describe('getUsers – bộ lọc danh sách người dùng', () => {
  it('dựng điều kiện OR khi có ?search= và lọc theo ?role=', async () => {
    (prisma.user.findMany as jest.Mock).mockResolvedValue([{ id: 2, name: 'Khach A' }]);

    const res = await invoke(getUsers, {
      query: { search: '  khach ', role: 'customer' },
      user: ADMIN,
    } as unknown as Request);

    expect(prisma.user.findMany).toHaveBeenCalledWith(
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
    expect(res.json).toHaveBeenCalledWith({ data: [{ id: 2, name: 'Khach A' }] });
  });

  it('không truyền bộ lọc nào thì trả về toàn bộ người dùng', async () => {
    (prisma.user.findMany as jest.Mock).mockResolvedValue([]);

    const res = await invoke(getUsers, { query: {}, user: ADMIN } as unknown as Request);

    expect(prisma.user.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: {} }));
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('hỗ trợ phân trang khi truyền page và limit', async () => {
    (prisma.user.findMany as jest.Mock).mockResolvedValue([{ id: 3, name: 'Khach B' }]);
    (prisma.user.count as jest.Mock).mockResolvedValue(45);

    const res = await invoke(getUsers, {
      query: { page: '2', limit: '20' },
      user: ADMIN,
    } as unknown as Request);

    expect(prisma.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: 20,
        take: 20,
      })
    );
    expect(prisma.user.count).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith({
      data: [{ id: 3, name: 'Khach B' }],
      currentPage: 2,
      totalPages: 3,
      totalUsers: 45,
    });
  });
});

describe('createUser – tạo tài khoản từ trang quản trị', () => {
  it('chặn email đã tồn tại (400), không gọi create', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: 5, email: 'cu@shop.com' });

    await invoke(
      createUser,
      mockReq({ name: 'Khach Moi', email: 'CU@shop.com', phone: '0912345678', password: '123456' })
    );

    expect(capturedError().statusCode).toBe(400);
    expect(prisma.user.create).not.toHaveBeenCalled();
  });

  it('mật khẩu dưới 6 ký tự bị chặn trước khi chạm DB', async () => {
    await invoke(
      createUser,
      mockReq({ name: 'Khach Moi', email: 'moi@shop.com', phone: '0912345678', password: '123' })
    );

    expect(capturedError().statusCode).toBe(400);
    expect(prisma.user.findUnique).not.toHaveBeenCalled();
  });

  it('tạo thành công: hash mật khẩu, chuẩn hóa email thường và gán hạng mặc định', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
    (prisma.membership.findFirst as jest.Mock).mockResolvedValue({ id: 3, min_spending: 0 });
    (prisma.user.create as jest.Mock).mockResolvedValue({ id: 10, email: 'moi@shop.com' });

    const res = await invoke(
      createUser,
      mockReq({ name: '  Khach Moi ', email: 'MOI@Shop.com', phone: '0912345678', password: '123456' })
    );

    expect(prisma.user.create).toHaveBeenCalledWith(
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
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it('gán admin khi role=admin được gửi lên, SĐT rỗng lưu thành null', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
    (prisma.membership.findUnique as jest.Mock).mockResolvedValue({ id: 2 });
    (prisma.user.create as jest.Mock).mockResolvedValue({ id: 11, email: 'nv@shop.com', role: 'admin' });

    await invoke(
      createUser,
      mockReq({
        name: 'NhanVien',
        email: 'nv@shop.com',
        phone: '',
        password: '123456',
        role: 'admin',
        membership_id: 2,
      })
    );

    expect(prisma.user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ role: 'admin', membership_id: 2, phone: null }),
      })
    );
  });
});

describe('updateUser – chốt an toàn khi đổi vai trò', () => {
  it('admin không thể tự hạ quyền chính mình (400)', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: 1, role: 'admin', phone: null });

    await invoke(updateUser, mockReq({ role: 'customer' }, { id: '1' }));

    expect(capturedError().statusCode).toBe(400);
    expect(capturedError().message).toMatch(/your own admin role/);
    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it('không thể hạ quyền admin cuối cùng của hệ thống (400)', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: 2, role: 'admin', phone: null });
    (prisma.user.count as jest.Mock).mockResolvedValue(1);

    await invoke(updateUser, mockReq({ role: 'customer' }, { id: '2' }));

    expect(capturedError().statusCode).toBe(400);
    expect(capturedError().message).toMatch(/last admin/);
    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it('nâng quyền customer → admin: ghi role và thu hồi refresh token', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: 7, role: 'customer', phone: null });
    (prisma.user.update as jest.Mock).mockResolvedValue({ id: 7, role: 'admin' });

    const res = await invoke(updateUser, mockReq({ role: 'admin' }, { id: '7' }));

    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 7 }, data: { role: 'admin', refresh_token: null } })
    );
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('không gửi trường nào thay đổi thì trả 400 thay vì update rỗng', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: 7, role: 'customer', phone: null });

    await invoke(updateUser, mockReq({}, { id: '7' }));

    expect(capturedError().statusCode).toBe(400);
    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it('chặn số điện thoại đã thuộc tài khoản khác', async () => {
    (prisma.user.findUnique as jest.Mock)
      .mockResolvedValueOnce({ id: 7, role: 'customer', phone: '0900000000' })
      .mockResolvedValueOnce({ id: 9, phone: '0911111111' });

    await invoke(updateUser, mockReq({ phone: '0911111111' }, { id: '7' }));

    expect(capturedError().statusCode).toBe(400);
    expect(prisma.user.update).not.toHaveBeenCalled();
  });
  it('tự phân giải về hạng mặc định (Thường) khi cập nhật membership_id=null hoặc chuỗi rỗng', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: 7, role: 'customer', phone: null });
    (prisma.membership.findFirst as jest.Mock).mockResolvedValue({ id: 1, min_spending: 0 });
    (prisma.user.update as jest.Mock).mockResolvedValue({ id: 7, membership_id: 1 });

    await invoke(updateUser, mockReq({ membership_id: null }, { id: '7' }));

    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 7 },
        data: expect.objectContaining({ membership_id: 1 }),
      })
    );
  });

});

describe('resetUserPassword – đặt lại mật khẩu hộ khách', () => {
  it('mật khẩu mới dưới 6 ký tự bị chặn (400)', async () => {
    await invoke(resetUserPassword, mockReq({ newPassword: '123' }, { id: '7' }));

    expect(capturedError().statusCode).toBe(400);
    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it('đặt lại thành công: lưu hash và đăng xuất mọi phiên cũ', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: 7 });
    (prisma.user.update as jest.Mock).mockResolvedValue({ id: 7 });

    const res = await invoke(resetUserPassword, mockReq({ newPassword: 'matkhaumoi' }, { id: '7' }));

    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 7 },
      data: { password: 'hashed:matkhaumoi', refresh_token: null },
    });
    expect(res.json).toHaveBeenCalledWith({ message: 'Password reset successfully' });
  });
});

describe('deleteUser – xóa tài khoản an toàn', () => {
  it('không cho admin tự xóa chính mình', async () => {
    await invoke(deleteUser, mockReq({}, { id: '1' }));

    expect(capturedError().statusCode).toBe(400);
    expect(prisma.user.delete).not.toHaveBeenCalled();
  });

  it('chặn xóa tài khoản đã có đơn hàng để giữ lịch sử đơn', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: 2,
      role: 'customer',
      _count: { orders: 3 },
    });

    await invoke(deleteUser, mockReq({}, { id: '2' }));

    expect(capturedError().statusCode).toBe(400);
    expect(prisma.user.delete).not.toHaveBeenCalled();
  });

  it('chặn xóa admin cuối cùng', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: 2,
      role: 'admin',
      _count: { orders: 0 },
    });
    (prisma.user.count as jest.Mock).mockResolvedValue(1);

    await invoke(deleteUser, mockReq({}, { id: '2' }));

    expect(capturedError().statusCode).toBe(400);
    expect(prisma.user.delete).not.toHaveBeenCalled();
  });

  it('xóa thành công tài khoản chưa có đơn hàng', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: 2,
      role: 'customer',
      _count: { orders: 0 },
    });
    (prisma.user.delete as jest.Mock).mockResolvedValue({ id: 2 });

    const res = await invoke(deleteUser, mockReq({}, { id: '2' }));

    expect(prisma.user.delete).toHaveBeenCalledWith({ where: { id: 2 } });
    expect(res.json).toHaveBeenCalledWith({ message: 'User account deleted successfully' });
  });
});
