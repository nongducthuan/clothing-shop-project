import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import jwt from 'jsonwebtoken';
import { JwtPayload } from '../interfaces/jwt-payload.interface';

type AuthenticatedRequest = {
  headers: { authorization?: string | string[] };
  user?: JwtPayload;
};

@Injectable()
export class JwtAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const authHeader = request.headers.authorization;
    const token = typeof authHeader === 'string' ? authHeader.split(' ')[1] : undefined;
    if (!token || token === 'null') throw new UnauthorizedException('No token provided');

    const secret = process.env.JWT_SECRET;
    if (!secret) throw new UnauthorizedException('Authentication is not configured');
    try {
      request.user = jwt.verify(token, secret) as JwtPayload;
      return true;
    } catch {
      throw new UnauthorizedException('Invalid token');
    }
  }
}
