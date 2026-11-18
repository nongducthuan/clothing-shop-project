import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';
import jwt from 'jsonwebtoken';
import { JwtPayload } from '../interfaces/jwt-payload.interface';

@Injectable()
export class OptionalJwtAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const authHeader = request.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token || token === 'null') {
      return true;
    }

    const SECRET = process.env.JWT_SECRET as string;
    try {
      const decoded = jwt.verify(token, SECRET) as JwtPayload;
      request.user = decoded;
    } catch {
      // Invalid token treated as unauthenticated
    }
    return true;
  }
}
