import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import bcrypt from 'bcryptjs';
import { CustomerAuthService } from '../../customer/services/customer-auth.service';
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

const service = new CustomerAuthService(prismaMock as unknown as PrismaService);

describe('CustomerAuthService', () => {
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
      prismaMock.user.findUnique.mockResolvedValueOnce({ id: 99, email: 'taken@test.com' });

      await expect(service.register({
        name: 'Thuan',
        email: 'taken@test.com',
        phone: '0909090909',
        password: 'pass12345',
      })).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when phone is already in use', async () => {
      prismaMock.user.findUnique
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ id: 55 });

      await expect(service.register({
        name: 'Thuan',
        email: 'new@test.com',
        phone: '0909090909',
        password: 'pass12345',
      })).rejects.toThrow(BadRequestException);
    });

    it('should return user info on successful registration', async () => {
      prismaMock.user.findUnique
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null);

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
});
