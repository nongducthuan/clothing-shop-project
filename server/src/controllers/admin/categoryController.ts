import { Request, Response } from 'express';
import prisma from '../../../prisma/client';

export const getCategories = async (req: Request, res: Response): Promise<void> => {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { id: 'asc' },
    });
    res.status(200).json({ data: categories });
  } catch (err) {
    console.error("getCategories error:", err);
    res.status(500).json({ message: "Error fetching categories" });
  }
};

export const createCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, gender, image_url } = req.body;
    
    // Convert gender string to enum type manually if needed, assuming Prisma maps it correctly from request
    const category = await prisma.category.create({
      data: {
        name,
        gender: gender || 'unisex',
        image_url: image_url || null,
      },
    });
    res.status(201).json({ message: "Successfully created", id: category.id });
  } catch (err) {
    console.error("createCategory error:", err);
    res.status(500).json({ message: "Error adding category" });
  }
};

export const updateCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, gender, image_url } = req.body;

    const category = await prisma.category.update({
      where: { id: Number(id) },
      data: {
        name,
        gender,
        image_url,
      },
    });
    
    res.json({ message: "Successfully updated" });
  } catch (err) {
    console.error("updateCategory error:", err);
    res.status(500).json({ message: "Error updating category" });
  }
};

export const deleteCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    await prisma.category.delete({
      where: { id: Number(id) },
    });
    
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
