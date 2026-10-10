import { Request, Response } from 'express';

jest.mock('../../../prisma/client', () => ({
  __esModule: true,
  default: {
    product: { findMany: jest.fn(), count: jest.fn() },
  },
}));

import prisma from '../../../prisma/client';
import { getProducts } from '../../controllers/admin/productController';

/** 1 sản phẩm tối thiểu để controller tính tồn kho/lợi nhuận. */
const sampleProduct = (overrides: Record<string, unknown> = {}) => ({
  id: 5,
  name: 'Ao thun',
  price: 200000,
  import_price: 120000,
  colors: [{ sizes: [{ stock: 3 }, { stock: 4 }] }],
  category: { name: 'Ao thun', name_vi: 'Áo thun', name_en: 'T-Shirt' },
  ...overrides,
});

function mockRes() {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  } as unknown as Response;
}

const mockReq = (query: Record<string, unknown> = {}): Request => ({ query } as unknown as Request);

/** getProducts là async function thường (không bọc catchAsync) nên await là đủ. */
async function invoke(query: Record<string, unknown> = {}) {
  const res = mockRes();
  await getProducts(mockReq(query), res);
  return res;
}

const findManyArgs = () => (prisma.product.findMany as jest.Mock).mock.calls[0][0];
const jsonBody = (res: Response) => (res.json as jest.Mock).mock.calls[0][0];

beforeEach(() => {
  jest.clearAllMocks();
  (prisma.product.findMany as jest.Mock).mockResolvedValue([sampleProduct()]);
  (prisma.product.count as jest.Mock).mockResolvedValue(1);
});

describe('getProducts – phân trang + lọc chạy ở server', () => {
  it('không truyền ?page= thì trả mảng đầy đủ như cũ (không đổi hợp đồng dữ liệu)', async () => {
    const res = await invoke();

    expect(prisma.product.count).not.toHaveBeenCalled();
    expect(findManyArgs()).toEqual(
      expect.objectContaining({ where: { is_active: true }, orderBy: [{ gender: 'asc' }, { id: 'desc' }] })
    );
    expect(findManyArgs().skip).toBeUndefined();
    expect(findManyArgs().take).toBeUndefined();

    const body = jsonBody(res);
    expect(Array.isArray(body)).toBe(true);
    expect(body[0]).toEqual(
      expect.objectContaining({ total_stock: 7, unit_profit: 80000, category_name_vi: 'Áo thun' })
    );
  });

  it('có ?page= thì trả 1 trang kèm metadata phân trang', async () => {
    (prisma.product.count as jest.Mock).mockResolvedValue(130);

    const res = await invoke({ page: '2', limit: '50' });

    expect(findManyArgs()).toEqual(expect.objectContaining({ skip: 50, take: 50 }));
    expect(prisma.product.count).toHaveBeenCalledWith({ where: { is_active: true } });
    expect(jsonBody(res)).toEqual(
      expect.objectContaining({ currentPage: 2, totalPages: 3, totalProducts: 130 })
    );
  });

  it('chặn limit quá lớn và page không hợp lệ (limit tối đa 100, page tối thiểu 1)', async () => {
    await invoke({ page: '0', limit: '9999' });

    expect(findManyArgs()).toEqual(expect.objectContaining({ skip: 0, take: 100 }));
  });

  it('tìm kiếm chạy trên cả 3 tên (canonical + vi + en)', async () => {
    await invoke({ search: '  ao  ' });

    expect(findManyArgs().where).toEqual({
      is_active: true,
      OR: [
        { name: { contains: 'ao' } },
        { name_vi: { contains: 'ao' } },
        { name_en: { contains: 'ao' } },
      ],
    });
  });

  it('lọc giới tính hợp lệ, bỏ qua giá trị lạ và "all"', async () => {
    await invoke({ gender: 'MALE' });
    expect(findManyArgs().where).toEqual({ is_active: true, gender: 'male' });

    jest.clearAllMocks();
    (prisma.product.findMany as jest.Mock).mockResolvedValue([]);

    await invoke({ gender: 'khong-ton-tai' });
    expect(findManyArgs().where).toEqual({ is_active: true });
  });

  it('lọc theo NHÓM danh mục cùng tên (category_ids) thay vì tự gom ở client', async () => {
    await invoke({ category_ids: '3, 4 ,4,abc,-1' });

    expect(findManyArgs().where).toEqual({ is_active: true, category_id: { in: [3, 4] } });
  });

  it('vẫn chấp nhận tham số cũ ?category_id= (1 danh mục) và bỏ qua "all"', async () => {
    await invoke({ category_id: '7' });
    expect(findManyArgs().where).toEqual({ is_active: true, category_id: { in: [7] } });

    jest.clearAllMocks();
    (prisma.product.findMany as jest.Mock).mockResolvedValue([]);

    await invoke({ category_id: 'all' });
    expect(findManyArgs().where).toEqual({ is_active: true });
  });

  it('lỗi DB thì trả 500 kèm message cũ', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
    (prisma.product.findMany as jest.Mock).mockRejectedValue(new Error('DB down'));

    const res = await invoke({ page: '1' });

    expect(res.status).toHaveBeenCalledWith(500);
    expect(jsonBody(res)).toEqual({ message: 'Server error fetching products' });
  });
});
