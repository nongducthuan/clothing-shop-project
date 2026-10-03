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
        // title is the canonical display text (NOT NULL). Falls back to either localized title.
        const baseTitle = title || title_vi || title_en;
        const banner = await prisma.banner.create({
            data: {
                image_url,
                title: baseTitle,
                title_vi: title_vi || baseTitle || null,
                title_en: title_en || baseTitle || null,
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
        // Only touch fields that were provided; derive canonical title if missing.
        const baseTitle = title || title_vi || title_en;
        await prisma.banner.update({
            where: { id: Number(id) },
            data: {
                image_url,
                title: baseTitle || undefined,
                title_vi: title_vi !== undefined ? (title_vi || baseTitle || null) : undefined,
                title_en: title_en !== undefined ? (title_en || baseTitle || null) : undefined,
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
