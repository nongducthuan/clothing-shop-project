import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import {
  authenticateToken,
  optionalAuthenticateToken,
  requireAdmin,
  JwtPayload,
} from '../../middleware/authMiddleware';

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Creates a minimal mock Express Response with jest.fn() for json/status */
function mockRes() {
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  } as unknown as Response;
  return res;
}

/** Creates a mock Request with proper headers structure */
function mockReq(token?: string): Request {
  return {
    headers: {
      authorization: token ? `Bearer ${token}` : undefined,
    },
    user: undefined,
  } as unknown as Request;
}

const next: NextFunction = jest.fn();

const VALID_PAYLOAD: JwtPayload = {
  id: 1,
  name: 'Test User',
  email: 'test@example.com',
  role: 'customer',
};

// ─── authenticateToken ────────────────────────────────────────────────────────

describe('authenticateToken', () => {
  beforeEach(() => jest.clearAllMocks());

  it('should return 401 when no Authorization header is provided', () => {
    const req = mockReq(); // no token
    const res = mockRes();

    authenticateToken(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'No token provided' });
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 401 when token is the literal string "null"', () => {
    const req = mockReq('null');
    const res = mockRes();

    authenticateToken(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 403 when token is invalid / tampered', (done) => {
    const req = mockReq('this.is.not.a.valid.jwt');
    const res = mockRes();
    const mockNext: NextFunction = jest.fn();

    authenticateToken(req, res, mockNext);

    // jwt.verify is async via callback — use setImmediate to flush
    setImmediate(() => {
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ message: 'Invalid token' });
      expect(mockNext).not.toHaveBeenCalled();
      done();
    });
  });

  it('should call next() and attach user when token is valid', (done) => {
    const token = jwt.sign(VALID_PAYLOAD, process.env.JWT_SECRET as string, { expiresIn: '1h' });
    const req = mockReq(token);
    const res = mockRes();
    const mockNext: NextFunction = jest.fn();

    authenticateToken(req, res, mockNext);

    setImmediate(() => {
      expect(mockNext).toHaveBeenCalled();
      expect((req as any).user).toMatchObject({ id: 1, email: 'test@example.com' });
      done();
    });
  });
});

// ─── requireAdmin ─────────────────────────────────────────────────────────────

describe('requireAdmin', () => {
  beforeEach(() => jest.clearAllMocks());

  it('should return 403 when user role is customer', () => {
    const req = { user: { role: 'customer' } } as unknown as Request;
    const res = mockRes();
    const mockNext: NextFunction = jest.fn();

    requireAdmin(req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ message: 'Admin only' });
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should return 403 when user is undefined', () => {
    const req = { user: undefined } as unknown as Request;
    const res = mockRes();
    const mockNext: NextFunction = jest.fn();

    requireAdmin(req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should call next() when user role is admin', () => {
    const req = { user: { role: 'admin' } } as unknown as Request;
    const res = mockRes();
    const mockNext: NextFunction = jest.fn();

    requireAdmin(req, res, mockNext);

    expect(mockNext).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });
});

// ─── optionalAuthenticateToken ────────────────────────────────────────────────

describe('optionalAuthenticateToken', () => {
  beforeEach(() => jest.clearAllMocks());

  it('should call next() without attaching user when no token is provided', () => {
    const req = mockReq();
    const res = mockRes();
    const mockNext: NextFunction = jest.fn();

    optionalAuthenticateToken(req, res, mockNext);

    expect(mockNext).toHaveBeenCalled();
    expect((req as any).user).toBeUndefined();
  });

  it('should call next() without blocking when token is invalid', (done) => {
    const req = mockReq('bad.token.here');
    const res = mockRes();
    const mockNext: NextFunction = jest.fn();

    optionalAuthenticateToken(req, res, mockNext);

    setImmediate(() => {
      expect(mockNext).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
      done();
    });
  });

  it('should attach user and call next() when token is valid', (done) => {
    const token = jwt.sign(VALID_PAYLOAD, process.env.JWT_SECRET as string, { expiresIn: '1h' });
    const req = mockReq(token);
    const res = mockRes();
    const mockNext: NextFunction = jest.fn();

    optionalAuthenticateToken(req, res, mockNext);

    setImmediate(() => {
      expect(mockNext).toHaveBeenCalled();
      expect((req as any).user).toMatchObject({ id: 1 });
      done();
    });
  });
});
