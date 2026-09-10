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
        const { image_url, title, title_vi, title_en, subtitle, subtitle_vi, subtitle_en } = req.body;
        const banner = await prisma.banner.create({
            data: {
                image_url,
                title,
                title_vi: title_vi || title || null,
                title_en: title_en || title || null,
                subtitle: subtitle || null,
                subtitle_vi: subtitle_vi || subtitle || null,
                subtitle_en: subtitle_en || subtitle || null,
            }
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
        const { image_url, title, title_vi, title_en, subtitle, subtitle_vi, subtitle_en } = req.body;
        await prisma.banner.update({
            where: { id: Number(id) },
            data: {
                image_url,
                title,
                title_vi: title_vi !== undefined ? (title_vi || null) : undefined,
                title_en: title_en !== undefined ? (title_en || null) : undefined,
                subtitle: subtitle !== undefined ? (subtitle || null) : undefined,
                subtitle_vi: subtitle_vi !== undefined ? (subtitle_vi || null) : undefined,
                subtitle_en: subtitle_en !== undefined ? (subtitle_en || null) : undefined,
            }
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
