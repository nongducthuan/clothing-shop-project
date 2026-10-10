import { Request, Response } from 'express';
import prisma from '../../../prisma/client';

export const getMemberships = async (req: Request, res: Response): Promise<void> => {
    try {
        const data = await prisma.membership.findMany({
            where: { is_active: true },
            orderBy: {
                min_spending: 'asc',
            },
            select: {
                id: true,
                name: true,
                min_spending: true,
                discount_percent: true,
            }
        });
        res.json(data);
    } catch (error) {
        console.error('Error fetching memberships:', error);
        res.status(500).json({ message: "Error fetching membership tiers" });
    }
};
