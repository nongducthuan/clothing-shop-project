import { InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AdminStatsService } from '../../admin/services/admin-stats.service';

const prismaMock = {
  $queryRaw: jest.fn(),
};
const service = new AdminStatsService(prismaMock as unknown as PrismaService);

/** Prisma.sql returns a Sql object; its sql field contains the SQL text with placeholders. */
const sqlText = (query: unknown): string => {
  if (typeof query === 'string') return query;
  if (query && typeof query === 'object') {
    const candidate = query as { sql?: unknown; text?: unknown };
    if (typeof candidate.sql === 'string') return candidate.sql;
    if (typeof candidate.text === 'string') return candidate.text;
  }
  return String(query);
};

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

const isDashboardSql = (query: unknown) => sqlText(query).includes('AS "activePromotions"');
const queryRaw = () => prismaMock.$queryRaw;

beforeEach(() => {
  jest.clearAllMocks();
  queryRaw().mockImplementation((query: unknown) => {
    const sql = sqlText(query);
    if (isDashboardSql(query)) return Promise.resolve([DASHBOARD_ROW]);
    if (sql.includes('AS "weeklyOrders"')) return Promise.resolve([SUMMARY_ROW]);
    return Promise.resolve([]);
  });
});

describe('AdminStatsService', () => {
  it('returns dashboard counters as numbers and preserves the existing report fields', async () => {
    const body = await service.getAdminStats();

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

  it('counts only active records using the existing dashboard filters', async () => {
    await service.getAdminStats();
    const query = queryRaw().mock.calls.find(([value]) => isDashboardSql(value))?.[0];
    const sql = sqlText(query);

    expect(sql).toContain('JOIN products p ON pc.product_id = p.id');
    expect(sql).toContain('p.is_active IS TRUE');
    expect(sql).toContain('FROM product_sizes ps');
    expect(sql).toContain('FROM categories WHERE is_active IS TRUE');
    expect(sql).toContain('FROM sales WHERE status IS TRUE');
    expect(sql).toContain('FROM vouchers WHERE status IS TRUE');
    expect(sql).toContain("status = 'active' AND is_active IS TRUE");
    expect(sql).toContain('FROM buy_x_get_y_promotions');
    expect(sql).toContain('FROM orders');
    expect(sql).toContain('FROM users');
    expect(sql).toContain('FROM banners');
  });

  it('keeps the cost snapshot fallback and excludes returned orders from weekly order counts', async () => {
    await service.getAdminStats();
    const query = queryRaw().mock.calls.find(([value]) => sqlText(value).includes('AS "weeklyProfit"'))?.[0];
    const sql = sqlText(query);

    expect(sql).toContain('COALESCE(oi.import_price_snapshot, p.import_price)');
    expect(sql).toContain('THEN o.id END) AS "weeklyOrders"');
    expect(sql).toContain("o.status IN ('Delivered','Return Requested','Return Rejected')");
  });

  it('executes the eight dashboard counters in a single SQL query', async () => {
    await service.getAdminStats();
    const dashboardCalls = queryRaw().mock.calls.filter(([query]) => isDashboardSql(query));
    expect(dashboardCalls).toHaveLength(1);
  });

  it('returns an empty dashboard object when the database returns no dashboard row', async () => {
    queryRaw().mockImplementation(() => Promise.resolve([]));
    const body = await service.getAdminStats();
    expect(body.dashboard).toEqual({});
  });

  it('throws a Nest HTTP exception with the previous error message on database failure', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
    queryRaw().mockRejectedValue(new Error('DB down'));

    try {
      await service.getAdminStats();
      throw new Error('Expected getAdminStats to throw');
    } catch (error) {
      expect(error).toBeInstanceOf(InternalServerErrorException);
      expect((error as InternalServerErrorException).getResponse()).toEqual({
        message: 'Server error fetching statistics',
      });
    }
  });
});
