// jest.mock calls are hoisted to the top of the file by ts-jest's Babel transform.
// This ensures the prisma mock is registered BEFORE app.ts (and auth.service.ts) are loaded,
// so auth.service.ts captures the mock instance — not the real PrismaClient.

import { PrismaClient } from '@prisma/client';
import { mockDeep, mockReset, DeepMockProxy } from 'jest-mock-extended';

jest.mock('../../prisma/client', () => ({
  __esModule: true,
  prisma: mockDeep<PrismaClient>(),
}));

jest.mock('bcryptjs', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

jest.mock('../../utils/jwt', () => ({
  signAccessToken: jest.fn(),
  signRefreshToken: jest.fn(),
  verifyRefreshToken: jest.fn(),
  verifyToken: jest.fn(),
  signToken: jest.fn(),
}));

jest.mock('../../utils/mail', () => ({
  createResetToken: jest.fn(),
  buildResetUrl: jest.fn(),
  sendResetEmail: jest.fn(),
}));

// Logger is NOT mocked — pinoHttp needs the real pino instance (silenced by LOG_LEVEL=silent in env.ts)

import crypto from 'crypto';
import request from 'supertest';
import app from '../../app';
import { prisma } from '../../prisma/client';
import bcrypt from 'bcryptjs';
import * as jwtUtils from '../../utils/jwt';
import * as mailUtils from '../../utils/mail';

const prismaMock = prisma as unknown as DeepMockProxy<PrismaClient>;

const mockHash = bcrypt.hash as jest.Mock;
const mockCompare = bcrypt.compare as jest.Mock;
const mockSignAccess = jwtUtils.signAccessToken as jest.Mock;
const mockSignRefresh = jwtUtils.signRefreshToken as jest.Mock;
const mockVerifyRefresh = jwtUtils.verifyRefreshToken as jest.Mock;
const mockVerifyToken = jwtUtils.verifyToken as jest.Mock;
const mockCreateResetToken = mailUtils.createResetToken as jest.Mock;
const mockBuildResetUrl = mailUtils.buildResetUrl as jest.Mock;
const mockSendResetEmail = mailUtils.sendResetEmail as jest.Mock;

const DB_USER = {
  id: 'user-1',
  name: 'Test User',
  email: 'test@example.com',
  password: 'hashed_password',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
};

const SAFE_USER = {
  id: 'user-1',
  name: 'Test User',
  email: 'test@example.com',
  createdAt: new Date('2024-01-01'),
};

beforeEach(() => {
  mockReset(prismaMock);
  mockSignAccess.mockReturnValue('mock-access-token');
  mockSignRefresh.mockReturnValue('mock-refresh-token');
  mockHash.mockResolvedValue('hashed_password');
  mockCompare.mockResolvedValue(false);
  mockVerifyToken.mockReturnValue({ userId: 'user-1', email: 'test@example.com' });
  mockCreateResetToken.mockReturnValue('reset-hex-token');
  mockBuildResetUrl.mockReturnValue('http://localhost:5173/reset-password?token=reset-hex-token');
  mockSendResetEmail.mockResolvedValue(true);
});

describe('Auth API — integration', () => {
  describe('POST /api/auth/register', () => {
    it('returns 201 with user and tokens on valid input', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);
      prismaMock.user.create.mockResolvedValue(SAFE_USER as any);

      const res = await request(app)
        .post('/api/auth/register')
        .send({ name: 'Test User', email: 'new@example.com', password: 'password123' });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.accessToken).toBe('mock-access-token');
      expect(res.body.data.refreshToken).toBe('mock-refresh-token');
    });

    it('returns 400 when name is missing', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ email: 'test@example.com', password: 'password123' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('returns 400 when email format is invalid', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ name: 'Test', email: 'not-an-email', password: 'password123' });

      expect(res.status).toBe(400);
    });

    it('returns 400 when password is shorter than 8 characters', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ name: 'Test', email: 'test@example.com', password: 'short' });

      expect(res.status).toBe(400);
    });

    it('returns 409 when email is already in use', async () => {
      prismaMock.user.findUnique.mockResolvedValue(DB_USER as any);

      const res = await request(app)
        .post('/api/auth/register')
        .send({ name: 'Test', email: 'test@example.com', password: 'password123' });

      expect(res.status).toBe(409);
      expect(res.body.message).toBe('Email already in use');
    });
  });

  describe('POST /api/auth/login', () => {
    it('returns 200 with tokens on valid credentials', async () => {
      prismaMock.user.findUnique.mockResolvedValue(DB_USER as any);
      mockCompare.mockResolvedValue(true);

      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@example.com', password: 'password123' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.accessToken).toBe('mock-access-token');
      expect(res.body.data.user).not.toHaveProperty('password');
    });

    it('returns 401 when credentials are wrong', async () => {
      prismaMock.user.findUnique.mockResolvedValue(DB_USER as any);
      mockCompare.mockResolvedValue(false);

      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@example.com', password: 'wrongpass' });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('returns 400 when password field is missing', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@example.com' });

      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/auth/refresh', () => {
    it('returns 200 with new tokens on a valid refresh token', async () => {
      const token = 'valid-refresh-token';
      const hash = crypto.createHash('sha256').update(token).digest('hex');

      mockVerifyRefresh.mockReturnValue({ userId: 'user-1', email: 'test@example.com' });
      prismaMock.refreshToken.findUnique.mockResolvedValue({
        id: 'rt-1',
        token: hash,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        revoked: false,
        userId: 'user-1',
        createdAt: new Date(),
      } as any);
      prismaMock.user.findUnique.mockResolvedValue(DB_USER as any);

      const res = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: token });

      expect(res.status).toBe(200);
      expect(res.body.data.accessToken).toBe('mock-access-token');
    });

    it('returns 400 when refreshToken is absent from the body', async () => {
      const res = await request(app).post('/api/auth/refresh').send({});

      expect(res.status).toBe(400);
    });

    it('returns 401 when the refresh token is invalid', async () => {
      mockVerifyRefresh.mockImplementation(() => { throw new Error('invalid'); });

      const res = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: 'bad-token' });

      expect(res.status).toBe(401);
    });
  });

  describe('POST /api/auth/logout', () => {
    it('returns 200 even when no refreshToken is provided', async () => {
      const res = await request(app).post('/api/auth/logout').send({});

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Logged out successfully');
    });

    it('revokes the token and returns 200 when refreshToken is provided', async () => {
      const res = await request(app)
        .post('/api/auth/logout')
        .send({ refreshToken: 'some-token' });

      expect(res.status).toBe(200);
      expect(prismaMock.refreshToken.updateMany).toHaveBeenCalled();
    });
  });

  describe('GET /api/auth/profile', () => {
    it('returns 200 with the user profile when authenticated', async () => {
      prismaMock.user.findUnique.mockResolvedValue({
        ...SAFE_USER,
        _count: { applications: 3 },
      } as any);

      const res = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', 'Bearer valid-token');

      expect(res.status).toBe(200);
      expect(res.body.data._count.applications).toBe(3);
    });

    it('returns 401 when Authorization header is missing', async () => {
      const res = await request(app).get('/api/auth/profile');

      expect(res.status).toBe(401);
    });

    it('returns 401 when token is invalid', async () => {
      mockVerifyToken.mockImplementation(() => { throw new Error('invalid'); });

      const res = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', 'Bearer bad-token');

      expect(res.status).toBe(401);
    });
  });

  describe('PUT /api/auth/profile', () => {
    it('returns 200 and updated profile when authenticated', async () => {
      prismaMock.user.findUnique.mockResolvedValue(DB_USER as any);
      prismaMock.user.update.mockResolvedValue({ ...SAFE_USER, name: 'Updated Name' } as any);

      const res = await request(app)
        .put('/api/auth/profile')
        .set('Authorization', 'Bearer valid-token')
        .send({ name: 'Updated Name' });

      expect(res.status).toBe(200);
      expect(res.body.data.name).toBe('Updated Name');
    });

    it('returns 401 when Authorization header is missing', async () => {
      const res = await request(app)
        .put('/api/auth/profile')
        .send({ name: 'Updated Name' });

      expect(res.status).toBe(401);
    });
  });

  describe('POST /api/auth/forgot-password', () => {
    it('returns 200 with a generic message regardless of whether the email exists', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);

      const res = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'anyone@example.com' });

      expect(res.status).toBe(200);
      expect(res.body.data.message).toBe('If that email exists, a reset link has been sent');
    });

    it('returns 400 when the email format is invalid', async () => {
      const res = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'not-an-email' });

      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/auth/reset-password', () => {
    it('returns 200 when token and new password are valid', async () => {
      prismaMock.passwordResetToken.findUnique.mockResolvedValue({
        id: 'prt-1',
        token: 'valid-token',
        expiresAt: new Date(Date.now() + 30 * 60 * 1000),
        used: false,
        userId: 'user-1',
        createdAt: new Date(),
      } as any);
      prismaMock.$transaction.mockResolvedValue([] as any);

      const res = await request(app)
        .post('/api/auth/reset-password')
        .send({ token: 'valid-token', password: 'newpass123' });

      expect(res.status).toBe(200);
      expect(res.body.data.message).toBe('Password reset successfully');
    });

    it('returns 400 when the reset token is invalid', async () => {
      prismaMock.passwordResetToken.findUnique.mockResolvedValue(null);

      const res = await request(app)
        .post('/api/auth/reset-password')
        .send({ token: 'bad-token', password: 'newpass123' });

      expect(res.status).toBe(400);
    });

    it('returns 400 when new password is too short', async () => {
      const res = await request(app)
        .post('/api/auth/reset-password')
        .send({ token: 'some-token', password: 'short' });

      expect(res.status).toBe(400);
    });
  });
});
