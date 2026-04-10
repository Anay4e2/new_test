import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request, Response } from 'express';

// Mock User model
const mockUser = {
  _id: 'user123',
  name: 'Test User',
  email: 'test@example.com',
  role: 'user',
  createdAt: new Date('2025-01-01'),
  save: vi.fn(),
};

vi.mock('../../models/User', () => ({
  default: {
    findOne: vi.fn(),
    create: vi.fn(),
    findById: vi.fn(),
  },
  UserDocument: {},
}));

vi.mock('../../config/auth', () => ({
  JWT_SECRET: 'test-secret',
  JWT_EXPIRE: '7d',
}));

vi.mock('../../services/emailService', () => ({
  sendResetPasswordEmail: vi.fn().mockResolvedValue(true),
}));

vi.mock('../../services/resendService', () => ({
  sendOtpEmail: vi.fn().mockResolvedValue(true),
  sendWelcomeEmail: vi.fn().mockResolvedValue(true),
  sendPasswordResetEmail: vi.fn().mockResolvedValue(true),
  isResendConfigured: vi.fn().mockReturnValue(false),
}));

vi.mock('../../lib/dbStatus', () => ({
  isDbConnected: vi.fn().mockReturnValue(true),
}));

vi.mock('../../lib/logger', () => ({
  default: { info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}));

import User from '../../models/User';
import { register, login } from '../authController';

function mockReq(body: any = {}, params: any = {}): Partial<Request> {
  return { body, params };
}

function mockRes(): Partial<Response> {
  const res: any = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
}

describe('Auth Controller', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('register', () => {
    it('should return 400 if user already exists', async () => {
      (User.findOne as any).mockReturnValue({
        select: vi.fn().mockResolvedValue({ ...mockUser, isVerified: true }),
      });
      const req = mockReq({ name: 'Test', email: 'test@example.com', password: 'password123' });
      const res = mockRes();

      await register(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: false, message: expect.stringContaining('already exists') })
      );
    });

    it('should create user and return verification response on success', async () => {
      (User.findOne as any).mockReturnValue({
        select: vi.fn().mockResolvedValue(null),
      });
      (User.create as any).mockResolvedValue(mockUser);
      const req = mockReq({ name: 'Test User', email: 'test@example.com', password: 'password123' });
      const res = mockRes();

      await register(req as Request, res as Response);

      expect(User.create).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Test User',
          email: 'test@example.com',
          password: 'password123',
          isVerified: false,
          otp: expect.any(String),
          otpExpire: expect.any(Date),
        })
      );
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          requiresVerification: true,
          email: 'test@example.com',
          message: expect.any(String),
        })
      );
    });
  });

  describe('login', () => {
    it('should return 400 for missing credentials', async () => {
      const req = mockReq({});
      const res = mockRes();

      await login(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should return 401 if user not found', async () => {
      (User.findOne as any).mockReturnValue({ select: vi.fn().mockResolvedValue(null) });
      const req = mockReq({ email: 'none@example.com', password: 'password123' });
      const res = mockRes();

      await login(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(401);
    });
  });
});
