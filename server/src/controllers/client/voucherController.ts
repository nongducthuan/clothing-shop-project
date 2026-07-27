import { Request, Response } from 'express';
import prisma from '../../../prisma/client';

export const applyVoucherClient = async (req: Request, res: Response): Promise<void> => {
  try {
    const { code, orderTotal, cartItems } = req.body;
    
    const voucher = await prisma.voucher.findUnique({
        where: { code },
        include: {
            product_vouchers: true,
            voucher_categories: true
        }
    });

    if (!voucher || voucher.status === 0) {
        res.status(404).json({ success: false, message: "Mã giảm giá không tồn tại hoặc đã hết hạn!" });
        return;
    }

    if (voucher.usage_limit !== null && voucher.usage_limit <= 0) {
        res.status(400).json({ success: false, message: "Mã giảm giá đã hết lượt sử dụng!" });
        return;
    }

    if (voucher.start_date && new Date() < new Date(voucher.start_date)) {
        res.status(400).json({ success: false, message: "Mã giảm giá chưa đến thời gian áp dụng!" });
        return;
    }

    if (voucher.end_date && new Date() > new Date(voucher.end_date)) {
        res.status(400).json({ success: false, message: "Mã giảm giá đã hết hạn!" });
        return;
    }
    
    let eligibleTotal = 0;
    
    if (voucher.apply_scope === 'all') {
      eligibleTotal = Number(orderTotal);
    } 
    else if (voucher.apply_scope === 'product') {
      const allowedIds = voucher.product_vouchers.map(pv => pv.product_id);
      const eligibleItems = cartItems.filter((item: any) => item.id && allowedIds.includes(Number(item.id)));
      eligibleTotal = eligibleItems.reduce((sum: number, item: any) => sum + (Number(item.price) * Number(item.quantity)), 0);
    } 
    else if (voucher.apply_scope === 'category') {
      const allowedIds = voucher.voucher_categories.map(vc => vc.category_id);
      const eligibleItems = cartItems.filter((item: any) => {
        if (!item.category_id) {
          console.warn("CẢNH BÁO: Sản phẩm trong giỏ hàng thiếu category_id", item.name);
          return false; 
        }
        return allowedIds.includes(Number(item.category_id));
      });
      eligibleTotal = eligibleItems.reduce((sum: number, item: any) => sum + (Number(item.price) * Number(item.quantity)), 0);
    }
    
    if (eligibleTotal === 0) {
      res.status(400).json({ success: false, message: "Mã giảm giá này không áp dụng cho các sản phẩm trong giỏ hàng của bạn!" });
      return;
    }
    
    if (Number(orderTotal) < Number(voucher.min_order_value)) {
      res.status(400).json({ success: false, message: `Đơn hàng chưa đạt mức tối thiểu ${Number(voucher.min_order_value).toLocaleString()}đ` });
      return;
    }
    
    let discountAmount = (eligibleTotal * Number(voucher.discount_percent || 0)) / 100;
    
    if (voucher.max_discount_amount && discountAmount > Number(voucher.max_discount_amount)) {
      discountAmount = Number(voucher.max_discount_amount);
    }
    
    res.json({
      success: true,
      message: "Áp dụng mã thành công!",
      data: {
        ...voucher,
        discount_amount: discountAmount,
        final_total: Number(orderTotal) - discountAmount,
        applied_to_total: eligibleTotal
      }
    });
  } catch (error) {
    console.error("Lỗi áp dụng Voucher:", error);
    res.status(500).json({ success: false, message: "Lỗi hệ thống khi áp dụng mã giảm giá" });
  }
};

export const getActiveVouchers = async (req: Request, res: Response): Promise<void> => {
  try {
    const { category_id, product_id } = req.query;

    const vouchers = await prisma.voucher.findMany({
        where: {
            status: 1,
            OR: [
                { start_date: null, end_date: null },
                { start_date: { lte: new Date() }, end_date: { gte: new Date() } }
            ],
            AND: [
                {
                    OR: [
                        { usage_limit: null },
                        { usage_limit: { gt: 0 } }
                    ]
                }
            ]
        },
        include: {
            product_vouchers: true,
            voucher_categories: true
        }
    });

    const filteredVouchers = vouchers.filter(v => {
        if (v.apply_scope === 'all') return true;
        if (v.apply_scope === 'category' && category_id) {
            return v.voucher_categories.some(vc => vc.category_id === Number(category_id));
        }
        if (v.apply_scope === 'product' && product_id) {
            return v.product_vouchers.some(pv => pv.product_id === Number(product_id));
        }
        return false;
    });

    res.json({ success: true, data: filteredVouchers });
  } catch (error: any) {
    console.error("Voucher API Error:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};
