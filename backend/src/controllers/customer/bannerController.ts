import { Request, Response } from 'express';
import prisma from '../../../prisma/client';

export const getBanners = async (req: Request, res: Response): Promise<void> => {
    try {
        const banners = await prisma.banner.findMany({
            orderBy: { id: 'desc' }
        });
        res.json(banners);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
};
