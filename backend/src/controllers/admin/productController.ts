import { Request, Response } from 'express';
import prisma from '../../../prisma/client';
import type { Prisma } from '../../generated/prisma/client';

/** Số sản phẩm mỗi trang (backend chặn tối đa 100 để không trả cả bảng trong 1 request). */
const DEFAULT_PAGE_SIZE = 50;
const MAX_PAGE_SIZE = 100;

/** 3 giá trị enum của products.gender (khớp schema Prisma + enum MySQL). */
const GENDERS = ['male', 'female', 'unisex'];

/**
 * Kiểm tra gender + category của sản phẩm hợp lệ và KHỚP nhau.
 * Trả về thông báo lỗi (để controller trả 400) hoặc null nếu hợp lệ.
 * Validate ngay trong controller (không dùng zod) để tránh bẫy strip của validateMiddleware.
 */
const validateGenderAndCategory = async (gender: unknown, categoryId: unknown): Promise<string | null> => {
    if (typeof gender !== 'string' || !GENDERS.includes(gender)) return 'Invalid gender. Must be one of: male, female, unisex';
    const id = Number(categoryId);
    if (!Number.isInteger(id) || id <= 0) return 'Invalid category id';
    const category = await prisma.category.findUnique({ where: { id }, select: { gender: true } });
    if (!category) return 'Category not found';
    if (category.gender !== gender) return 'Product gender must match category gender';
    return null;
};

/**
 * Dựng `where` cho danh sách sản phẩm: chỉ sản phẩm đang bán + từ khoá tìm kiếm
 * + giới tính + nhóm danh mục.
 *
 * `category_ids` nhận danh sách id ngăn cách bởi dấu phẩy vì UI lọc theo TÊN danh mục:
 * "Áo thun" tồn tại riêng cho nam và nữ nên chọn 1 danh mục phải gom cả các danh mục
 * cùng tên — trước đây frontend tự gom ở client, giờ client gửi sẵn nhóm id lên server.
 */
const buildProductWhere = (query: Request['query']): Prisma.ProductWhereInput => {
    const where: Prisma.ProductWhereInput = { is_active: true };

    const search = typeof query.search === 'string' ? query.search.trim() : '';
    if (search) {
        // Tìm trên cả 3 tên (canonical + vi + en) để khoá tiếng Anh vẫn ra kết quả.
        where.OR = [
            { name: { contains: search } },
            { name_vi: { contains: search } },
            { name_en: { contains: search } },
        ];
    }

    const gender = typeof query.gender === 'string' ? query.gender.trim().toLowerCase() : '';
    if (GENDERS.includes(gender)) {
        where.gender = gender as Prisma.ProductWhereInput['gender'];
    }

    // Chấp nhận cả `category_ids` (nhóm, dạng mới) và `category_id` (1 danh mục).
    const rawCategoryIds = [
        query.category_ids,
        query.category_id,
    ]
        .filter((value): value is string => typeof value === 'string' && value.trim() !== '' && value !== 'all')
        .join(',');

    const categoryIds = Array.from(
        new Set(
            rawCategoryIds
                .split(',')
                .map((value) => Number(value.trim()))
                .filter((value) => Number.isInteger(value) && value > 0)
        )
    );
    if (categoryIds.length > 0) {
        where.category_id = { in: categoryIds };
    }

    return where;
};

