import { Request, Response } from 'express';
import prisma from '../../../prisma/client';

export const getAdminPromotions = async (req: Request, res: Response): Promise<void> => {
    try {
        const promotions = await prisma.buyXGetYPromotion.findMany({
            where: { is_active: true },
            orderBy: { created_at: 'desc' }
        });
        res.status(200).json(promotions);
    } catch (error) {
        console.error('Error fetching admin promotions:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

export const createPromotion = async (req: Request, res: Response): Promise<void> => {
    try {
        const data = req.body;
        const newPromo = await prisma.buyXGetYPromotion.create({
            data: {
                name: data.name,
                description: data.description,
                buy_product_id: Number(data.buy_product_id),
                buy_quantity: Number(data.buy_quantity),
                gift_product_id: Number(data.gift_product_id),
                gift_quantity: Number(data.gift_quantity),
                start_date: new Date(data.start_date),
                end_date: new Date(data.end_date),
                max_gift_per_order: data.max_gift_per_order ? Number(data.max_gift_per_order) : null,
                total_gift_limit: data.total_gift_limit ? Number(data.total_gift_limit) : null,
                priority: data.priority ? Number(data.priority) : 0,
                is_stackable: Boolean(data.is_stackable),
                status: 'active'
            }
        });
        res.status(201).json({ success: true, message: 'Created successfully', id: newPromo.id });
    } catch (error) {
        console.error('Error creating promotion:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

export const updatePromotion = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const data = req.body;
        
        await prisma.buyXGetYPromotion.update({
            where: { id: Number(id) },
            data: {
                name: data.name,
                description: data.description,
                buy_product_id: Number(data.buy_product_id),
                buy_quantity: Number(data.buy_quantity),
                gift_product_id: Number(data.gift_product_id),
                gift_quantity: Number(data.gift_quantity),
                start_date: new Date(data.start_date),
                end_date: new Date(data.end_date),
                max_gift_per_order: data.max_gift_per_order ? Number(data.max_gift_per_order) : null,
                total_gift_limit: data.total_gift_limit ? Number(data.total_gift_limit) : null,
                priority: data.priority ? Number(data.priority) : 0,
                is_stackable: Boolean(data.is_stackable)
            }
        });
        res.status(200).json({ success: true, message: 'Updated successfully' });
    } catch (error) {
        console.error('Error updating promotion:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

export const deletePromotion = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        await prisma.buyXGetYPromotion.update({
            where: { id: Number(id) },
            data: { is_active: false }
        });
        res.status(200).json({ success: true, message: 'Deleted successfully' });
    } catch (error) {
        console.error('Error deleting promotion:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
