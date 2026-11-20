import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import jwt from 'jsonwebtoken';
import { JwtPayload } from '../interfaces/jwt-payload.interface';

type AuthenticatedRequest = {
  headers: { authorization?: string | string[] };
  user?: JwtPayload;
};

@Injectable()
export class OptionalJwtAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const authHeader = request.headers.authorization;
    const token = typeof authHeader === 'string' ? authHeader.split(' ')[1] : undefined;
    if (!token || token === 'null') return true;

    const secret = process.env.JWT_SECRET;
    if (!secret) return true;
    try {
      request.user = jwt.verify(token, secret) as JwtPayload;
    } catch {
      // Invalid token is treated as unauthenticated for optional-auth routes.
    }
    return true;
  }
}
