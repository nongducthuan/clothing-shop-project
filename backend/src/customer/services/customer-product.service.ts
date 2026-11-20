import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Gender, Prisma, Product } from '../../generated/prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { calculateDiscountedUnitPrice } from '../../utils/pricing';
import { getErrorMessage } from '../../utils/errorMessage';

type ActiveSale = Prisma.SaleGetPayload<{ include: { product_sales: true; sale_categories: true } }>;
type ProductQuery = { category_id?: string; gender?: string; page?: string; limit?: string; q?: string; category?: string };

@Injectable()
export class CustomerProductService {
  constructor(private readonly prisma: PrismaService) {}

  private parseGender(value: unknown): Gender {
    if (value === Gender.male || value === Gender.female || value === Gender.unisex) return value;
    throw new Error('Invalid gender');
  }

  private async getActiveSalesCache(): Promise<ActiveSale[]> {
    return this.prisma.sale.findMany({
      where: { status: true, start_date: { lte: new Date() }, end_date: { gte: new Date() } },
      include: { product_sales: true, sale_categories: true },
    });
  }

  private calculateSalePercent(product: Pick<Product, 'id' | 'category_id'>, sales: ActiveSale[]): number {
    let maxDiscount = 0;
    for (const sale of sales) {
      const applies = sale.apply_scope === 'all'
        || (sale.apply_scope === 'product' && sale.product_sales.some((row) => row.product_id === product.id))
        || (sale.apply_scope === 'category' && sale.sale_categories.some((row) => row.category_id === product.category_id));
      if (applies && Number(sale.discount_percent) > maxDiscount) maxDiscount = Number(sale.discount_percent);
    }
    return maxDiscount;
  }

  private async recordInteraction(userId: number, productId: number, type: 'view' | 'add_to_cart' | 'purchase') {
    if (!userId || !productId || !type) return;
    try {
      if (type === 'view') {
        const recentView = await this.prisma.userProductInteraction.findFirst({
          where: { user_id: userId, product_id: productId, interaction_type: 'view', created_at: { gte: new Date(Date.now() - 5 * 60 * 1000) } },
        });
        if (recentView) return;
      }
      await this.prisma.userProductInteraction.create({ data: { user_id: userId, product_id: productId, interaction_type: type } });
    } catch (error) {
      console.error('Interaction log error:', getErrorMessage(error));
    }
  }

