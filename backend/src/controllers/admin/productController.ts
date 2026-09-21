import { Request, Response } from 'express';
import prisma from '../../../prisma/client';

export const getProducts = async (req: Request, res: Response): Promise<void> => {
    try {
        const products = await prisma.product.findMany({
            where: { is_active: true },
            include: {
                category: true,
                colors: {
                    include: { sizes: true }
                }
            },
            orderBy: { id: 'desc' }
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

        res.json(formattedProducts);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error fetching products" });
    }
};

export const addProduct = async (req: Request, res: Response): Promise<void> => {
    try {
        const { name, name_vi, name_en, description, description_vi, description_en, price, import_price, image_url, gender, category_id } = req.body;
        
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
                gender: gender || 'unisex',
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
        
        // Only touch names/descriptions that were provided; derive canonical name/description if missing.
        const baseName = name || name_vi || name_en;
        const baseDescription = description !== undefined ? description : (description_vi || description_en);
        
        const product = await prisma.product.update({
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
        
        const existing = await prisma.productSize.findFirst({
            where: { color_id: Number(colorId), size: size }
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
                    size,
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
