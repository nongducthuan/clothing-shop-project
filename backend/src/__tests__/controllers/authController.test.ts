import { Request, Response } from 'express';

// ─── Mock Prisma before importing the controller ──────────────────────────────
jest.mock('../../../prisma/client', () => ({
  __esModule: true,
  default: {
    user: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    membership: {
      findFirst: jest.fn(),
    },
  },
}));

// Mock bcryptjs
jest.mock('bcryptjs', () => ({
  hash: jest.fn().mockResolvedValue('hashed_password_xyz'),
  compare: jest.fn(),
}));

import prisma from '../../../prisma/client';
import bcrypt from 'bcryptjs';
import { register, login } from '../../controllers/customer/authController';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function mockRes() {
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  } as unknown as Response;
  return res;
}

function mockReq(body: Record<string, any>): Request {
  return { body } as unknown as Request;
}

// ─── register ─────────────────────────────────────────────────────────────────

describe('register', () => {
  beforeEach(() => jest.clearAllMocks());

  it('should return 400 when required fields are missing', async () => {
    const req = mockReq({ name: 'Thuan', email: 'test@test.com' }); // missing phone & password
    const res = mockRes();

    await register(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'Please enter all required information' });
  });

  it('should return 400 when email is already registered', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce({ id: 99, email: 'taken@test.com' });

    const req = mockReq({
      name: 'Thuan',
      email: 'taken@test.com',
      phone: '0909090909',
      password: 'pass123',
    });
    const res = mockRes();

    await register(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'Email is already registered' });
  });

  it('should return 400 when phone is already in use', async () => {
    // First findUnique (email) returns null → email is free
    (prisma.user.findUnique as jest.Mock)
      .mockResolvedValueOnce(null)        // email check
      .mockResolvedValueOnce({ id: 55 }); // phone check → taken

    const req = mockReq({
      name: 'Thuan',
      email: 'new@test.com',
      phone: '0909090909',
      password: 'pass123',
    });
    const res = mockRes();

    await register(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'Phone number is already in use' });
  });

  it('should return 201 and user info on successful registration', async () => {
    (prisma.user.findUnique as jest.Mock)
      .mockResolvedValueOnce(null)  // email not taken
      .mockResolvedValueOnce(null); // phone not taken

    (prisma.membership.findFirst as jest.Mock).mockResolvedValueOnce({ id: 1 });

    (prisma.user.create as jest.Mock).mockResolvedValueOnce({
      id: 10,
      email: 'newuser@test.com',
    });

    const req = mockReq({
      name: 'Nguyen Van A',
      email: 'newuser@test.com',
      phone: '0901234567',
      password: 'securepass',
    });
    const res = mockRes();

    await register(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Registration successful',
        id: 10,
        email: 'newuser@test.com',
      })
    );
  });
});

// ─── login ────────────────────────────────────────────────────────────────────

describe('login', () => {
  beforeEach(() => jest.clearAllMocks());

  it('should return 400 when identifier or password is missing', async () => {
    const req = mockReq({ identifier: 'test@test.com' }); // no password
    const res = mockRes();

    await login(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Please enter email/phone and password',
    });
  });

  it('should return 401 when user is not found', async () => {
    (prisma.user.findFirst as jest.Mock).mockResolvedValueOnce(null);

    const req = mockReq({ identifier: 'ghost@test.com', password: 'abc' });
    const res = mockRes();

    await login(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'Incorrect account or password' });
  });

  it('should return 401 when password does not match', async () => {
    (prisma.user.findFirst as jest.Mock).mockResolvedValueOnce({
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

    const req = mockReq({ identifier: 'user@test.com', password: 'wrongpass' });
    const res = mockRes();

    await login(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'Incorrect account or password' });
  });

  it('should return token and user info on successful login', async () => {
    (prisma.user.findFirst as jest.Mock).mockResolvedValueOnce({
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

    const req = mockReq({ identifier: 'user@test.com', password: 'correct_pass' });
    const res = mockRes();

    await login(req, res);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Login successful',
        token: expect.any(String),
        user: expect.objectContaining({
          id: 1,
          email: 'user@test.com',
          role: 'customer',
        }),
      })
    );
    expect(res.status).not.toHaveBeenCalled(); // default 200
  });
});
