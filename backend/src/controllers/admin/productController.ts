import { Request, Response } from 'express';
import prisma from '../../../prisma/client';

export const getProducts = async (req: Request, res: Response): Promise<void> => {
    try {
        const products = await prisma.product.findMany({
            include: {
                category: true,
                colors: {
                    include: { sizes: true }
                }
            },
            orderBy: { id: 'desc' }
        });

        // Map to match the previous structure
        const formattedProducts = products.map(p => {
            const totalStock = p.colors.reduce((acc, c) => acc + c.sizes.reduce((sum, s) => sum + s.stock, 0), 0);
            return {
                ...p,
                category_name: p.category?.name,
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
        const { name, description, price, import_price, image_url, gender, category_id } = req.body;
        
        const product = await prisma.product.create({
            data: {
                name,
                description: description || null,
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
        const { name, description, price, import_price, image_url, gender, category_id } = req.body;
        
        const product = await prisma.product.update({
            where: { id: Number(id) },
            data: {
                name,
                description: description || null,
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
        // Cascade delete is configured in prisma schema, so we just delete the product
        await prisma.product.delete({
            where: { id: Number(id) }
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

// --- COLORS & SIZES ---
export const addColor = async (req: Request, res: Response): Promise<void> => {
    try {
        const { productId } = req.params;
        const { color_name, color_code, image_url } = req.body;
        
        const color = await prisma.productColor.create({
            data: {
                product_id: Number(productId),
                color_name,
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
