import { Request, Response } from 'express';
import prisma from '../../../prisma/client';
import { appCache } from '../../utils/cacheService';

export const getCategories = async (req: Request, res: Response): Promise<void> => {
  try {
    const categories = await prisma.category.findMany({
      where: { is_active: true },
      orderBy: { id: 'asc' },
    });

    // Fetch preview image for each category if image_url is missing
    const enhancedCategories = await Promise.all(categories.map(async (cat) => {
      let preview_image = null;
      if (!cat.image_url) {
        const productWithColor = await prisma.product.findFirst({
          where: { category_id: cat.id },
          include: {
            colors: {
              where: { image_url: { not: '' } },
              take: 1
            }
          }
        });
        if (productWithColor?.colors?.[0]?.image_url) {
          preview_image = productWithColor.colors[0].image_url;
        }
      }
      return {
        ...cat,
        preview_image,
      };
    }));

    res.status(200).json({ data: enhancedCategories });
  } catch (err) {
    console.error("getCategories error:", err);
    res.status(500).json({ message: "Error fetching categories" });
  }
};

export const getCategoryRecommendations = async (req: Request, res: Response): Promise<void> => {
  const { gender } = req.query;
  let recommendations: { name: string; name_vi: string }[] = [];

  if (gender === 'male') {
    recommendations = [
      { name: 'T-Shirts', name_vi: 'Áo Phông' },
      { name: 'Shirts', name_vi: 'Áo Sơ Mi' },
      { name: 'Polo Shirts', name_vi: 'Áo Polo' },
      { name: 'Jeans', name_vi: 'Quần Jeans' },
      { name: 'Trousers/Pants', name_vi: 'Quần Dài' },
      { name: 'Shorts', name_vi: 'Quần Short' },
      { name: 'Hoodies', name_vi: 'Áo Hoodie' },
      { name: 'Jackets', name_vi: 'Áo Khoác' },
      { name: 'Shoes', name_vi: 'Giày Dép' },
    ];
  } else if (gender === 'female') {
    recommendations = [
      { name: 'Dresses', name_vi: 'Đầm / Váy' },
      { name: 'Tops', name_vi: 'Áo Kiểu' },
      { name: 'T-Shirts', name_vi: 'Áo Phông' },
      { name: 'Skirts', name_vi: 'Chân Váy' },
      { name: 'Jeans', name_vi: 'Quần Jeans' },
      { name: 'Trousers/Pants', name_vi: 'Quần Dài' },
      { name: 'Leggings', name_vi: 'Quần Leggings' },
      { name: 'Hoodies', name_vi: 'Áo Hoodie' },
      { name: 'Jackets', name_vi: 'Áo Khoác' },
      { name: 'Shoes', name_vi: 'Giày Dép' },
    ];
  } else {
    recommendations = [
      { name: 'T-Shirts', name_vi: 'Áo Phông' },
      { name: 'Hoodies', name_vi: 'Áo Hoodie' },
      { name: 'Sweaters', name_vi: 'Áo Len' },
      { name: 'Jeans', name_vi: 'Quần Jeans' },
      { name: 'Trousers/Pants', name_vi: 'Quần Dài' },
      { name: 'Jackets', name_vi: 'Áo Khoác' },
      { name: 'Accessories', name_vi: 'Phụ Kiện' },
      { name: 'Shoes', name_vi: 'Giày Dép' },
    ];
  }

  res.json({ data: recommendations });
};

export const createCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, name_vi, name_en, gender, image_url } = req.body;

    const baseName = name || name_vi || name_en;

    const category = await prisma.category.create({
      data: {
        name: baseName,
        name_vi: name_vi || baseName || null,
        name_en: name_en || baseName || null,
        gender: gender || 'unisex',
        image_url: image_url || null,
      },
    });
    
    appCache.del('categories-preview');
    res.status(201).json({ message: "Successfully created", id: category.id });
  } catch (err) {
    console.error("createCategory error:", err);
    res.status(500).json({ message: "Error adding category" });
  }
};

export const updateCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, name_vi, name_en, gender, image_url } = req.body;

    const baseName = name || name_vi || name_en;

    const category = await prisma.category.update({
      where: { id: Number(id) },
      data: {
        name: baseName || undefined,
        name_vi: name_vi !== undefined ? (name_vi || baseName || null) : undefined,
        name_en: name_en !== undefined ? (name_en || baseName || null) : undefined,
        gender,
        image_url,
      },
    });

    appCache.del('categories-preview');
    res.json({ message: "Successfully updated" });
  } catch (err) {
    console.error("updateCategory error:", err);
    res.status(500).json({ message: "Error updating category" });
  }
};

export const deleteCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    await prisma.category.update({
      where: { id: Number(id) },
      data: { is_active: false }
    });

    appCache.del('categories-preview');
    res.json({ message: "Successfully deleted" });
  } catch (err) {
    console.error("deleteCategory error:", err);
    res.status(500).json({ message: "Error deleting category" });
  }
};

export const getCategoryImages = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Find distinct images from product_colors belonging to this category
    const colors = await prisma.productColor.findMany({
      where: {
        product: {
          category_id: Number(id)
        },
        image_url: {
          not: ''
        }
      },
      select: {
        image_url: true,
      },
      distinct: ['image_url']
    });

    res.json({ data: colors });
  } catch (err) {
    console.error("getCategoryImages error:", err);
    res.status(500).json({ message: "Error fetching category images" });
  }
};
