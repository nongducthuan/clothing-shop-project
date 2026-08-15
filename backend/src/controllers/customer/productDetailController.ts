import { Request, Response } from 'express';
import prisma from '../../../prisma/client';

export const getProductDetail = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const productId = Number(id);

    if (isNaN(productId)) {
      res.status(400).json({ message: 'Invalid product ID' });
      return;
    }

    // 1️⃣ Lấy thông tin sản phẩm
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        category: true,
        colors: {
          include: {
            sizes: true,
          }
        }
      }
    });

    if (!product) {
      res.status(404).json({ message: 'Product not found' });
      return;
    }

    // Lấy thông tin Sale (khuyến mãi) của sản phẩm
    const sales = await prisma.sale.findMany({
      where: {
        status: true, // Fix 10: Boolean
        start_date: { lte: new Date() },
        end_date: { gte: new Date() },
        OR: [
          { apply_scope: 'all' },
          { product_sales: { some: { product_id: productId } } },
          { sale_categories: { some: { category_id: product.category_id } } }
        ]
      },
      select: {
        discount_percent: true
      },
      orderBy: {
        discount_percent: 'desc'
      },
      take: 1
    });

    const sale_percent = sales.length > 0 ? Number(sales[0].discount_percent) : 0;

    // Tính tổng tồn kho
    let totalStock = 0;
    product.colors.forEach(color => {
      color.sizes.forEach(size => {
        totalStock += size.stock;
      });
    });

    // Định dạng response
    const formattedProduct = {
      id: product.id,
      name: product.name,
      description: product.description,
      price: product.price,
      image_url: product.image_url,
      gender: product.gender,
      category_name: product.category?.name,
      sale_percent,
      total_stock: totalStock,
      colors: product.colors.map(c => ({
        color_id: c.id,
        color_name: c.color_name,
        color_code: c.color_code,
        image_url: c.image_url,
        sizes: c.sizes.map(s => ({
          size_id: s.id,
          size: s.size,
          stock: s.stock
        }))
      }))
    };

    res.json(formattedProduct);
  } catch (err) {
    console.error('Error in getProductDetail:', err);
    res.status(500).json({ message: 'Server error' });
  }
};
