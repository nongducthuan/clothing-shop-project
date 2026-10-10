import { Server as SocketIOServer } from 'socket.io';
import { Server as HttpServer } from 'http';
import type { PrismaClient } from '../generated/prisma/client';
import jwt from 'jsonwebtoken';

let io: SocketIOServer | null = null;

export const initSocket = (server: HttpServer) => {
  io = new SocketIOServer(server, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:5173',
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  io.use((socket, next) => {
    const token: unknown = socket.handshake.auth?.token;
    const secret = process.env.JWT_SECRET;
    if (typeof token !== 'string' || !secret) {
      next(new Error('Authentication required'));
      return;
    }
    try {
      const decoded = jwt.verify(token, secret);
      if (typeof decoded !== 'object' || decoded === null || typeof decoded.id !== 'number') {
        next(new Error('Invalid authentication token'));
        return;
      }
      socket.data.user = decoded;
      next();
    } catch {
      next(new Error('Invalid authentication token'));
    }
  });

  io.on('connection', (socket) => {
    if (process.env.NODE_ENV !== 'production') console.log('🔗 [Socket.io] A client connected:', socket.id);

    socket.on('join_admin_room', () => {
      if (socket.data.user?.role === 'admin') {
        socket.join('admin_room');
        if (process.env.NODE_ENV !== 'production') console.log(`[Socket.io] Socket ${socket.id} joined admin_room`);
      }
    });

    socket.on('join_user_room', () => {
      const userId = socket.data.user?.id;
      if (socket.data.user?.role !== 'admin' && typeof userId === 'number') {
        socket.join(`user_${userId}`);
        if (process.env.NODE_ENV !== 'production') console.log(`[Socket.io] Socket ${socket.id} joined user_${userId}`);
      }
    });

    socket.on('disconnect', () => {
      if (process.env.NODE_ENV !== 'production') console.log('🔴 [Socket.io] A client disconnected:', socket.id);
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error('Socket.io has not been initialized!');
  }
  return io;
};

/**
 * Lưu thông báo vào DB rồi emit realtime qua Socket.io.
 *
 * @param prismaClient  - instance prisma của caller (tránh circular import)
 * @param userId        - null = gửi cho admin_room, có id = gửi cho user_{id}
 * @param title         - tiêu đề thông báo
 * @param message       - nội dung thông báo
 * @param socketEvent   - tên event socket sẽ emit
 * @param eventData     - dữ liệu kèm theo event (ngoài notification)
 */
export const sendNotification = async (
  prismaClient: PrismaClient,
  userId: number | null,
  title: string,
  message: string,
  titleEn: string,
  messageEn: string,
  socketEvent: string,
  eventData: Record<string, unknown> = {}
) => {
  try {
    const notif = await prismaClient.notification.create({
      data: { user_id: userId, title, message, title_en: titleEn, message_en: messageEn },
    });

    const ioInstance = getIO();
    if (userId) {
      ioInstance.to(`user_${userId}`).emit(socketEvent, { ...eventData, notification: notif });
    } else {
      ioInstance.to('admin_room').emit(socketEvent, { ...eventData, notification: notif });
    }
  } catch (error) {
    console.error('[sendNotification] Error:', error);
  }
};