export const getProducts = async (req: Request, res: Response): Promise<void> => {
    try {
        // ─── LỌC + PHÂN TRANG CHẠY Ở DB ───────────────────────────────────────
        // Truyền `page` → trả về 1 trang kèm metadata (data/currentPage/totalPages/totalProducts).
        // KHÔNG truyền `page` → trả mảng đầy đủ như trước, để các chỗ dùng nội bộ
        // (useSaleManager / useVoucherManager / usePromotionManager gọi limit=1000)
        // không bị đổi hợp đồng dữ liệu.
        const isPaginated = req.query.page !== undefined;
        const where = buildProductWhere(req.query);

        const page = Math.max(1, Number(req.query.page) || 1);
        const limit = Math.min(MAX_PAGE_SIZE, Math.max(1, Number(req.query.limit) || DEFAULT_PAGE_SIZE));

        const products = await prisma.product.findMany({
            where,
            include: {
                category: true,
                colors: {
                    include: { sizes: true }
                }
            },
            // Nam → Nữ → Unisex (đúng thứ tự enum trong DB), mới nhất đứng trước
            orderBy: [{ gender: 'asc' }, { id: 'desc' }],
            ...(isPaginated ? { skip: (page - 1) * limit, take: limit } : {})
        });

        const formattedProducts = products.map(p => {
            const totalStock = p.colors.reduce((acc, c) => acc + c.sizes.reduce((sum, s) => sum + s.stock, 0), 0);
            return {
                ...p,
                category_name: p.category?.name,
                category_name_vi: p.category?.name_vi,
                category_name_en: p.category?.name_en,
                total_stock: totalStock,
                unit_profit: Number(p.price) - Number(p.import_price)
            };
        });

        if (!isPaginated) {
            res.json(formattedProducts);
            return;
        }

        const totalProducts = await prisma.product.count({ where });

        res.json({
            data: formattedProducts,
            currentPage: page,
            totalPages: Math.max(1, Math.ceil(totalProducts / limit)),
            totalProducts
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error fetching products" });
    }
};

export const addProduct = async (req: Request, res: Response): Promise<void> => {
    try {
        const { name, name_vi, name_en, description, description_vi, description_en, price, import_price, image_url, gender, category_id } = req.body;
        
        // Validate gender + category khớp nhau trước khi ghi DB (trả 400 thay vì 500).
        const validationError = await validateGenderAndCategory(gender, category_id);
        if (validationError) {
            res.status(400).json({ message: validationError });
            return;
        }

        // name is the canonical display name (NOT NULL). Falls back to either localized name.
        const baseName = name || name_vi || name_en;
        const baseDescription = description || description_vi || description_en || '';
        
        const product = await prisma.product.create({
            data: {
                name: baseName,
                name_vi: name_vi || baseName || null,
                name_en: name_en || baseName || null,
                description: baseDescription,
                description_vi: description_vi || baseDescription || null,
                description_en: description_en || baseDescription || null,
                price,
                import_price: import_price || 0,
                image_url: image_url || null,
                gender: gender,
                category_id: Number(category_id)
            }
        });
        
        res.status(201).json({ id: product.id, message: "Product added successfully" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error adding product" });
    }
};

export const editProduct = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { name, name_vi, name_en, description, description_vi, description_en, price, import_price, image_url, gender, category_id } = req.body;
        
        // Validate gender + category khớp nhau trước khi ghi DB (trả 400 thay vì 500).
        const validationError = await validateGenderAndCategory(gender, category_id);
        if (validationError) {
            res.status(400).json({ message: validationError });
            return;
        }

        // Only touch names/descriptions that were provided; derive canonical name/description if missing.
        const baseName = name || name_vi || name_en;
        const baseDescription = description !== undefined ? description : (description_vi || description_en);
        
        await prisma.product.update({
            where: { id: Number(id) },
            data: {
                name: baseName || undefined,
                name_vi: name_vi !== undefined ? (name_vi || baseName || null) : undefined,
                name_en: name_en !== undefined ? (name_en || baseName || null) : undefined,
                description: baseDescription !== undefined ? (baseDescription || '') : undefined,
                description_vi: description_vi !== undefined ? (description_vi || baseDescription || null) : undefined,
                description_en: description_en !== undefined ? (description_en || baseDescription || null) : undefined,
                price,
                import_price: import_price || 0,
                image_url: image_url || null,
                gender: gender,
                category_id: Number(category_id)
            }
        });
        
        res.json({ affected: 1 });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error editing product" });
    }
};

export const removeProduct = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        // SOFT DELETE: Update is_active to false instead of deleting the record
        await prisma.product.update({
            where: { id: Number(id) },
            data: { is_active: false }
        });
        res.json({ affected: 1 });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error deleting product" });
    }
};

export const getProductDetail = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const product = await prisma.product.findUnique({
            where: { id: Number(id) },
            include: {
                colors: {
                    include: { sizes: true }
                }
            }
        });
        
        if (!product) {
            res.status(404).json({ message: "Not found" });
            return;
        }
        res.json(product);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
};

export const addColor = async (req: Request, res: Response): Promise<void> => {
    try {
        const { productId } = req.params;
        const { color_name, color_name_vi, color_name_en, color_code, image_url } = req.body;
        
        // color_name is the canonical display name (NOT NULL in schema).
        // Falls back to either localized name if the base one is missing.
        const baseName = color_name || color_name_vi || color_name_en;
        
        const color = await prisma.productColor.create({
            data: {
                product_id: Number(productId),
                color_name: baseName,
                color_name_vi: color_name_vi || baseName || null,
                color_name_en: color_name_en || baseName || null,
                color_code,
                image_url
            }
        });
        res.json({ id: color.id });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
};

export const removeColor = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        await prisma.productColor.delete({
            where: { id: Number(id) }
        });
        res.json({ message: "Color deleted successfully" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
};

export const addSize = async (req: Request, res: Response): Promise<void> => {
    try {
        const { colorId } = req.params;
        const { size, stock, increment } = req.body;

        const stockNum = Number(stock);
        if (!size || typeof size !== 'string') {
            res.status(400).json({ message: "Size is required" });
            return;
        }
        if (!Number.isInteger(stockNum) || stockNum < 0) {
            res.status(400).json({ message: "Stock must be a non-negative integer" });
            return;
        }
        
        const existing = await prisma.productSize.findFirst({
            where: { color_id: Number(colorId), size: size as Prisma.ProductSizeWhereInput['size'] }
        });
        
        if (existing) {
            if (increment) {
                await prisma.productSize.update({
                    where: { id: existing.id },
                    data: { stock: { increment: Number(stock) } }
                });
                res.json({ id: existing.id });
            } else {
                res.status(400).json({ message: "Size already exists" });
            }
        } else {
            const newSize = await prisma.productSize.create({
                data: {
                    color_id: Number(colorId),
                    size: size as Prisma.ProductSizeUncheckedCreateInput['size'],
                    stock: Number(stock)
                }
            });
            res.json({ id: newSize.id });
        }
    } catch (err: any) {
        console.error(err);
        res.status(500).json({ message: err.message || "Server error" });
    }
};

export const removeSize = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        await prisma.productSize.delete({
            where: { id: Number(id) }
        });
        res.json({ message: "Size deleted successfully" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
};

export const updateSize = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { stock } = req.body;

        // Stock must be a non-negative integer (schema CHECK stock >= 0)
        const stockValue = Number(stock);
        if (!Number.isInteger(stockValue) || stockValue < 0) {
            res.status(400).json({ message: "Stock must be a non-negative integer" });
            return;
        }

        const existing = await prisma.productSize.findUnique({ where: { id: Number(id) } });
        if (!existing) {
            res.status(404).json({ message: "Size not found" });
            return;
        }

        // Set the absolute stock value (correction mode), unlike addSize which increments
        const updated = await prisma.productSize.update({
            where: { id: Number(id) },
            data: { stock: stockValue }
        });

        res.json(updated);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
};
