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

export const addBanner = async (req: Request, res: Response): Promise<void> => {
    try {
        const { image_url, title, subtitle } = req.body;
        const banner = await prisma.banner.create({
            data: { image_url, title, subtitle }
        });
        res.status(201).json({ id: banner.id, message: "Banner added successfully" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
};

export const editBanner = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { image_url, title, subtitle } = req.body;
        await prisma.banner.update({
            where: { id: Number(id) },
            data: { image_url, title, subtitle }
        });
        res.json({ message: "Banner updated successfully" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
};

export const removeBanner = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        await prisma.banner.delete({
            where: { id: Number(id) }
        });
        res.json({ message: "Banner deleted successfully" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
};
