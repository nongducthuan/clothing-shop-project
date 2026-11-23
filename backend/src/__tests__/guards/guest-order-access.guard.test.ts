import jwt from 'jsonwebtoken';
import type { ExecutionContext } from '@nestjs/common';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { GuestOrderAccessGuard } from '../../common/guards/guest-order-access.guard';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { OrderOwnerGuard } from '../../common/guards/order-owner.guard';
import type { PrismaService } from '../../prisma/prisma.service';

const SECRET = 'test_jwt_secret';
const ctx = (request: Record<string, unknown>) => ({ switchToHttp: () => ({ getRequest: () => request }) }) as unknown as ExecutionContext;
const sign = (payload: object) => jwt.sign(payload, SECRET, { expiresIn: '5m' });

beforeEach(() => { process.env.JWT_SECRET = SECRET; });

describe('GuestOrderAccessGuard', () => {
  const guard = new GuestOrderAccessGuard();

  it('lets an OTP-verified (email-only) token act on any order', () => {
    const request: Record<string, unknown> = { headers: { 'x-guest-order-access': sign({ purpose: 'guest-order-access', email: 'Victim@Test.com' }) }, params: { id: '7' } };
    guard.canActivate(ctx(request));
    expect(request.guestOrderEmail).toBe('victim@test.com');
  });

  it('only lets an order-bound token act on its own order (param id)', () => {
    const token = sign({ purpose: 'guest-order-access', email: 'victim@test.com', order_id: 5 });
    const own: Record<string, unknown> = { headers: { 'x-guest-order-access': token }, params: { id: '5' } };
    const other: Record<string, unknown> = { headers: { 'x-guest-order-access': token }, params: { id: '6' } };
    guard.canActivate(ctx(own));
    guard.canActivate(ctx(other));
    expect(own.guestOrderEmail).toBe('victim@test.com');
    expect(other.guestOrderEmail).toBeUndefined();
  });

  it('matches an order-bound token against body.order_id for PUT /orders/status', () => {
    const token = sign({ purpose: 'guest-order-access', email: 'a@test.com', order_id: 5 });
    const own: Record<string, unknown> = { headers: { 'x-guest-order-access': token }, body: { order_id: '5' } };
    const other: Record<string, unknown> = { headers: { 'x-guest-order-access': token }, body: { order_id: 9 } };
    const none: Record<string, unknown> = { headers: { 'x-guest-order-access': token } };
    [own, other, none].forEach((r) => guard.canActivate(ctx(r)));
    expect(own.guestOrderEmail).toBe('a@test.com');
    expect(other.guestOrderEmail).toBeUndefined();
    expect(none.guestOrderEmail).toBeUndefined();
  });

  it('ignores tokens with another purpose or a bad signature', () => {
    const a: Record<string, unknown> = { headers: { 'x-guest-order-access': sign({ email: 'a@test.com' }) } };
    const b: Record<string, unknown> = { headers: { 'x-guest-order-access': jwt.sign({ purpose: 'guest-order-access', email: 'a@test.com' }, 'other') } };
    guard.canActivate(ctx(a));
    guard.canActivate(ctx(b));
    expect(a.guestOrderEmail).toBeUndefined();
    expect(b.guestOrderEmail).toBeUndefined();
  });
});

describe('JwtAuthGuard', () => {
  it('does not accept a guest-order token as a login token', () => {
    const request = { headers: { authorization: `Bearer ${sign({ purpose: 'guest-order-access', email: 'a@test.com' })}` } };
    expect(() => new JwtAuthGuard().canActivate(ctx(request))).toThrow('Invalid token');
  });

  it('accepts a normal access token', () => {
    const request: Record<string, unknown> = { headers: { authorization: `Bearer ${sign({ id: 1, role: 'customer' })}` } };
    expect(new JwtAuthGuard().canActivate(ctx(request))).toBe(true);
    expect((request.user as { id: number }).id).toBe(1);
  });
});

describe('OrderOwnerGuard', () => {
  const findUnique = jest.fn();
  const guard = new OrderOwnerGuard({ order: { findUnique } } as unknown as PrismaService);
  beforeEach(() => findUnique.mockReset());

  it('rejects anonymous callers without touching the database', async () => {
    await expect(guard.canActivate(ctx({ params: { id: '1' } }))).rejects.toBeInstanceOf(ForbiddenException);
    expect(findUnique).not.toHaveBeenCalled();
  });

  it('rejects non-numeric ids', async () => {
    await expect(guard.canActivate(ctx({ params: { id: 'abc' }, user: { id: 1 } }))).rejects.toBeInstanceOf(NotFoundException);
  });

  it('allows the owner, an admin, and a verified guest; rejects others', async () => {
    findUnique.mockResolvedValue({ user_id: 3, email: 'o@test.com' });
    await expect(guard.canActivate(ctx({ params: { id: '1' }, user: { id: 3 } }))).resolves.toBe(true);
    await expect(guard.canActivate(ctx({ params: { id: '1' }, user: { id: 4, role: 'customer', email: 'x@test.com' } }))).rejects.toBeInstanceOf(ForbiddenException);
    await expect(guard.canActivate(ctx({ params: { id: '1' }, user: { id: 9, role: 'admin' } }))).resolves.toBe(true);

    findUnique.mockResolvedValue({ user_id: null, email: 'Guest@Test.com' });
    await expect(guard.canActivate(ctx({ params: { id: '2' }, guestOrderEmail: 'guest@test.com' }))).resolves.toBe(true);
    await expect(guard.canActivate(ctx({ params: { id: '2' }, guestOrderEmail: 'someone@test.com' }))).rejects.toBeInstanceOf(ForbiddenException);
  });
});
