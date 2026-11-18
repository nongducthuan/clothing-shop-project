import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';
import jwt from 'jsonwebtoken';

@Injectable()
export class GuestOrderAccessGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const token = request.headers['x-guest-order-access'];
    const secret = process.env.JWT_SECRET;

    if (typeof token !== 'string' || !secret) {
      return true;
    }

    try {
      const payload = jwt.verify(token, secret);
      if (
        typeof payload === 'object' &&
        payload !== null &&
        payload.purpose === 'guest-order-access' &&
        typeof payload.email === 'string'
      ) {
        request.guestOrderEmail = payload.email.toLowerCase();
      }
    } catch {
      // Invalid token treated as unauthenticated
    }
    return true;
  }
}
