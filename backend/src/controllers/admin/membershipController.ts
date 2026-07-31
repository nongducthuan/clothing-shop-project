import { Request, Response } from 'express';
import prisma from '../../../prisma/client';

export const getMemberships = async (req: Request, res: Response): Promise<void> => {
    try {
        const data = await prisma.membership.findMany({
            orderBy: {
                min_spending: 'asc',
            },
        });
        res.json(data);
    } catch (error) {
        console.error('Error fetching memberships:', error);
        res.status(500).json({ message: "Error fetching membership tiers" });
    }
};

export const addMembership = async (req: Request, res: Response): Promise<void> => {
    try {
        const { name, min_spending, discount_percent } = req.body;
        await prisma.membership.create({
            data: {
                name,
                min_spending,
                discount_percent,
            },
        });
        res.status(201).json({ message: "New membership tier added successfully" });
    } catch (error: any) {
        console.error('Error adding membership:', error);
        res.status(500).json({ message: error.message });
    }
};

export const updateMembership = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { name, min_spending, discount_percent } = req.body;
        
        await prisma.membership.update({
            where: { id: Number(id) },
            data: {
                name,
                min_spending,
                discount_percent,
            },
        });
        res.json({ message: "Membership tier updated successfully" });
    } catch (error: any) {
        console.error('Error updating membership:', error);
        res.status(500).json({ message: error.message });
    }
};

// Alias for route compatibility
export const createMembership = addMembership;

export const deleteMembership = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        await prisma.membership.delete({
            where: { id: Number(id) },
        });
        res.json({ message: "Membership tier deleted successfully" });
    } catch (error: any) {
        console.error('Error deleting membership:', error);
        res.status(500).json({ message: error.message });
    }
};

