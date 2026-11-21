import { InternalServerErrorException } from '@nestjs/common';
import { AdminProductService } from '../../admin/services/admin-product.service';
import { PrismaService } from '../../prisma/prisma.service';

const prismaMock = {
  product: {
    findMany: jest.fn(),
    count: jest.fn(),
  },
};

const service = new AdminProductService(prismaMock as unknown as PrismaService);

const sampleProduct = (overrides: Record<string, unknown> = {}) => ({
  id: 5,
  name: 'Ao thun',
  price: 200000,
  import_price: 120000,
  colors: [{ sizes: [{ stock: 3 }, { stock: 4 }] }],
  category: { name: 'Ao thun', name_vi: 'Áo thun', name_en: 'T-Shirt' },
  ...overrides,
});

const findManyArgs = () => (prismaMock.product.findMany as jest.Mock).mock.calls[0][0];

describe('AdminProductService.getProducts – phân trang + lọc chạy ở server', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    prismaMock.product.findMany.mockResolvedValue([sampleProduct()]);
    prismaMock.product.count.mockResolvedValue(1);
  });

  it('không truyền ?page= thì trả mảng đầy đủ như cũ (không đổi hợp đồng dữ liệu)', async () => {
    const body = await service.getProducts({});

    expect(prismaMock.product.count).not.toHaveBeenCalled();
    expect(findManyArgs()).toEqual(
      expect.objectContaining({ where: { is_active: true }, orderBy: [{ gender: 'asc' }, { id: 'desc' }] })
    );
    expect(findManyArgs().skip).toBeUndefined();
    expect(findManyArgs().take).toBeUndefined();

    expect(Array.isArray(body)).toBe(true);
    expect((body as Array<Record<string, unknown>>)[0]).toEqual(
      expect.objectContaining({ total_stock: 7, unit_profit: 80000, category_name_vi: 'Áo thun' })
    );
  });

  it('có ?page= thì trả 1 trang kèm metadata phân trang', async () => {
    prismaMock.product.count.mockResolvedValue(130);

    const body = await service.getProducts({ page: '2', limit: '50' }) as Record<string, unknown>;

    expect(findManyArgs()).toEqual(expect.objectContaining({ skip: 50, take: 50 }));
    expect(prismaMock.product.count).toHaveBeenCalledWith({ where: { is_active: true } });
    expect(body).toEqual(
      expect.objectContaining({ currentPage: 2, totalPages: 3, totalProducts: 130 })
    );
  });

  it('chặn limit quá lớn và page không hợp lệ (limit tối đa 100, page tối thiểu 1)', async () => {
    await service.getProducts({ page: '0', limit: '9999' });

    expect(findManyArgs()).toEqual(expect.objectContaining({ skip: 0, take: 100 }));
  });

  it('tìm kiếm chạy trên cả 3 tên (canonical + vi + en)', async () => {
    await service.getProducts({ search: '  ao  ' });

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
    await service.getProducts({ gender: 'MALE' });
    expect(findManyArgs().where).toEqual({ is_active: true, gender: 'male' });

    jest.clearAllMocks();
    prismaMock.product.findMany.mockResolvedValue([]);

    await service.getProducts({ gender: 'khong-ton-tai' });
    expect(findManyArgs().where).toEqual({ is_active: true });
  });

  it('lọc theo NHÓM danh mục cùng tên (category_ids) thay vì tự gom ở client', async () => {
    await service.getProducts({ category_ids: '3, 4 ,4,abc,-1' });

    expect(findManyArgs().where).toEqual({ is_active: true, category_id: { in: [3, 4] } });
  });

  it('vẫn chấp nhận tham số cũ ?category_id= (1 danh mục) và bỏ qua "all"', async () => {
    await service.getProducts({ category_id: '7' });
    expect(findManyArgs().where).toEqual({ is_active: true, category_id: { in: [7] } });

    jest.clearAllMocks();
    prismaMock.product.findMany.mockResolvedValue([]);

    await service.getProducts({ category_id: 'all' });
    expect(findManyArgs().where).toEqual({ is_active: true });
  });

  it('lỗi DB thì ném InternalServerErrorException kèm message cũ', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
    prismaMock.product.findMany.mockRejectedValue(new Error('DB down'));

    await expect(service.getProducts({ page: '1' }))
      .rejects.toThrow(InternalServerErrorException);
  });
});
