import { Server as SocketIOServer } from 'socket.io';
import { Server as HttpServer } from 'http';

let io: SocketIOServer | null = null;

export const initSocket = (server: HttpServer) => {
  io = new SocketIOServer(server, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:5173',
      methods: ['GET', 'POST'],
      credentials: true
    }
  });

  io.on('connection', (socket) => {
    console.log('🔗 [Socket.io] A client connected:', socket.id);

    // Clients can join specific rooms, e.g., 'admin'
    socket.on('join_admin_room', () => {
      socket.join('admin_room');
      console.log(`[Socket.io] Socket ${socket.id} joined admin_room`);
    });

    socket.on('disconnect', () => {
      console.log('🔴 [Socket.io] A client disconnected:', socket.id);
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
