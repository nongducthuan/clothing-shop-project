import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import type { JwtPayload } from '../interfaces/jwt-payload.interface';

type AuthenticatedRequest = { user?: JwtPayload };

@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    if (request.user?.role !== 'admin') throw new ForbiddenException('Admin only');
    return true;
  }
}
