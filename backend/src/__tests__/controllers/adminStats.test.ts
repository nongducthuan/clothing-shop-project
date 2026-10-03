import { Request, Response } from 'express';

jest.mock('../../../prisma/client', () => ({
  __esModule: true,
  default: {
    $queryRawUnsafe: jest.fn(),
  },
}));

import prisma from '../../../prisma/client';
import { getAdminStats } from '../../controllers/admin/statsController';

/** COUNT/SUM của MySQL trả BigInt => controller phải ép về number trước khi trả JSON. */
const DASHBOARD_ROW = {
  totalStock: 137n,
  orders: 42n,
  categoriesCount: 8n,
  banners: 3n,
  activeSales: 2n,
  activeVouchers: 5n,
  activePromotions: 1n,
  users: 17n,
};

const SUMMARY_ROW = { weeklyOrders: 10n, weeklyRevenue: '1500000' };

const queryRawUnsafe = () => prisma.$queryRawUnsafe as jest.Mock;

const isDashboardSql = (sql: unknown) => String(sql).includes('AS activePromotions');

const dashboardSql = () =>
  queryRawUnsafe().mock.calls.find(([sql]) => isDashboardSql(sql))?.[0] as string | undefined;

function mockRes() {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  } as unknown as Response;
}

/** getAdminStats là async function thường (không bọc catchAsync) nên await là đủ. */
async function invoke() {
  const res = mockRes();
  await getAdminStats({} as Request, res);
  return res;
}

const jsonBody = (res: Response) => (res.json as jest.Mock).mock.calls[0][0];

beforeEach(() => {
  jest.clearAllMocks();

  queryRawUnsafe().mockImplementation((sql: string) => {
    if (isDashboardSql(sql)) return Promise.resolve([DASHBOARD_ROW]);
    if (String(sql).includes('AS weeklyOrders')) return Promise.resolve([SUMMARY_ROW]);
    return Promise.resolve([]);
  });
});

describe('getAdminStats – 8 số đếm cho Dashboard', () => {
  it('trả về dashboard counters dạng number, không mất dữ liệu báo cáo cũ', async () => {
    const res = await invoke();
    const body = jsonBody(res);

    expect(body.dashboard).toEqual({
      totalStock: 137,
      orders: 42,
      categoriesCount: 8,
      banners: 3,
      activeSales: 2,
      activeVouchers: 5,
      activePromotions: 1,
      users: 17,
    });
    expect(body.weeklyOrders).toBe(10);
    expect(body.revenue7Days).toEqual([]);
    expect(body.orderStatus).toEqual([]);
  });

  it('chỉ đếm bản ghi đang hoạt động, giống điều kiện lọc của các trang quản lý', async () => {
    await invoke();
    const sql = dashboardSql() || '';

    // Tồn kho: chỉ sản phẩm is_active, cộng stock của mọi size.
    expect(sql).toContain('JOIN products p ON pc.product_id = p.id');
    expect(sql).toContain('p.is_active = 1');
    expect(sql).toContain('FROM product_sizes ps');
    // Danh mục xóa mềm không tính.
    expect(sql).toContain('FROM categories WHERE is_active = 1');
    // Sale/Voucher dùng cờ boolean.
    expect(sql).toContain('FROM sales WHERE status = 1');
    expect(sql).toContain('FROM vouchers WHERE status = 1');
    // Khuyến mãi: chỉ status active và chưa xóa mềm.
    expect(sql).toContain("status = 'active' AND is_active = 1");
    expect(sql).toContain('FROM buy_x_get_y_promotions');
    // Đơn hàng / người dùng / banner đếm toàn bộ.
    expect(sql).toContain('FROM orders');
    expect(sql).toContain('FROM users');
    expect(sql).toContain('FROM banners');
  });

  it('gộp 8 ô dashboard vào đúng 1 truy vấn SQL', async () => {
    await invoke();

    const dashboardCalls = queryRawUnsafe().mock.calls.filter(([sql]) => isDashboardSql(sql));
    expect(dashboardCalls).toHaveLength(1);
  });

  it('không có dòng nào trả về thì dashboard là object rỗng (không crash)', async () => {
    queryRawUnsafe().mockImplementation(() => Promise.resolve([]));

    const res = await invoke();

    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ dashboard: {} }));
  });

  it('truy vấn lỗi thì trả 500 kèm message cũ', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
    queryRawUnsafe().mockRejectedValue(new Error('DB down'));

    const res = await invoke();

    expect(res.status).toHaveBeenCalledWith(500);
    expect(jsonBody(res)).toEqual({ message: 'Server error fetching statistics' });
  });
});
