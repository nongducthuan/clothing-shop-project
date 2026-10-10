import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

/** Reads the short-lived email claim issued only after a guest passes OTP verification. */
export function optionalGuestOrderAccess(req: Request, _res: Response, next: NextFunction): void {
  const token = req.headers['x-guest-order-access'];
  const secret = process.env.JWT_SECRET;
  if (typeof token !== 'string' || !secret) {
    next();
    return;
  }

  try {
    const payload = jwt.verify(token, secret);
    if (
      typeof payload === 'object' && payload !== null &&
      payload.purpose === 'guest-order-access' && typeof payload.email === 'string'
    ) {
      req.guestOrderEmail = payload.email.toLowerCase();
    }
  } catch {
    // Invalid or expired guest access is treated as unauthenticated; mutating
    // controllers reject it when guest ownership cannot be proven.
  }
  next();
}
