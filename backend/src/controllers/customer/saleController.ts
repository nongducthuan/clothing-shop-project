import { Request, Response } from 'express';
import prisma from '../../../prisma/client';
import { getErrorMessage } from '../../utils/errorMessage';

export const getCustomerSales = async (req: Request, res: Response): Promise<void> => {
  try {
    const sales = await prisma.sale.findMany({
      where: {
        status: true,
        start_date: { lte: new Date() },
        end_date: { gte: new Date() }
      }
    });
    res.json({ success: true, data: sales });
  } catch (error: unknown) {
    res.status(500).json({ success: false, message: getErrorMessage(error) });
  }
};
