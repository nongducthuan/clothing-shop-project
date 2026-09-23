import { Request, Response, NextFunction } from 'express';
import prisma from '../../../prisma/client';
import { appCache } from '../../utils/cacheService';
import { catchAsync } from '../../utils/catchAsync';
import { AppError } from '../../utils/AppError';

export const getCategories = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const categories = await prisma.category.findMany({
    where: { is_active: true },
    orderBy: { id: 'asc' },
  });
  res.status(200).json({ data: categories });
});

export const getRecommendCategories = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const gender = req.query.gender as string;
  if (!gender) {
    return next(new AppError("Missing gender", 400));
  }

  const validGender = gender as 'male' | 'female' | 'unisex';

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
});

export const getCategoriesWithPreview = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const cacheKey = 'categories-preview';
  const cachedData = appCache.get(cacheKey);
  if (cachedData) {
    res.status(200).json({ data: cachedData });
    return;
  }

  const categories = await prisma.category.findMany({
    where: {
      is_active: true,
      products: {
        some: { is_active: true }
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
      name_vi: c.name_vi,
      name_en: c.name_en,
      gender: c.gender,
      image_url: c.image_url,
      preview_image: preview_image
    };
  });

  appCache.set(cacheKey, rows);
  res.status(200).json({ data: rows });
});
