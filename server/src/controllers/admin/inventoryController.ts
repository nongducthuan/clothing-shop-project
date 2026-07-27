import { Request, Response } from 'express';
import prisma from '../../../prisma/client';

export const getInventory = async (req: Request, res: Response): Promise<void> => {
  try {
    const inventory = await prisma.product.findMany({
      select: {
        id: true,
        name: true,
        colors: {
          select: {
            color_name: true,
            sizes: {
              select: {
                size: true,
                stock: true,
              }
            }
          }
        }
      }
    });

    // Flattening the response to match the old raw SQL output structure
    const flattenedInventory: any[] = [];
    for (const product of inventory) {
      for (const color of product.colors) {
        for (const size of color.sizes) {
          flattenedInventory.push({
            product_id: product.id,
            product_name: product.name,
            color_name: color.color_name,
            size: size.size,
            stock: size.stock,
          });
        }
      }
    }

    res.json({ success: true, inventory: flattenedInventory });
  } catch (err) {
    console.error('Error fetching inventory:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch inventory' });
  }
};
