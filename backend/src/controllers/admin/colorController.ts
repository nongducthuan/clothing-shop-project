import { Request, Response } from 'express';
import prisma from '../../../prisma/client';

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
