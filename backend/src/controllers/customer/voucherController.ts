import { Request, Response } from 'express';
import prisma from '../../../prisma/client';
import type { Prisma } from '../../generated/prisma/client';

type CartItem = {
    id?: number | string;
    product_id?: number | string;
    quantity: number | string;
    block_other_discounts?: boolean;
};

type ActiveSale = Prisma.SaleGetPayload<{
    include: { product_sales: true; sale_categories: true };
}>;

import { getErrorMessage } from '../../utils/errorMessage';
import { calculateDiscountedUnitPrice, toVnd } from '../../utils/pricing';

const isCartItem = (value: unknown): value is CartItem => {
    if (typeof value !== 'object' || value === null) return false;
    const item = value as Record<string, unknown>;
    const productId = item.product_id ?? item.id;
    return (typeof productId === 'number' || typeof productId === 'string') &&
        (typeof item.quantity === 'number' || typeof item.quantity === 'string');
};

export const applyVoucherCustomer = async (req: Request, res: Response): Promise<void> => {
  try {
    const { code, orderTotal, subtotal, membershipDiscountableSubtotal, cartItems } = req.body;

    const voucher = await prisma.voucher.findUnique({
        where: { code },
        include: {
            product_vouchers: true,
            voucher_categories: true
        }
    });

    if (!voucher || !voucher.status) {
        res.status(404).json({ success: false, message: "Voucher does not exist or has expired!" });
        return;
    }

    if (voucher.usage_limit !== null && voucher.usage_limit <= 0) {
        res.status(400).json({ success: false, message: "Voucher usage limit reached!" });
        return;
    }

    if (voucher.start_date && new Date() < new Date(voucher.start_date)) {
        res.status(400).json({ success: false, message: "Voucher is not active yet!" });
        return;
    }

    if (voucher.end_date && new Date() > new Date(voucher.end_date)) {
        res.status(400).json({ success: false, message: "Voucher has expired!" });
        return;
    }

    // Rebuild prices from the database rather than trusting client-submitted prices.
    // cartItems có thể không được gửi lên (VD: scope='all' chỉ cần orderTotal) → mặc định []
    const safeCartItems: CartItem[] = Array.isArray(cartItems) ? cartItems.filter(isCartItem) : [];
    const productIds = safeCartItems.map((item: CartItem) => Number(item.product_id || item.id)).filter(Boolean);
    const dbProducts = await prisma.product.findMany({
        where: { id: { in: productIds } },
        select: { id: true, price: true, category_id: true }
    });

    // Fetch active sales to compute correct sale prices
    const sales = await prisma.sale.findMany({
        where: {
            status: true,
            start_date: { lte: new Date() },
            end_date: { gte: new Date() }
        },
        include: { product_sales: true, sale_categories: true }
    });

    const priceMap = new Map();
    const categoryMap = new Map();

    for (const p of dbProducts) {
        categoryMap.set(p.id, p.category_id);

        // Calculate sale price
        const applicableSales = sales.filter((s: ActiveSale) =>
            s.apply_scope === 'all' ||
            s.product_sales.some((ps) => ps.product_id === p.id) ||
            s.sale_categories.some((sc) => sc.category_id === p.category_id)
        ).sort((a: ActiveSale, b: ActiveSale) => Number(b.discount_percent) - Number(a.discount_percent));

        const discount = applicableSales.length > 0 ? Number(applicableSales[0].discount_percent) : 0;
        const finalPrice = calculateDiscountedUnitPrice(p.price, discount);
        priceMap.set(p.id, finalPrice);
    }

    let eligibleTotal = 0;

    // Rebuild the pre-membership goods subtotal from current DB prices. The client
    // also sends which products cannot stack discounts so the preview matches checkout.
    const fallbackSubtotal = Number(subtotal || orderTotal || 0);
    const goodsSubtotal = safeCartItems.length > 0
      ? safeCartItems.reduce((sum, item) => {
          const pid = Number(item.product_id || item.id);
          return sum + (priceMap.get(pid) ?? 0) * Number(item.quantity);
        }, 0)
      : fallbackSubtotal;
    const orderTotalNum = Number(orderTotal || 0);
    const eligibleForMembership = safeCartItems.filter(item => item.block_other_discounts !== true);
    const membershipBase = eligibleForMembership.reduce((sum, item) => {
      const pid = Number(item.product_id || item.id);
      return sum + (priceMap.get(pid) ?? 0) * Number(item.quantity);
    }, 0);
    const suppliedMembershipBase = Number(membershipDiscountableSubtotal);
    const effectiveMembershipBase = Number.isFinite(suppliedMembershipBase) && suppliedMembershipBase >= 0
      ? suppliedMembershipBase
      : membershipBase;
    const membershipRate = effectiveMembershipBase > 0
      ? Math.max(0, Math.min(1, (goodsSubtotal - orderTotalNum) / effectiveMembershipBase))
      : 0;
    const eligibleCartItems = safeCartItems.filter(item => item.block_other_discounts !== true);
    const priceAfterMembership = (item: CartItem) => {
      const pid = Number(item.product_id || item.id);
      const lineTotal = (priceMap.get(pid) ?? 0) * Number(item.quantity);
      return item.block_other_discounts === true ? lineTotal : lineTotal * (1 - membershipRate);
    };

    if (voucher.apply_scope === 'all') {
      eligibleTotal = safeCartItems.length > 0
        ? eligibleCartItems.reduce((sum, item) => sum + priceAfterMembership(item), 0)
        : orderTotalNum;
    }
    else if (voucher.apply_scope === 'product') {
      const allowedIds = voucher.product_vouchers.map(pv => pv.product_id);
      const eligibleItems = eligibleCartItems.filter((item: CartItem) => {
        const pid = Number(item.product_id || item.id);
        return allowedIds.includes(pid);
      });
      eligibleTotal = eligibleItems.reduce((sum: number, item: CartItem) => sum + priceAfterMembership(item), 0);
    }
    else if (voucher.apply_scope === 'category') {
      const allowedIds = voucher.voucher_categories.map(vc => vc.category_id);
      const eligibleItems = eligibleCartItems.filter((item: CartItem) => {
        const pid = Number(item.product_id || item.id);
        const catId = categoryMap.get(pid);
        return catId !== undefined && allowedIds.includes(catId);
      });
      eligibleTotal = eligibleItems.reduce((sum: number, item: CartItem) => sum + priceAfterMembership(item), 0);
    }

    if (eligibleTotal === 0) {
      res.status(400).json({ success: false, message: "This voucher is not applicable to any products in your cart!" });
      return;
    }

    // Điều kiện "đơn tối thiểu" tính trên TIỀN HÀNG gốc (trước membership/voucher),
    // không phải orderTotal (đã trừ giảm giá hạng) → tránh báo "chưa đạt" oan khi
    // tiền hàng đã đủ nhưng bị giảm giá kéo xuống dưới ngưỡng.
    // goodsSubtotal được dựng từ giá bán hiện tại trong DB.
    if (goodsSubtotal < Number(voucher.min_order_value)) {
      // message cố định + min_order_value riêng để frontend dịch được (số tiền là động)
      res.status(400).json({
        success: false,
        message: "Minimum order value not met",
        min_order_value: Number(voucher.min_order_value)
      });
      return;
    }

    eligibleTotal = toVnd(eligibleTotal);
    let discountAmount = toVnd((eligibleTotal * Number(voucher.discount_percent || 0)) / 100);

    if (voucher.max_discount_amount !== null && voucher.max_discount_amount !== undefined) {
      discountAmount = Math.min(discountAmount, toVnd(voucher.max_discount_amount));
    }
    discountAmount = Math.min(discountAmount, eligibleTotal);

    res.json({
      success: true,
      message: "Voucher applied successfully!",
      data: {
        ...voucher,
        discount_amount: discountAmount,
        final_total: Math.max(0, toVnd(orderTotal) - discountAmount),
        applied_to_total: eligibleTotal
      }
    });
  } catch (error) {
    console.error("Voucher application error:", error);
    res.status(500).json({ success: false, message: "Server error applying voucher" });
  }
};

export const getActiveVouchers = async (req: Request, res: Response): Promise<void> => {
  try {
    const { category_id, product_id } = req.query;
    const now = new Date();

    const vouchers = await prisma.voucher.findMany({
        where: {
            status: true,
            // start_date / end_date có thể để trống độc lập (chỉ ngày bắt đầu hoặc chỉ ngày kết thúc),
            // khớp với điều kiện kiểm tra trong applyVoucherCustomer.
            AND: [
                { OR: [{ start_date: null }, { start_date: { lte: now } }] },
                { OR: [{ end_date: null }, { end_date: { gte: now } }] },
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
        if (!category_id && !product_id) return true;
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
  } catch (error: unknown) {
    console.error("Voucher API Error:", getErrorMessage(error));
    res.status(500).json({ success: false, error: getErrorMessage(error) });
  }
};
