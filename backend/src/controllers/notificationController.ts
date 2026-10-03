import { Request, Response } from 'express';
import prisma from '../../prisma/client';

export const getNotifications = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const role = req.user?.role; // 'admin' or 'customer'

    const filter = role === 'admin' ? { user_id: null } : { user_id: userId };

    const notifications = await prisma.notification.findMany({
      where: filter,
      orderBy: { created_at: 'desc' },
      take: 20,
    });

    res.json({ success: true, data: notifications });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const markAsRead = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const role = req.user?.role;

    const notif = await prisma.notification.findUnique({ where: { id: Number(id) } });
    if (!notif) {
      res.status(404).json({ success: false, message: 'Notification not found' });
      return;
    }

    if (role !== 'admin' && notif.user_id !== userId) {
      res.status(403).json({ success: false, message: 'Forbidden' });
      return;
    }

    await prisma.notification.update({
      where: { id: Number(id) },
      data: { is_read: true },
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const markAllAsRead = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const role = req.user?.role;

    const filter = role === 'admin' ? { user_id: null } : { user_id: userId };

    await prisma.notification.updateMany({
      where: { ...filter, is_read: false },
      data: { is_read: true },
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Error marking all as read:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
