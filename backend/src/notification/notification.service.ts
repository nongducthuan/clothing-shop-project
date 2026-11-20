import {
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtPayload } from '../common/interfaces/jwt-payload.interface';

@Injectable()
export class NotificationService {
  constructor(private readonly prisma: PrismaService) {}

  async getNotifications(user: JwtPayload) {
    try {
      const filter = user.role === 'admin' ? { user_id: null } : { user_id: user.id };
      const notifications = await this.prisma.notification.findMany({
        where: filter,
        orderBy: { created_at: 'desc' },
        take: 20,
      });
      return { success: true, data: notifications };
    } catch (error) {
      console.error('Error fetching notifications:', error);
      throw new InternalServerErrorException({ success: false, message: 'Server error' });
    }
  }

  async markAsRead(id: number, user: JwtPayload) {
    try {
      const notification = await this.prisma.notification.findUnique({ where: { id } });
      if (!notification) {
        throw new NotFoundException({ success: false, message: 'Notification not found' });
      }

      if (user.role !== 'admin' && notification.user_id !== user.id) {
        throw new ForbiddenException({ success: false, message: 'Forbidden' });
      }

      await this.prisma.notification.update({
        where: { id },
        data: { is_read: true },
      });
      return { success: true };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException) throw error;
      console.error('Error marking notification as read:', error);
      throw new InternalServerErrorException({ success: false, message: 'Server error' });
    }
  }

  async markAllAsRead(user: JwtPayload) {
    try {
      const filter = user.role === 'admin' ? { user_id: null } : { user_id: user.id };
      await this.prisma.notification.updateMany({
        where: { ...filter, is_read: false },
        data: { is_read: true },
      });
      return { success: true };
    } catch (error) {
      console.error('Error marking all as read:', error);
      throw new InternalServerErrorException({ success: false, message: 'Server error' });
    }
  }
}
