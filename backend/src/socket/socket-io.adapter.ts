import { IoAdapter } from '@nestjs/platform-socket.io';
import { ServerOptions } from 'socket.io';
import { INestApplicationContext } from '@nestjs/common';

export class SocketIoAdapter extends IoAdapter {
  constructor(
    private readonly app: INestApplicationContext,
    private readonly allowedOrigins: string[],
  ) {
    super(app);
  }

  createIOServer(port: number, options?: ServerOptions) {
    const server = super.createIOServer(port, {
      ...options,
      cors: {
        origin: this.allowedOrigins,
        methods: ['GET', 'POST'],
        credentials: true,
      },
    });
    return server;
  }
}
