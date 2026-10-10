import { Request, Response } from 'express';

jest.mock('../../../prisma/client', () => ({
  __esModule: true,
  default: {
    order: { findMany: jest.fn(), count: jest.fn() },
  },
}));

import prisma from '../../../prisma/client';
import { getOrders } from '../../controllers/admin/orderController';

function mockRes() {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  } as unknown as Response;
}

const mockReq = (query: Record<string, unknown> = {}): Request => ({ query } as unknown as Request);

/** getOrders là async function thường (không bọc catchAsync) nên await là đủ. */
async function invoke(query: Record<string, unknown> = {}) {
  const res = mockRes();
  await getOrders(mockReq(query), res);
  return res;
}

const findManyArgs = () => (prisma.order.findMany as jest.Mock).mock.calls[0][0];
const jsonBody = (res: Response) => (res.json as jest.Mock).mock.calls[0][0];

beforeEach(() => {
  jest.clearAllMocks();
  (prisma.order.findMany as jest.Mock).mockResolvedValue([]);
  (prisma.order.count as jest.Mock).mockResolvedValue(0);
});

describe('getOrders – phân trang + lọc chạy ở server', () => {
  it('mặc định lấy trang 1 với 50 đơn và trả kèm metadata phân trang', async () => {
    (prisma.order.count as jest.Mock).mockResolvedValue(120);

    const res = await invoke();

    expect(findManyArgs()).toEqual(
      expect.objectContaining({ skip: 0, take: 50, orderBy: { created_at: 'desc' } })
    );
    expect(jsonBody(res)).toEqual(
      expect.objectContaining({ currentPage: 1, totalPages: 3, totalOrders: 120 })
    );
  });

  it('đổi trang thì tính đúng offset (page 3, limit 20 → skip 40)', async () => {
    (prisma.order.count as jest.Mock).mockResolvedValue(45);

    const res = await invoke({ page: '3', limit: '20' });

    expect(findManyArgs()).toEqual(expect.objectContaining({ skip: 40, take: 20 }));
    expect(jsonBody(res)).toEqual(
      expect.objectContaining({ currentPage: 3, totalPages: 3, totalOrders: 45 })
    );
  });

  it('chặn limit quá lớn và page không hợp lệ (limit tối đa 100, page tối thiểu 1)', async () => {
    await invoke({ page: '-2', limit: '5000' });

    expect(findManyArgs()).toEqual(expect.objectContaining({ skip: 0, take: 100 }));
  });

  it('đếm theo ĐÚNG bộ lọc để totalPages khớp dữ liệu trả về', async () => {
    await invoke({ tab: 'Returns', status: 'Return Approved' });

    expect(prisma.order.count).toHaveBeenCalledWith({
      where: { status: 'Return_Approved' },
    });
    expect(findManyArgs().where).toEqual({ status: 'Return_Approved' });
  });

  it('tab Returns + All: gom 3 trạng thái đổi trả và cả đơn Delivered đang chờ duyệt lại', async () => {
    await invoke({ tab: 'Returns', status: 'All' });

    expect(findManyArgs().where).toEqual({
      OR: [
        { status: { in: ['Return_Requested', 'Return_Rejected', 'Return_Approved'] } },
        { status: 'Delivered', return_request: { status: 'Pending' } },
      ],
    });
  });

  it('lọc "Return Requested" phải kèm đơn Delivered có yêu cầu đổi trả Pending', async () => {
    await invoke({ tab: 'Returns', status: 'Return Requested' });

    expect(findManyArgs().where).toEqual({
      OR: [
        { status: 'Return_Requested' },
        { status: 'Delivered', return_request: { status: 'Pending' } },
      ],
    });
  });

  it('tab Standard: loại đơn đổi trả và đơn Delivered chờ duyệt lại', async () => {
    await invoke({ tab: 'Standard', status: 'Delivered' });

    expect(findManyArgs().where).toEqual({
      AND: [
        { status: { notIn: ['Return_Requested', 'Return_Rejected', 'Return_Approved'] } },
        { NOT: { status: 'Delivered', return_request: { status: 'Pending' } } },
        { status: 'Delivered' },
      ],
    });
  });

  it('trạng thái lạ / không có tab thì không lọc (giữ hành vi cũ cho client cũ)', async () => {
    await invoke({ tab: 'Standard', status: 'Khong-Ton-Tai' });
    expect(findManyArgs().where).toEqual({
      AND: [
        { status: { notIn: ['Return_Requested', 'Return_Rejected', 'Return_Approved'] } },
        { NOT: { status: 'Delivered', return_request: { status: 'Pending' } } },
      ],
    });

    jest.clearAllMocks();
    (prisma.order.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.order.count as jest.Mock).mockResolvedValue(0);

    await invoke({});
    expect(findManyArgs().where).toBeUndefined();
    expect(prisma.order.count).toHaveBeenCalledWith({ where: undefined });
  });

  it('lỗi DB thì trả 500 kèm message cũ', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
    (prisma.order.findMany as jest.Mock).mockRejectedValue(new Error('DB down'));

    const res = await invoke();

    expect(res.status).toHaveBeenCalledWith(500);
    expect(jsonBody(res)).toEqual({ message: 'Server error' });
  });
});
