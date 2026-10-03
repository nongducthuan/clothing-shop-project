import { Request, Response } from 'express';
import prisma from '../../../prisma/client';

export const applyVoucherCustomer = async (req: Request, res: Response): Promise<void> => {
  try {
    const { code, orderTotal, subtotal, cartItems } = req.body;
    
    const voucher = await prisma.voucher.findUnique({
        where: { code },
        include: {
            product_vouchers: true,
            voucher_categories: true
        }
    });

    if (!voucher || !voucher.status) { // Fix 10: Boolean check
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
    
    // Fix 9: Re-fetch prices from DB thay vì tin giá từ client
    // cartItems có thể không được gửi lên (VD: scope='all' chỉ cần orderTotal) → mặc định []
    const safeCartItems: any[] = Array.isArray(cartItems) ? cartItems : [];
    const productIds = safeCartItems.map((item: any) => Number(item.product_id || item.id)).filter(Boolean);
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
        const applicableSales = sales.filter((s: any) => 
            s.apply_scope === 'all' || 
            s.product_sales.some((ps: any) => ps.product_id === p.id) ||
            s.sale_categories.some((sc: any) => sc.category_id === p.category_id)
        ).sort((a: any, b: any) => Number(b.discount_percent) - Number(a.discount_percent));

        const discount = applicableSales.length > 0 ? Number(applicableSales[0].discount_percent) : 0;
        const finalPrice = Number(p.price) * (1 - discount / 100);
        priceMap.set(p.id, finalPrice);
    }

    let eligibleTotal = 0;
    
    // Apply same membership proportion logic as checkout
    const goodsSubtotal = Number(subtotal || orderTotal || 0);
    const orderTotalNum = Number(orderTotal || 0);
    const membershipRate = goodsSubtotal > 0 ? (goodsSubtotal - orderTotalNum) / goodsSubtotal : 0;
    const priceAfterMembership = (gross: number) => gross * (1 - membershipRate);
    
    if (voucher.apply_scope === 'all') {
      eligibleTotal = orderTotalNum;
    } 
    else if (voucher.apply_scope === 'product') {
      const allowedIds = voucher.product_vouchers.map(pv => pv.product_id);
      const eligibleItems = safeCartItems.filter((item: any) => {
        const pid = Number(item.product_id || item.id);
        return allowedIds.includes(pid);
      });
      eligibleTotal = eligibleItems.reduce((sum: number, item: any) => {
        const pid = Number(item.product_id || item.id);
        const lineTotal = (priceMap.get(pid) ?? 0) * Number(item.quantity);
        return sum + priceAfterMembership(lineTotal);
      }, 0);
    } 
    else if (voucher.apply_scope === 'category') {
      const allowedIds = voucher.voucher_categories.map(vc => vc.category_id);
      const eligibleItems = safeCartItems.filter((item: any) => {
        const pid = Number(item.product_id || item.id);
        const catId = categoryMap.get(pid);
        return catId !== undefined && allowedIds.includes(catId);
      });
      eligibleTotal = eligibleItems.reduce((sum: number, item: any) => {
        const pid = Number(item.product_id || item.id);
        const lineTotal = (priceMap.get(pid) ?? 0) * Number(item.quantity);
        return sum + priceAfterMembership(lineTotal);
      }, 0);
    }
    
    if (eligibleTotal === 0) {
      res.status(400).json({ success: false, message: "This voucher is not applicable to any products in your cart!" });
      return;
    }
    
    // Điều kiện "đơn tối thiểu" tính trên TIỀN HÀNG gốc (trước membership/voucher),
    // không phải orderTotal (đã trừ giảm giá hạng) → tránh báo "chưa đạt" oan khi
    // tiền hàng đã đủ nhưng bị giảm giá kéo xuống dưới ngưỡng.
    // goodsSubtotal đã được khai báo ở trên (= Number(subtotal || orderTotal || 0))
    if (goodsSubtotal < Number(voucher.min_order_value)) {
      // message cố định + min_order_value riêng để frontend dịch được (số tiền là động)
      res.status(400).json({
        success: false,
        message: "Minimum order value not met",
        min_order_value: Number(voucher.min_order_value)
      });
      return;
    }
    
    let discountAmount = (eligibleTotal * Number(voucher.discount_percent || 0)) / 100;
    
    if (voucher.max_discount_amount && discountAmount > Number(voucher.max_discount_amount)) {
      discountAmount = Number(voucher.max_discount_amount);
    }
    
    res.json({
      success: true,
      message: "Voucher applied successfully!",
      data: {
        ...voucher,
        discount_amount: discountAmount,
        final_total: Number(orderTotal) - discountAmount,
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

    const vouchers = await prisma.voucher.findMany({
        where: {
            status: true, // Fix 10: Boolean
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
  } catch (error: any) {
    console.error("Voucher API Error:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};
