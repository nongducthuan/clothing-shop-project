import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import jwt from 'jsonwebtoken';

type GuestRequest = {
  headers: { 'x-guest-order-access'?: string | string[]; authorization?: string | string[] };
  params?: Record<string, string | undefined>;
  body?: { order_id?: unknown } | null;
  guestOrderEmail?: string;
};

/**
 * Resolves the guest's proof of ownership from `X-Guest-Order-Access`.
 *
 * Two kinds of token share the purpose `guest-order-access`:
 *  - OTP-verified (email only): the mailbox owner proved control of the email, so
 *    every guest order of that email is accessible.
 *  - Order-bound (`order_id` claim, issued right after checkout): the email was only
 *    typed in by the buyer and is NOT verified, so the token must only open that
 *    one order — otherwise anyone could place an order with a victim's email and
 *    then act on the victim's other guest orders.
 */
@Injectable()
export class GuestOrderAccessGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<GuestRequest>();
    const headerToken = request.headers['x-guest-order-access'];
    const authHeader = typeof request.headers.authorization === 'string' ? request.headers.authorization : '';
    const bearerToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : undefined;
    const token = typeof headerToken === 'string' ? headerToken : bearerToken;
    const secret = process.env.JWT_SECRET;
    if (typeof token !== 'string' || !token || !secret) return true;

    try {
      const payload = jwt.verify(token, secret);
      if (typeof payload !== 'object' || payload === null ||
          payload.purpose !== 'guest-order-access' || typeof payload.email !== 'string') {
        return true;
      }
      if (payload.order_id !== undefined) {
        const requestedOrderId = request.params?.id ?? request.body?.order_id;
        if (requestedOrderId === undefined || String(requestedOrderId) !== String(payload.order_id)) return true;
      }
      request.guestOrderEmail = payload.email.toLowerCase();
    } catch {
      // Invalid token is treated as unauthenticated.
    }
    return true;
  }
}
