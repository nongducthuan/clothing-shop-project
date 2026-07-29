import { Request } from 'express';

// Mở rộng Express Request để thêm `user` từ JWT middleware
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        name: string;
        email: string;
        role: string;
        tier?: string;
        discount?: number;
      };
    }
  }
}
