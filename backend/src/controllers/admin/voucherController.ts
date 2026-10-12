import { Request, Response } from 'express';
import prisma from '../../../prisma/client';
import { ApplyScope, Gender, Prisma } from '../../generated/prisma/client';
import { getErrorMessage } from '../../utils/errorMessage';

const parseApplyScope = (value: unknown): ApplyScope => {
  if (value === ApplyScope.all || value === ApplyScope.category || value === ApplyScope.product) return value;
  throw new Error('Invalid apply scope');
};

export const createVoucherAdmin = async (req: Request, res: Response): Promise<void> => {
  try {
    const { productIds, categoryIds, code, discount_percent, max_discount_amount, min_order_value, usage_limit, start_date, end_date, apply_scope } = req.body;

    await prisma.$transaction(async (tx) => {
      const voucher = await tx.voucher.create({
        data: {
          code,
          discount_percent: discount_percent ? Number(discount_percent) : null,
          max_discount_amount: max_discount_amount ? Number(max_discount_amount) : null,
          min_order_value: Number(min_order_value) || 0,
          usage_limit: usage_limit ? Number(usage_limit) : null,
          start_date: start_date ? new Date(start_date) : null,
          end_date: end_date ? new Date(end_date) : null,
          apply_scope: parseApplyScope(apply_scope),
          status: true
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
  } catch (error: unknown) {
    console.error("BACKEND ERROR:", getErrorMessage(error));
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      res.status(400).json({ success: false, message: "Mã voucher này đã tồn tại. Vui lòng nhập mã khác!" });
      return;
    }
    res.status(500).json({ success: false, message: "Server error creating voucher" });
  }
};

export const updateVoucherAdmin = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { productIds, categoryIds, code, discount_percent, max_discount_amount, min_order_value, usage_limit, start_date, end_date, apply_scope } = req.body;

    await prisma.$transaction(async (tx) => {
      await tx.voucher.update({
        where: { id: Number(id) },
        data: {
          code,
          discount_percent: discount_percent ? Number(discount_percent) : null,
          max_discount_amount: max_discount_amount ? Number(max_discount_amount) : null,
          min_order_value: Number(min_order_value) || 0,
          usage_limit: usage_limit ? Number(usage_limit) : null,
          start_date: start_date ? new Date(start_date) : null,
          end_date: end_date ? new Date(end_date) : null,
          apply_scope: parseApplyScope(apply_scope),
        }
      });

      // Xoá relations cũ rồi tạo lại
      await tx.voucherCategory.deleteMany({ where: { voucher_id: Number(id) } });
      await tx.productVoucher.deleteMany({ where: { voucher_id: Number(id) } });

      if (apply_scope === 'category' && categoryIds && categoryIds.length > 0) {
        await tx.voucherCategory.createMany({
          data: categoryIds.map((catId: number) => ({
            voucher_id: Number(id),
            category_id: Number(catId)
          }))
        });
      }

      if (apply_scope === 'product' && productIds && productIds.length > 0) {
        await tx.productVoucher.createMany({
          data: productIds.map((pId: number) => ({
            voucher_id: Number(id),
            product_id: Number(pId)
          }))
        });
      }
    });

    res.json({ success: true, message: "Voucher updated successfully!" });
  } catch (error: unknown) {
    console.error("UPDATE VOUCHER ERROR:", getErrorMessage(error));
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      res.status(400).json({ success: false, message: "Mã voucher (code) này đã tồn tại. Vui lòng nhập mã khác!" });
      return;
    }
    res.status(500).json({ success: false, message: "Server error updating voucher" });
  }
};

export const getAllVouchersAdmin = async (req: Request, res: Response): Promise<void> => {
  try {
    const vouchers = await prisma.voucher.findMany({
      where: { status: true },
      orderBy: { created_at: 'desc' }
    });
    res.json({ success: true, data: vouchers });
  } catch (error: unknown) {
    res.status(500).json({ success: false, message: getErrorMessage(error) });
  }
};

export const toggleVoucherStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    await prisma.voucher.update({
      where: { id: Number(id) },
      data: { status: Boolean(Number(status)) }
    });
    res.json({ success: true, message: "Voucher status updated successfully!" });
  } catch (error: unknown) {
    res.status(500).json({ success: false, message: getErrorMessage(error) });
  }
};

export const removeVoucher = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const voucher = await prisma.voucher.update({
      where: { id: Number(id) },
      data: { status: false }
    });

    if (!voucher) {
      res.status(404).json({ success: false, message: "Voucher not found or already deleted!" });
      return;
    }

    res.json({ success: true, message: "Voucher deleted successfully! The code has been released for reuse." });
  } catch (error: unknown) {
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

    let details: Array<{ name: string; name_vi: string | null; name_en: string | null; gender: Gender }> = [];
    if (voucher.apply_scope === 'product') {
        details = voucher.product_vouchers.map(pv => ({
            name: pv.product.name,
            name_vi: pv.product.name_vi,
            name_en: pv.product.name_en,
            gender: pv.product.gender
        }));
    } else if (voucher.apply_scope === 'category') {
        details = voucher.voucher_categories.map(vc => ({
            name: vc.category.name,
            name_vi: vc.category.name_vi,
            name_en: vc.category.name_en,
            gender: vc.category.gender
        }));
    }

    res.json({ success: true, details });
  } catch (error: unknown) {
    console.error("Lỗi Controller:", getErrorMessage(error));
    res.status(500).json({ success: false, error: getErrorMessage(error) });
  }
};
