import { Request, Response } from 'express';
import prisma from '../../../prisma/client';
// Import the interaction service you mentioned in task.md
import { recordInteraction } from '../../services/interactionService';
import { Prisma } from '../../generated/prisma/client';

// Helper to get active sales and calculate max discount for a product
const getActiveSalesCache = async () => {
    return prisma.sale.findMany({
        where: {
            status: 1,
            start_date: { lte: new Date() },
            end_date: { gte: new Date() },
        },
        include: {
            product_sales: true,
            sale_categories: true,
        }
    });
};

const calculateSalePercent = (product: any, activeSales: any[]) => {
    let maxDiscount = 0;
    for (const sale of activeSales) {
        let applies = false;
        if (sale.apply_scope === 'all') {
            applies = true;
        } else if (sale.apply_scope === 'product' && sale.product_sales.some((ps: any) => ps.product_id === product.id)) {
            applies = true;
        } else if (sale.apply_scope === 'category' && sale.sale_categories.some((sc: any) => sc.category_id === product.category_id)) {
            applies = true;
        }
        
        if (applies && Number(sale.discount_percent) > maxDiscount) {
            maxDiscount = Number(sale.discount_percent);
        }
    }
    return maxDiscount;
};

export const getRepresentative = async (req: Request, res: Response): Promise<void> => {
    const { category_id } = req.query;
    if (!category_id) {
        res.status(400).json({ message: "Missing category_id" });
        return;
    }

    try {
        const product = await prisma.product.findFirst({
            where: { category_id: Number(category_id) },
            orderBy: { created_at: 'desc' }
        });

        if (!product) {
            res.status(404).json({ message: "Product not found" });
            return;
        }

        res.json(product);
    } catch (err) {
        console.error("❌ Error getRepresentative:", err);
        res.status(500).json({ message: "Server error" });
    }
};

export const getProducts = async (req: Request, res: Response): Promise<void> => {
    try {
        const { category_id, gender, page = 1, limit = 8 } = req.query;
        const p = Number(page) || 1;
        const l = Number(limit) || 8;
        const offset = (p - 1) * l;

        const where: Prisma.ProductWhereInput = {};
        if (category_id) where.category_id = Number(category_id);
        if (gender && gender !== '') where.gender = gender as any;

        const [productsRaw, totalProducts, activeSales] = await Promise.all([
            prisma.product.findMany({
                where,
                skip: offset,
                take: l,
                orderBy: { created_at: 'desc' },
                include: {
                    colors: {
                        include: { sizes: true }
                    }
                }
            }),
            prisma.product.count({ where }),
            getActiveSalesCache()
        ]);

        const products = productsRaw.map(p => {
            const sale_percent = calculateSalePercent(p, activeSales);
            const total_stock = p.colors.reduce((acc, c) => acc + c.sizes.reduce((sum, s) => sum + s.stock, 0), 0);
            
            return {
                ...p,
                sale_percent,
                total_stock,
            };
        });

        const totalPages = Math.ceil(totalProducts / l);

        res.json({
            data: products,
            products, // for backward compatibility
            totalPages,
            currentPage: p,
            totalProducts,
        });
    } catch (err) {
        console.error("❌ Error getProducts:", err);
        res.status(500).json({ message: "Server error when fetching product list" });
    }
};

export const searchProducts = async (req: Request, res: Response): Promise<void> => {
    try {
        const { q, gender, category, page = 1, limit = 8 } = req.query;
        const p = Number(page) || 1;
        const l = Number(limit) || 8;
        const offset = (p - 1) * l;
        const searchStr = q ? String(q) : "";

        const where: Prisma.ProductWhereInput = {
            OR: [
                { name: { contains: searchStr } },
                { description: { contains: searchStr } }
            ]
        };
        if (category) where.category_id = Number(category);
        if (gender && gender !== '') where.gender = gender as any;

        const [productsRaw, totalProducts, activeSales] = await Promise.all([
            prisma.product.findMany({
                where,
                skip: offset,
                take: l,
                orderBy: { created_at: 'desc' },
                include: {
                    category: true,
                    colors: { include: { sizes: true } }
                }
            }),
            prisma.product.count({ where }),
            getActiveSalesCache()
        ]);

        const products = productsRaw.map(p => {
            const sale_percent = calculateSalePercent(p, activeSales);
            const total_stock = p.colors.reduce((acc, c) => acc + c.sizes.reduce((sum, s) => sum + s.stock, 0), 0);
            
            return {
                ...p,
                category_name: p.category?.name,
                sale_percent,
                total_stock,
            };
        });

        const totalPages = Math.ceil(totalProducts / l);

        res.json({
            data: products,
            products, // for backward compatibility
            totalPages,
            currentPage: p,
            totalProducts,
        });
    } catch (err) {
        console.error("❌ Error searchProducts:", err);
        res.status(500).json({ message: "Server error during search" });
    }
};

