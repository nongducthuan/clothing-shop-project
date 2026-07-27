import { Request, Response } from 'express';
import prisma from '../../../prisma/client';

export const getClientSales = async (req: Request, res: Response): Promise<void> => {
  try {
    const sales = await prisma.sale.findMany({
      where: {
        status: 1,
        start_date: { lte: new Date() },
        end_date: { gte: new Date() }
      }
    });
    res.json({ success: true, data: sales });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
