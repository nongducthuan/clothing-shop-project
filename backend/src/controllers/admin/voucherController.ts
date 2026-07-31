import { Request, Response } from 'express';
import prisma from '../../../prisma/client';

export const createVoucherAdmin = async (req: Request, res: Response): Promise<void> => {
  try {
    const { productIds, categoryIds, applicable_category_id, code, description, discount_percent, max_discount_amount, min_order_value, usage_limit, start_date, end_date, apply_scope } = req.body;
    
    await prisma.$transaction(async (tx) => {
      const voucher = await tx.voucher.create({
        data: {
          code,
          description: description || null,
          discount_percent: discount_percent ? Number(discount_percent) : null,
          max_discount_amount: max_discount_amount ? Number(max_discount_amount) : null,
          min_order_value: Number(min_order_value) || 0,
          usage_limit: usage_limit ? Number(usage_limit) : null,
          start_date: start_date ? new Date(start_date) : null,
          end_date: end_date ? new Date(end_date) : null,
          apply_scope: apply_scope as any,
          status: 1
        }
      });

      if (apply_scope === 'category' && categoryIds && categoryIds.length > 0) {
        await tx.voucherCategory.createMany({
          data: categoryIds.map((id: number) => ({
            voucher_id: voucher.id,
            category_id: Number(id)
          }))
        });
      }

      if (apply_scope === 'product' && productIds && productIds.length > 0) {
        await tx.productVoucher.createMany({
          data: productIds.map((id: number) => ({
            voucher_id: voucher.id,
            product_id: Number(id)
          }))
        });
      }
    });

    res.status(201).json({ success: true, message: "Voucher Created Successfully!" });
  } catch (error: any) {
    console.error("BACKEND ERROR:", error.message);
    res.status(500).json({ success: false, message: "Server error creating voucher" });
  }
};

export const getAllVouchersAdmin = async (req: Request, res: Response): Promise<void> => {
  try {
    const vouchers = await prisma.voucher.findMany({
      orderBy: { created_at: 'desc' }
    });
    res.json({ success: true, data: vouchers });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const toggleVoucherStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    await prisma.voucher.update({
      where: { id: Number(id) },
      data: { status: Number(status) }
    });
    res.json({ success: true, message: "Voucher status updated successfully!" });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const removeVoucher = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const voucher = await prisma.voucher.update({
      where: { id: Number(id) },
      data: { status: 0 }
    });
    
    if (!voucher) {
      res.status(404).json({ success: false, message: "Voucher not found or already deleted!" });
      return;
    }
    
    res.json({ success: true, message: "Voucher deleted successfully! The code has been released for reuse." });
  } catch (error: any) {
    console.error("Remove Voucher Error:", error);
    res.status(500).json({ success: false, message: "System error while deleting voucher." });
  }
};

export const getVoucherDetails = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params; 
    if (!id) {
        res.status(400).json({ success: false, message: "Missing ID" });
        return;
    }

    const voucher = await prisma.voucher.findUnique({
        where: { id: Number(id) },
        include: {
            product_vouchers: { include: { product: true } },
            voucher_categories: { include: { category: true } }
        }
    });

    if (!voucher) {
      res.status(404).json({ success: false, message: "Voucher not found" });
      return;
    }

    let details: any[] = [];
    if (voucher.apply_scope === 'product') {
        details = voucher.product_vouchers.map(pv => ({ name: pv.product.name }));
    } else if (voucher.apply_scope === 'category') {
        details = voucher.voucher_categories.map(vc => ({ name: vc.category.name }));
    }

    res.json({ success: true, details });
  } catch (error: any) {
    console.error("Lỗi Controller:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};
