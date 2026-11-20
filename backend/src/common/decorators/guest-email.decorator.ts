import { createParamDecorator, ExecutionContext } from '@nestjs/common';

type GuestRequest = { guestOrderEmail?: string };

export const GuestEmail = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string | undefined => {
    const request = ctx.switchToHttp().getRequest<GuestRequest>();
    return request.guestOrderEmail;
  },
);
