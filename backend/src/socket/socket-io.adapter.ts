import { IoAdapter } from '@nestjs/platform-socket.io';
import { ServerOptions } from 'socket.io';
import { INestApplicationContext } from '@nestjs/common';

export type CorsOriginMatcher = string[] | ((origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => void);

export class SocketIoAdapter extends IoAdapter {
  constructor(
    private readonly app: INestApplicationContext,
    private readonly allowedOrigins: CorsOriginMatcher,
  ) {
    super(app);
  }

  createIOServer(port: number, options?: any) {
    const serverOptions = {
      ...(options || {}),
      cors: {
        origin: this.allowedOrigins,
        methods: ['GET', 'POST'],
        credentials: true,
      },
    };
    return super.createIOServer(port, serverOptions);
  }
}
