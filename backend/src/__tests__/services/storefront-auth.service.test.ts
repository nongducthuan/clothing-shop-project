import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import bcrypt from 'bcryptjs';
import { StorefrontAuthService } from '../../storefront/services/storefront-auth.service';
import { PrismaService } from '../../prisma/prisma.service';

jest.mock('bcryptjs', () => ({
  hash: jest.fn().mockResolvedValue('hashed_password_xyz'),
  compare: jest.fn(),
}));

const prismaMock = {
  user: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  membership: {
    findFirst: jest.fn(),
  },
};

const service = new StorefrontAuthService(prismaMock as unknown as PrismaService);

describe('StorefrontAuthService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.JWT_SECRET = 'test_jwt_secret';
    process.env.JWT_REFRESH_SECRET = 'test_jwt_refresh_secret';
  });

  describe('register', () => {
    it('should throw BadRequestException when required fields are missing', async () => {
      await expect(service.register({ name: 'Thuan', email: 'test@test.com' }))
        .rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when email is already registered', async () => {
      prismaMock.user.findFirst.mockResolvedValueOnce({ id: 99, email: 'taken@test.com' });

      await expect(service.register({
        name: 'Thuan',
        email: 'taken@test.com',
        phone: '0909090909',
        password: 'pass12345',
      })).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when phone is already in use', async () => {
      prismaMock.user.findFirst.mockResolvedValueOnce(null);
      prismaMock.user.findUnique.mockResolvedValueOnce({ id: 55 });

      await expect(service.register({
        name: 'Thuan',
        email: 'new@test.com',
        phone: '0909090909',
        password: 'pass12345',
      })).rejects.toThrow(BadRequestException);
    });

    it('should return user info on successful registration', async () => {
      prismaMock.user.findFirst.mockResolvedValueOnce(null);
      prismaMock.user.findUnique.mockResolvedValueOnce(null);

      prismaMock.membership.findFirst.mockResolvedValueOnce({ id: 1 });
      prismaMock.user.create.mockResolvedValueOnce({
        id: 10,
        email: 'newuser@test.com',
      });

      const result = await service.register({
        name: 'Nguyen Van A',
        email: 'newuser@test.com',
        phone: '0901234567',
        password: 'securepass',
      });

      expect(result).toMatchObject({
        message: 'Registration successful',
        id: 10,
        email: 'newuser@test.com',
      });
    });
  });

  describe('login', () => {
    it('should throw BadRequestException when identifier or password is missing', async () => {
      await expect(service.login({ identifier: 'test@test.com' }))
        .rejects.toThrow(BadRequestException);
    });

    it('should throw UnauthorizedException when user is not found', async () => {
      prismaMock.user.findFirst.mockResolvedValueOnce(null);

      await expect(service.login({ identifier: 'ghost@test.com', password: 'abc' }))
        .rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when password does not match', async () => {
      prismaMock.user.findFirst.mockResolvedValueOnce({
        id: 1,
        email: 'user@test.com',
        phone: '0901234567',
        password: 'hashed_stored_password',
        name: 'Test',
        role: 'customer',
        total_spent: 0,
        membership: { name: 'Normal', discount_percent: 0 },
      });

      (bcrypt.compare as jest.Mock).mockResolvedValueOnce(false);

      await expect(service.login({ identifier: 'user@test.com', password: 'wrongpass' }))
        .rejects.toThrow(UnauthorizedException);
    });

    it('should return token and user info on successful login', async () => {
      prismaMock.user.findFirst.mockResolvedValueOnce({
        id: 1,
        email: 'user@test.com',
        phone: '0901234567',
        password: 'hashed_password',
        name: 'Nguyen Van A',
        role: 'customer',
        total_spent: 500000,
        membership: { name: 'Silver', discount_percent: 5 },
      });

      (bcrypt.compare as jest.Mock).mockResolvedValueOnce(true);

      const result = await service.login({ identifier: 'user@test.com', password: 'correct_pass' });

      expect(result).toMatchObject({
        message: 'Login successful',
        token: expect.stringMatching(/.+/),
        user: expect.objectContaining({
          id: 1,
          email: 'user@test.com',
          role: 'customer',
        }),
      });
    });
  });

  describe('email handling', () => {
    it('stores new registrations with a lowercase, trimmed email', async () => {
      prismaMock.user.findFirst.mockResolvedValueOnce(null);
      prismaMock.user.findUnique.mockResolvedValueOnce(null);
      prismaMock.membership.findFirst.mockResolvedValueOnce({ id: 1 });
      prismaMock.user.create.mockResolvedValueOnce({ id: 11, email: 'mixed@test.com' });

      await service.register({ name: 'Mixed Case', email: '  Mixed@Test.com ', phone: '0901234567', password: 'securepass' });

      expect(prismaMock.user.findFirst).toHaveBeenCalledWith({ where: { email: { equals: 'mixed@test.com', mode: 'insensitive' } } });
      expect(prismaMock.user.create.mock.calls[0][0].data.email).toBe('mixed@test.com');
    });

    it('looks the login identifier up case-insensitively', async () => {
      prismaMock.user.findFirst.mockResolvedValueOnce(null);
      await expect(service.login({ identifier: ' User@Test.com ', password: 'x' })).rejects.toThrow(UnauthorizedException);
      expect(prismaMock.user.findFirst.mock.calls[0][0].where).toEqual({
        OR: [{ email: { equals: 'User@Test.com', mode: 'insensitive' } }, { phone: 'User@Test.com' }],
      });
    });
  });

  describe('updateProfile', () => {
    it.each(['abc', '12345', '0123456789012345678901', '+84901234567'])('rejects invalid phone %s', async (phone) => {
      await expect(service.updateProfile(1, { phone })).rejects.toThrow(BadRequestException);
      expect(prismaMock.user.update).not.toHaveBeenCalled();
    });

    it('accepts a valid phone', async () => {
      prismaMock.user.findUnique.mockResolvedValueOnce(null);
      prismaMock.user.update.mockResolvedValueOnce({});
      await expect(service.updateProfile(1, { phone: '0901234567' })).resolves.toMatchObject({ user: { phone: '0901234567' } });
    });
  });

  describe('changePassword', () => {
    it('revokes old sessions and returns a fresh token pair', async () => {
      prismaMock.user.findUnique.mockResolvedValueOnce({ id: 1, name: 'A', email: 'a@test.com', role: 'customer', password: 'old_hash' });
      (bcrypt.compare as jest.Mock).mockResolvedValueOnce(true);
      (bcrypt.hash as jest.Mock).mockResolvedValue('new_hash');
      prismaMock.user.update.mockResolvedValueOnce({});

      const result = await service.changePassword(1, { currentPassword: 'oldpass123', newPassword: 'newpass123' });

      expect(result).toMatchObject({ message: 'Password changed successfully', token: expect.any(String), refreshToken: expect.any(String) });
      expect(prismaMock.user.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { password: 'new_hash', refresh_token: 'new_hash' },
      });
    });
  });
});
