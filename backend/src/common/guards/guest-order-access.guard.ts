import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import jwt from 'jsonwebtoken';

type GuestRequest = {
  headers: { 'x-guest-order-access'?: string | string[] };
  guestOrderEmail?: string;
};

@Injectable()
export class GuestOrderAccessGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<GuestRequest>();
    const token = request.headers['x-guest-order-access'];
    const secret = process.env.JWT_SECRET;
    if (typeof token !== 'string' || !secret) return true;

    try {
      const payload = jwt.verify(token, secret);
      if (typeof payload === 'object' && payload !== null &&
          payload.purpose === 'guest-order-access' && typeof payload.email === 'string') {
        request.guestOrderEmail = payload.email.toLowerCase();
      }
    } catch {
      // Invalid token is treated as unauthenticated.
    }
    return true;
  }
}
