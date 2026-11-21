import { InternalServerErrorException } from '@nestjs/common';
import { AdminOrderService } from '../../admin/services/admin-order.service';
import { PrismaService } from '../../prisma/prisma.service';
import { SocketService } from '../../socket/socket.service';

const prismaMock = {
  order: { findMany: jest.fn(), count: jest.fn() },
};

const socketMock = {
  sendNotification: jest.fn(),
};

const service = new AdminOrderService(
  prismaMock as unknown as PrismaService,
  socketMock as unknown as SocketService,
);

const findManyArgs = () => (prismaMock.order.findMany as jest.Mock).mock.calls[0][0];

describe('AdminOrderService.getOrders – phân trang + lọc chạy ở server', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    prismaMock.order.findMany.mockResolvedValue([]);
    prismaMock.order.count.mockResolvedValue(0);
  });

  it('mặc định lấy trang 1 với 50 đơn và trả kèm metadata phân trang', async () => {
    prismaMock.order.count.mockResolvedValue(120);

    const body = await service.getOrders({}) as Record<string, unknown>;

    expect(findManyArgs()).toEqual(
      expect.objectContaining({ skip: 0, take: 50, orderBy: { created_at: 'desc' } })
    );
    expect(body).toEqual(
      expect.objectContaining({ currentPage: 1, totalPages: 3, totalOrders: 120 })
    );
  });

  it('đổi trang thì tính đúng offset (page 3, limit 20 → skip 40)', async () => {
    prismaMock.order.count.mockResolvedValue(45);

    const body = await service.getOrders({ page: '3', limit: '20' }) as Record<string, unknown>;

    expect(findManyArgs()).toEqual(expect.objectContaining({ skip: 40, take: 20 }));
    expect(body).toEqual(
      expect.objectContaining({ currentPage: 3, totalPages: 3, totalOrders: 45 })
    );
  });

  it('chặn limit quá lớn và page không hợp lệ (limit tối đa 100, page tối thiểu 1)', async () => {
    await service.getOrders({ page: '-2', limit: '5000' });

    expect(findManyArgs()).toEqual(expect.objectContaining({ skip: 0, take: 100 }));
  });

  it('đếm theo ĐÚNG bộ lọc để totalPages khớp dữ liệu trả về', async () => {
    await service.getOrders({ tab: 'Returns', status: 'Return Approved' });

    expect(prismaMock.order.count).toHaveBeenCalledWith({
      where: { status: 'Return_Approved' },
    });
    expect(findManyArgs().where).toEqual({ status: 'Return_Approved' });
  });

  it('tab Returns + All: gom 3 trạng thái đổi trả và cả đơn Delivered đang chờ duyệt lại', async () => {
    await service.getOrders({ tab: 'Returns', status: 'All' });

    expect(findManyArgs().where).toEqual({
      OR: [
        { status: { in: ['Return_Requested', 'Return_Rejected', 'Return_Approved'] } },
        { status: 'Delivered', return_request: { status: 'Pending' } },
      ],
    });
  });

  it('lọc "Return Requested" phải kèm đơn Delivered có yêu cầu đổi trả Pending', async () => {
    await service.getOrders({ tab: 'Returns', status: 'Return Requested' });

    expect(findManyArgs().where).toEqual({
      OR: [
        { status: 'Return_Requested' },
        { status: 'Delivered', return_request: { status: 'Pending' } },
      ],
    });
  });

  it('tab Standard: loại đơn đổi trả và đơn Delivered chờ duyệt lại', async () => {
    await service.getOrders({ tab: 'Standard', status: 'Delivered' });

    expect(findManyArgs().where).toEqual({
      AND: [
        { status: { notIn: ['Return_Requested', 'Return_Rejected', 'Return_Approved'] } },
        { NOT: { status: 'Delivered', return_request: { status: 'Pending' } } },
        { status: 'Delivered' },
      ],
    });
  });

  it('trạng thái lạ / không có tab thì không lọc (giữ hành vi cũ cho client cũ)', async () => {
    await service.getOrders({ tab: 'Standard', status: 'Khong-Ton-Tai' });
    expect(findManyArgs().where).toEqual({
      AND: [
        { status: { notIn: ['Return_Requested', 'Return_Rejected', 'Return_Approved'] } },
        { NOT: { status: 'Delivered', return_request: { status: 'Pending' } } },
      ],
    });

    jest.clearAllMocks();
    prismaMock.order.findMany.mockResolvedValue([]);
    prismaMock.order.count.mockResolvedValue(0);

    await service.getOrders({});
    expect(findManyArgs().where).toBeUndefined();
    expect(prismaMock.order.count).toHaveBeenCalledWith({ where: undefined });
  });

  it('lỗi DB thì ném InternalServerErrorException kèm message cũ', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
    prismaMock.order.findMany.mockRejectedValue(new Error('DB down'));

    await expect(service.getOrders({}))
      .rejects.toThrow(InternalServerErrorException);
  });
});
