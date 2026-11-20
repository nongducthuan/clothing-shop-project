import {
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationService } from '../../notification/notification.service';
import { JwtPayload } from '../../common/interfaces/jwt-payload.interface';

const prismaMock = {
  notification: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
  },
};
const service = new NotificationService(prismaMock as unknown as PrismaService);
const customer: JwtPayload = { id: 12, name: 'Customer', email: 'c@example.com', role: 'customer' };
const admin: JwtPayload = { id: 1, name: 'Admin', email: 'a@example.com', role: 'admin' };

beforeEach(() => jest.clearAllMocks());

describe('NotificationService', () => {
  it('lists only the signed-in customer notifications', async () => {
    prismaMock.notification.findMany.mockResolvedValue([]);
    await expect(service.getNotifications(customer)).resolves.toEqual({ success: true, data: [] });
    expect(prismaMock.notification.findMany).toHaveBeenCalledWith({
      where: { user_id: customer.id },
      orderBy: { created_at: 'desc' },
      take: 20,
    });
  });

  it('lists global notifications for admins', async () => {
    prismaMock.notification.findMany.mockResolvedValue([]);
    await service.getNotifications(admin);
    expect(prismaMock.notification.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { user_id: null },
    }));
  });

  it('marks an owned notification as read', async () => {
    prismaMock.notification.findUnique.mockResolvedValue({ id: 5, user_id: customer.id });
    prismaMock.notification.update.mockResolvedValue({ id: 5, is_read: true });
    await expect(service.markAsRead(5, customer)).resolves.toEqual({ success: true });
    expect(prismaMock.notification.update).toHaveBeenCalledWith({
      where: { id: 5 },
      data: { is_read: true },
    });
  });

  it('rejects a missing notification', async () => {
    prismaMock.notification.findUnique.mockResolvedValue(null);
    await expect(service.markAsRead(5, customer)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('rejects reading another customer notification', async () => {
    prismaMock.notification.findUnique.mockResolvedValue({ id: 5, user_id: 999 });
    await expect(service.markAsRead(5, customer)).rejects.toBeInstanceOf(ForbiddenException);
    expect(prismaMock.notification.update).not.toHaveBeenCalled();
  });

  it('marks all unread notifications in the current scope as read', async () => {
    prismaMock.notification.updateMany.mockResolvedValue({ count: 2 });
    await expect(service.markAllAsRead(customer)).resolves.toEqual({ success: true });
    expect(prismaMock.notification.updateMany).toHaveBeenCalledWith({
      where: { user_id: customer.id, is_read: false },
      data: { is_read: true },
    });
  });
});
