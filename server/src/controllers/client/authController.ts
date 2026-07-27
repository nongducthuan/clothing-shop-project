import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import prisma from '../../../prisma/client';

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, phone, password } = req.body;

    if (!name || !email || !phone || !password) {
      res.status(400).json({ message: 'Please enter all required information' });
      return;
    }

    const existingEmail = await prisma.user.findUnique({ where: { email } });
    if (existingEmail) {
      res.status(400).json({ message: 'Email is already registered' });
      return;
    }

    const existingPhone = await prisma.user.findUnique({ where: { phone } });
    if (existingPhone) {
      res.status(400).json({ message: 'Phone number is already in use' });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        phone,
        password: hashedPassword,
        role: 'customer',
        membership_id: 1, // Default Bronze
      },
    });

    res.status(201).json({
      message: 'Registration successful',
      id: user.id,
      email: user.email,
    });
  } catch (err) {
    console.error('❌ Error during registration:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { identifier, password } = req.body;

    if (!identifier || !password) {
      res.status(400).json({ message: 'Please enter email/phone and password' });
      return;
    }

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: identifier },
          { phone: identifier },
        ],
      },
      include: {
        membership: true,
      },
    });

    if (!user) {
      res.status(401).json({ message: 'Incorrect account or password' });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      res.status(401).json({ message: 'Incorrect account or password' });
      return;
    }

    const token = jwt.sign(
      {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        tier: user.membership?.name,
        discount: user.membership?.discount_percent,
      },
      process.env.JWT_SECRET as string,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        total_spent: user.total_spent,
        tier_name: user.membership?.name || 'Bronze',
        discount_percent: user.membership?.discount_percent || 0,
      },
      token,
    });
  } catch (err) {
    console.error('❌ Error during login:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const { phone } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    if (!phone) {
      res.status(400).json({ message: 'Please enter phone number' });
      return;
    }

    await prisma.user.update({
      where: { id: userId },
      data: { phone },
    });

    res.status(200).json({
      message: 'Profile updated successfully!',
      user: {
        ...req.user,
        phone,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error when updating profile' });
  }
};

export const getMe = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        total_spent: true,
        membership_id: true,
        membership: {
          select: {
            name: true,
            discount_percent: true,
          }
        }
      },
    });

    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    const response = {
      ...user,
      tier_name: user.membership?.name,
      discount_percent: user.membership?.discount_percent,
      membership: undefined, // remove nested object to match old API
    };

    res.json(response);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};
