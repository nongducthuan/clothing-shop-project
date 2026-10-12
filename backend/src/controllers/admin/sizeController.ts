import { Request, Response } from 'express';
import prisma from '../../../prisma/client';
import type { Prisma } from '../../generated/prisma/client';
import { getErrorMessage } from '../../utils/errorMessage';

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
    } catch (err: unknown) {
        console.error(err);
        res.status(500).json({ message: getErrorMessage(err, "Server error") });
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
