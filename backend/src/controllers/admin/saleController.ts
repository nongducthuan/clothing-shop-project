import { Request, Response } from 'express';
import prisma from '../../../prisma/client';

export const createSaleAdmin = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, discount_percent, productIds, categoryIds, buy_x, get_y, start_date, end_date, apply_scope } = req.body;
    
    await prisma.$transaction(async (tx) => {
      const sale = await tx.sale.create({
        data: {
          name,
          discount_percent: Number(discount_percent),
          apply_scope: apply_scope as any,
          start_date: new Date(start_date),
          end_date: new Date(end_date),
          status: true // Fix 10: Boolean
        }
      });

      if (apply_scope === 'category' && categoryIds && categoryIds.length > 0) {
        await tx.saleCategory.createMany({
          data: categoryIds.map((id: number) => ({
            sale_id: sale.id,
            category_id: Number(id)
          }))
        });
      }

      if (apply_scope === 'product' && productIds && productIds.length > 0) {
        await tx.productSale.createMany({
          data: productIds.map((id: number) => ({
            sale_id: sale.id,
            product_id: Number(id)
          }))
        });
      }
    });

    res.status(201).json({ success: true, message: "Created Successfully!" });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getAllSalesAdmin = async (req: Request, res: Response): Promise<void> => {
  try {
    const sales = await prisma.sale.findMany({
      orderBy: { created_at: 'desc' }
    });
    res.json({ success: true, data: sales });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const toggleSaleStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status } = req.body; 
    await prisma.sale.update({
      where: { id: Number(id) },
      data: { status: Boolean(Number(status)) } // Fix 10: Boolean (1→true, 0→false)
    });
    res.json({ success: true, message: "Update status successfully!" });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const removeSale = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const sale = await prisma.sale.update({
      where: { id: Number(id) },
      data: { status: false } // Fix 10: Boolean
    });
    
    if (!sale) {
      res.status(404).json({ success: false, message: "Promotion not found!" });
      return;
    }
    
    res.json({ success: true, message: "Promotion deleted successfully (Moved to archives)!" });
  } catch (error: any) {
    console.error("Remove Sale Error:", error);
    res.status(500).json({ success: false, message: "System error while deleting promotion: " + error.message });
  }
};

export const getSaleDetailsAdmin = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { type } = req.query; 
    
    if (!id || !type) {
      res.status(400).json({ success: false, message: "Missing id or type" });
      return;
    }

    let details: any[] = [];
    if (type === 'product') {
        const productSales = await prisma.productSale.findMany({
            where: { sale_id: Number(id) },
            include: { product: true }
        });
        details = productSales.map(ps => ({ name: ps.product.name }));
    } else if (type === 'category') {
        const categorySales = await prisma.saleCategory.findMany({
            where: { sale_id: Number(id) },
            include: { category: true }
        });
        details = categorySales.map(cs => ({ name: cs.category.name }));
    }

    res.json({ success: true, details });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