  async getRepresentative(categoryId?: string) {
    if (!categoryId) throw new BadRequestException({ message: 'Missing category_id' });
    try {
      const product = await this.prisma.product.findFirst({
        where: { category_id: Number(categoryId), is_active: true },
        orderBy: { created_at: 'desc' },
      });
      if (!product) throw new NotFoundException({ message: 'Product not found' });
      return product;
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof NotFoundException) throw error;
      console.error('Error getRepresentative:', error);
      throw new InternalServerErrorException({ message: 'Server error' });
    }
  }

  async getProducts(query: ProductQuery) {
    try {
      const page = Number(query.page) || 1;
      const limit = Number(query.limit) || 8;
      const where: Prisma.ProductWhereInput = { is_active: true };
      if (query.category_id) where.category_id = Number(query.category_id);
      if (query.gender && query.gender !== '') where.gender = this.parseGender(query.gender);
      const [productsRaw, totalProducts, activeSales] = await Promise.all([
        this.prisma.product.findMany({
          where, skip: (page - 1) * limit, take: limit, orderBy: { created_at: 'desc' },
          include: { colors: { include: { sizes: true } } },
        }),
        this.prisma.product.count({ where }),
        this.getActiveSalesCache(),
      ]);
      const products = productsRaw.map((product) => ({
        ...product,
        sale_percent: this.calculateSalePercent(product, activeSales),
        total_stock: product.colors.reduce((sum, color) => sum + color.sizes.reduce((stock, size) => stock + size.stock, 0), 0),
      }));
      return { data: products, products, totalPages: Math.ceil(totalProducts / limit), currentPage: page, totalProducts };
    } catch (error) {
      console.error('Error getProducts:', error);
      throw new InternalServerErrorException({ message: 'Server error when fetching product list' });
    }
  }

  async searchProducts(query: ProductQuery) {
    try {
      const page = Number(query.page) || 1;
      const limit = Number(query.limit) || 8;
      const search = query.q ? String(query.q) : '';
      const where: Prisma.ProductWhereInput = {
        is_active: true,
        OR: [
          { name: { contains: search } }, { name_vi: { contains: search } }, { name_en: { contains: search } },
          { description: { contains: search } }, { description_vi: { contains: search } }, { description_en: { contains: search } },
        ],
      };
      if (query.category) where.category_id = Number(query.category);
      if (query.gender && query.gender !== '') where.gender = this.parseGender(query.gender);
      const [productsRaw, totalProducts, activeSales] = await Promise.all([
        this.prisma.product.findMany({
          where, skip: (page - 1) * limit, take: limit, orderBy: { created_at: 'desc' },
          include: { category: true, colors: { include: { sizes: true } } },
        }),
        this.prisma.product.count({ where }),
        this.getActiveSalesCache(),
      ]);
      const products = productsRaw.map((product) => ({
        ...product,
        category_name: product.category?.name,
        category_name_vi: product.category?.name_vi,
        category_name_en: product.category?.name_en,
        sale_percent: this.calculateSalePercent(product, activeSales),
        total_stock: product.colors.reduce((sum, color) => sum + color.sizes.reduce((stock, size) => stock + size.stock, 0), 0),
      }));
      return { data: products, products, totalPages: Math.ceil(totalProducts / limit), currentPage: page, totalProducts };
    } catch (error) {
      console.error('Error searchProducts:', error);
      throw new InternalServerErrorException({ message: 'Server error during search' });
    }
  }

  async getProduct(id: string, userId?: number) {
    try {
      const productId = Number(id);
      const [product, activeSales] = await Promise.all([
        this.prisma.product.findFirst({ where: { id: productId, is_active: true }, include: { category: true, colors: { include: { sizes: true } } } }),
        this.getActiveSalesCache(),
      ]);
      if (!product) throw new NotFoundException({ message: 'Product not found' });
      const response = {
        ...product,
        category_name: product.category?.name,
        category_name_vi: product.category?.name_vi,
        category_name_en: product.category?.name_en,
        sale_percent: this.calculateSalePercent(product, activeSales),
      };
      if (userId) void this.recordInteraction(userId, productId, 'view');
      return response;
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      console.error('Error getProduct:', error);
      throw new InternalServerErrorException({ message: 'Server error' });
    }
  }

  async logInteraction(userId: number | undefined, body: { productId?: number | string; type?: string }) {
    try {
      if (userId && body.type === 'add_to_cart') await this.recordInteraction(userId, Number(body.productId), 'add_to_cart');
      return { message: 'Interaction recorded' };
    } catch (error) {
      console.error('Log error:', error);
      throw new InternalServerErrorException({ message: 'Error logging interaction' });
    }
  }

  async getProductOptions(id: string) {
    try {
      return await this.prisma.productColor.findMany({
        where: { product_id: Number(id), product: { is_active: true } },
        include: { sizes: true },
      });
    } catch (error) {
      console.error('Error getProductOptions:', error);
      throw new InternalServerErrorException({ message: 'Server error' });
    }
  }

  private async getRecommendedProducts(userId: string) {
    const targetSize = 8;
    let products: Product[] = [];
    let excludeIds: number[] = [];
    const isGuest = !userId || userId === 'guest' || userId === 'null' || userId === 'undefined';
    if (!isGuest) {
      try {
        const query = Prisma.sql`
          SELECT DISTINCT p.* FROM products p
          JOIN user_product_interaction upi ON p.id = upi.product_id
          WHERE p.is_active IS TRUE
          AND upi.user_id IN (
            SELECT DISTINCT t2.user_id
            FROM user_product_interaction t1
            JOIN user_product_interaction t2 ON t1.product_id = t2.product_id
            WHERE t1.user_id = ${Number(userId)} AND t2.user_id != ${Number(userId)}
          )
          AND p.id NOT IN (
            SELECT product_id FROM user_product_interaction
            WHERE user_id = ${Number(userId)} AND interaction_type = 'purchase'
          )
          LIMIT ${targetSize};
        `;
        products = await this.prisma.$queryRaw<Product[]>(query);
        excludeIds = products.map((product) => product.id);
      } catch {
        console.warn('User has not interacted enough; using fallback recommendations.');
      }
    }
    if (products.length < targetSize) {
      const missing = targetSize - products.length;
      const query = excludeIds.length
        ? Prisma.sql`SELECT * FROM products WHERE is_active IS TRUE AND id NOT IN (${Prisma.join(excludeIds)}) ORDER BY RANDOM() LIMIT ${missing}`
        : Prisma.sql`SELECT * FROM products WHERE is_active IS TRUE ORDER BY RANDOM() LIMIT ${missing}`;
      products = [...products, ...await this.prisma.$queryRaw<Product[]>(query)];
    }
    const activeSales = await this.getActiveSalesCache();
    return products.map((product) => ({
      ...product,
      price: Number(product.price),
      sale_percent: this.calculateSalePercent(product, activeSales),
    }));
  }

  async getRecommendations(userId?: number) {
    try {
      return await this.getRecommendedProducts(userId ? String(userId) : 'guest');
    } catch (error) {
      console.error('Error getRecommendations:', error);
      throw new InternalServerErrorException({ message: 'Server error' });
    }
  }

  async getProductPrices(body: { productIds?: unknown }) {
    try {
      if (!Array.isArray(body.productIds) || body.productIds.length === 0) {
        throw new BadRequestException({ success: false, message: 'productIds array required' });
      }
      const ids = body.productIds.map(Number).filter((id) => id > 0);
      const products = await this.prisma.product.findMany({ where: { id: { in: ids } }, select: { id: true, price: true, category_id: true } });
      const sales = await this.getActiveSalesCache();
      const priceMap: Record<number, number> = {};
      for (const product of products) {
        const applicable = sales.filter((sale) => sale.apply_scope === 'all'
          || sale.product_sales.some((row) => row.product_id === product.id)
          || sale.sale_categories.some((row) => row.category_id === product.category_id))
          .sort((a, b) => Number(b.discount_percent) - Number(a.discount_percent));
        const discount = applicable.length ? Number(applicable[0].discount_percent) : 0;
        priceMap[product.id] = calculateDiscountedUnitPrice(product.price, discount);
      }
      return { success: true, data: priceMap };
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      console.error('getProductPrices error:', error);
      throw new InternalServerErrorException({ success: false, message: 'Server error' });
    }
  }
}
