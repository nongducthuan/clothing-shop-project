import { Request, Response } from 'express';
import prisma from '../../../prisma/client';

export const getCategories = async (req: Request, res: Response): Promise<void> => {
  try {
    const categories = await prisma.category.findMany({
      where: { is_active: true },
      orderBy: { id: 'asc' },
    });
    res.status(200).json({ data: categories });
  } catch (err) {
    console.error("getCategories error:", err);
    res.status(500).json({ message: "Error fetching categories" });
  }
};

export const getRecommendCategories = async (req: Request, res: Response): Promise<void> => {
  try {
    const gender = req.query.gender as string;
    if (!gender) {
      res.status(400).json({ message: "Missing gender" });
      return;
    }

    // Convert gender string to enum
    const validGender = gender as 'male' | 'female' | 'unisex';

    // Categories that are NOT of the specified gender, AND their names do not match any category that IS of the specified gender.
    // e.g. Recommend categories that only exist for men to women.
    const categoriesOfTarget = await prisma.category.findMany({
      where: { gender: validGender, is_active: true },
      select: { name: true }
    });
    const targetNames = categoriesOfTarget.map(c => c.name);

    const recommendCategories = await prisma.category.findMany({
      where: {
        gender: { not: validGender },
        name: { notIn: targetNames },
        is_active: true
      },
      select: { name: true },
      distinct: ['name'],
      orderBy: { name: 'asc' }
    });

    res.json({ data: recommendCategories });
  } catch (err) {
    console.error("getRecommendCategories error:", err);
    res.status(500).json({ message: "Error fetching recommended categories" });
  }
};

export const getCategoriesWithPreview = async (req: Request, res: Response): Promise<void> => {
  try {
    const categories = await prisma.category.findMany({
      where: {
        is_active: true,
        products: {
          some: { is_active: true } // At least one active product exists
        }
      },
      orderBy: { id: 'asc' },
      include: {
        products: {
          take: 1,
          orderBy: { id: 'asc' },
          include: {
            colors: {
              where: {
                image_url: { not: '' }
              },
              take: 1
            }
          }
        }
      }
    });

    const rows = categories.map(c => {
      let preview_image = null;

      if (c.image_url) {
        preview_image = c.image_url;
      } else if (c.products.length > 0) {
        const product = c.products[0];
        if (product.colors.length > 0 && product.colors[0].image_url) {
          preview_image = product.colors[0].image_url;
        } else if (product.image_url) {
          preview_image = product.image_url;
        }
      }

      return {
        id: c.id,
        name: c.name,
        description: c.description,
        gender: c.gender,
        image_url: c.image_url,
        preview_image: preview_image
      };
    });

    res.status(200).json({ data: rows });
  } catch (err) {
    console.error("getCategoriesWithPreview error:", err);
    res.status(500).json({ message: "Error fetching categories with preview" });
  }
};
