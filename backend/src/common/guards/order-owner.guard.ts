import { CanActivate, ExecutionContext, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import type { JwtPayload } from '../interfaces/jwt-payload.interface';

type OrderRequest = {
  params?: { id?: string };
  user?: JwtPayload;
  guestOrderEmail?: string;
};

/**
 * Cheap ownership check for `/orders/:id/...` routes, meant to run BEFORE interceptors
 * that do expensive or side-effecting work (e.g. persisting uploaded images), so strangers
 * cannot make the server write files. The services still enforce the full business rules.
 * Must be placed after OptionalJwtAuthGuard and GuestOrderAccessGuard.
 */
@Injectable()
export class OrderOwnerGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<OrderRequest>();
    const orderId = Number(request.params?.id);
    if (!Number.isSafeInteger(orderId) || orderId <= 0) throw new NotFoundException({ message: 'Order not found' });

    const user = request.user;
    const guestEmail = request.guestOrderEmail;
    if (!user && !guestEmail) throw new ForbiddenException({ message: 'Forbidden: Sign in or verify the order by OTP first.' });
    if (user?.role === 'admin') return true;

    const order = await this.prisma.order.findUnique({ where: { id: orderId }, select: { user_id: true, email: true } });
    if (!order) throw new NotFoundException({ message: 'Order not found' });

    const ownsByAccount = order.user_id !== null && user?.id === order.user_id;
    const ownsAsGuest = order.user_id === null && !!guestEmail && order.email.toLowerCase() === guestEmail;
    // A signed-in user may also act on a guest order placed with their own account email.
    const ownsByEmail = order.user_id === null && !!user?.email && order.email.toLowerCase() === user.email.toLowerCase();
    if (!ownsByAccount && !ownsAsGuest && !ownsByEmail) {
      throw new ForbiddenException({ message: 'Forbidden: You do not have permission for this order.' });
    }
    return true;
  }
}
