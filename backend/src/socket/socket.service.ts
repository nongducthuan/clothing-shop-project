import { Injectable } from '@nestjs/common';
import { Server as SocketIOServer } from 'socket.io';
import { Server as HttpServer } from 'http';
import jwt from 'jsonwebtoken';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SocketService {
  private io: SocketIOServer | null = null;

  constructor(private readonly prisma: PrismaService) {}

  init(server: HttpServer, allowedOrigins: string[]) {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: allowedOrigins,
        methods: ['GET', 'POST'],
        credentials: true,
      },
    });

    this.io.use((socket, next) => {
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

    this.io.on('connection', (socket) => {
      if (process.env.NODE_ENV !== 'production') {
        console.log('🔗 [Socket.io] A client connected:', socket.id);
      }

      socket.on('join_admin_room', () => {
        if (socket.data.user?.role === 'admin') {
          socket.join('admin_room');
        }
      });

      socket.on('join_user_room', () => {
        const userId = socket.data.user?.id;
        if (socket.data.user?.role !== 'admin' && typeof userId === 'number') {
          socket.join(`user_${userId}`);
        }
      });

      socket.on('disconnect', () => {
        if (process.env.NODE_ENV !== 'production') {
          console.log('🔴 [Socket.io] A client disconnected:', socket.id);
        }
      });
    });

    return this.io;
  }

  getIO(): SocketIOServer {
    if (!this.io) {
      throw new Error('Socket.io has not been initialized!');
    }
    return this.io;
  }

  async sendNotification(
    userId: number | null,
    title: string,
    message: string,
    titleEn: string,
    messageEn: string,
    socketEvent: string,
    eventData: Record<string, unknown> = {},
  ) {
    try {
      const notif = await this.prisma.notification.create({
        data: { user_id: userId, title, message, title_en: titleEn, message_en: messageEn },
      });

      const io = this.getIO();
      if (userId) {
        io.to(`user_${userId}`).emit(socketEvent, { ...eventData, notification: notif });
      } else {
        io.to('admin_room').emit(socketEvent, { ...eventData, notification: notif });
      }
    } catch (error) {
      console.error('[sendNotification] Error:', error);
    }
  }
}
