import prisma from '../../prisma/client';
import { Prisma, Product } from '../generated/prisma/client';

type ActiveSale = Prisma.SaleGetPayload<{
    include: {
        product_sales: true;
        sale_categories: true;
    };
}>;

type RecommendedProduct = Omit<Product, 'price'> & {
    price: number;
    sale_percent: number;
};

// Helper to get active sales and calculate max discount for a product
export const getActiveSalesCache = async () => {
    return prisma.sale.findMany({
        where: {
            status: true,
            start_date: { lte: new Date() },
            end_date: { gte: new Date() },
        },
        include: {
            product_sales: true,
            sale_categories: true,
        }
    });
};

export const calculateSalePercent = (
    product: Pick<Product, 'id' | 'category_id'>,
    activeSales: ActiveSale[]
): number => {
    let maxDiscount = 0;
    for (const sale of activeSales) {
        let applies = false;
        if (sale.apply_scope === 'all') {
            applies = true;
        } else if (sale.apply_scope === 'product' && sale.product_sales.some((ps) => ps.product_id === product.id)) {
            applies = true;
        } else if (sale.apply_scope === 'category' && sale.sale_categories.some((sc) => sc.category_id === product.category_id)) {
            applies = true;
        }

        if (applies && Number(sale.discount_percent) > maxDiscount) {
            maxDiscount = Number(sale.discount_percent);
        }
    }
    return maxDiscount;
};

/** Gợi ý sản phẩm: collaborative filtering (user đã đăng nhập) + bù ngẫu nhiên cho đủ TARGET_SIZE. */
export const getRecommendedProducts = async (userId: string | string[] | undefined) => {
    const TARGET_SIZE = 8;
    let finalProducts: Product[] = [];
    let excludeIds: number[] = [];

    const isGuest = !userId || userId === 'guest' || userId === 'null' || userId === 'undefined';

    if (!isGuest) {
        try {
            // Using queryRaw for collaborative filtering logic
            const sqlRecs = Prisma.sql`
                SELECT DISTINCT p.* FROM products p
                JOIN user_product_interaction upi ON p.id = upi.product_id
                WHERE p.is_active = 1
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
                LIMIT ${TARGET_SIZE};
            `;
            const recs = await prisma.$queryRaw<Product[]>(sqlRecs);
            finalProducts = recs;
            excludeIds = finalProducts.map(p => p.id);
        } catch (err) {
            console.warn("âš ï¸ User hasn't interacted enough, falling back to random.");
        }
    }

    if (finalProducts.length < TARGET_SIZE) {
        const missingCount = TARGET_SIZE - finalProducts.length;

        // Prisma doesn't natively support ORDER BY RAND(), using queryRaw
        let sqlRandom;
        if (excludeIds.length > 0) {
            sqlRandom = Prisma.sql`SELECT * FROM products WHERE is_active = 1 AND id NOT IN (${Prisma.join(excludeIds)}) ORDER BY RAND() LIMIT ${missingCount}`;
        } else {
            sqlRandom = Prisma.sql`SELECT * FROM products WHERE is_active = 1 ORDER BY RAND() LIMIT ${missingCount}`;
        }

        const randomProducts = await prisma.$queryRaw<Product[]>(sqlRandom);
        finalProducts = [...finalProducts, ...randomProducts];
    }

    // Calculate sale_percent for recommended products
    const activeSales = await getActiveSalesCache();
    const productsWithSales: RecommendedProduct[] = finalProducts.map(p => {
        const sale_percent = calculateSalePercent(p, activeSales);
        return {
            ...p,
            price: Number(p.price),
            sale_percent
        };
    });
    return productsWithSales;
};