export const getProduct = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const productId = Number(id);

        const [product, activeSales] = await Promise.all([
            prisma.product.findUnique({
                where: { id: productId },
                include: {
                    category: true,
                    colors: { include: { sizes: true } }
                }
            }),
            getActiveSalesCache()
        ]);

        if (!product) {
            res.status(404).json({ message: "Product not found" });
            return;
        }

        const sale_percent = calculateSalePercent(product, activeSales);
        
        const responseProduct = {
            ...product,
            category_name: product.category?.name,
            sale_percent,
        };

        const userId = req.user?.id || req.query.userId;
        if (userId && userId !== 'guest' && userId !== 'null') {
            recordInteraction(Number(userId), productId, "view").catch((err: any) =>
                console.error("⚠️ Failed to log view:", err.message),
            );
            console.log(`👁️ User ${userId} viewed Product ${productId}`);
        }

        res.json(responseProduct);
    } catch (err) {
        console.error("❌ Error getProduct:", err);
        res.status(500).json({ message: "Server error" });
    }
};

export const logInteraction = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.user?.id;
        const { productId, type } = req.body;

        if (userId && type === "add_to_cart") {
            await recordInteraction(userId, Number(productId), "add_to_cart");
        }

        res.status(200).json({ message: "Interaction recorded" });
    } catch (err) {
        console.error("Log error:", err);
        res.status(500).json({ message: "Error logging interaction" });
    }
};

export const getProductOptions = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const colors = await prisma.productColor.findMany({
            where: { product_id: Number(id) },
            include: { sizes: true }
        });
        res.json(colors);
    } catch (err) {
        console.error("❌ Error getProductOptions:", err);
        res.status(500).json({ message: "Server error" });
    }
};

export const getRecommendations = async (req: Request, res: Response): Promise<void> => {
    try {
        let { userId } = req.params;
        const TARGET_SIZE = 8;
        let finalProducts: any[] = [];
        let excludeIds: number[] = [];

        const isGuest = !userId || userId === 'guest' || userId === 'null' || userId === 'undefined';

        if (!isGuest) {
            try {
                // Using queryRaw for collaborative filtering logic
                const sqlRecs = Prisma.sql`
                    SELECT DISTINCT p.* FROM products p
                    JOIN user_product_interaction upi ON p.id = upi.product_id
                    WHERE upi.user_id IN (
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
                const recs = await prisma.$queryRaw(sqlRecs) as any[];
                finalProducts = recs;
                excludeIds = finalProducts.map(p => p.id);
            } catch (err) {
                console.warn("⚠️ User hasn't interacted enough, falling back to random.");
            }
        }

        if (finalProducts.length < TARGET_SIZE) {
            const missingCount = TARGET_SIZE - finalProducts.length;
            
            // Prisma doesn't natively support ORDER BY RAND(), using queryRaw
            let sqlRandom;
            if (excludeIds.length > 0) {
                sqlRandom = Prisma.sql`SELECT * FROM products WHERE id NOT IN (${Prisma.join(excludeIds)}) ORDER BY RAND() LIMIT ${missingCount}`;
            } else {
                sqlRandom = Prisma.sql`SELECT * FROM products ORDER BY RAND() LIMIT ${missingCount}`;
            }
            
            const randomProducts = await prisma.$queryRaw(sqlRandom) as any[];
            finalProducts = [...finalProducts, ...randomProducts];
        }

        res.json(finalProducts);
    } catch (err) {
        console.error("❌ Error getRecommendations:", err);
        res.status(500).json({ message: "Server error" });
    }
};
