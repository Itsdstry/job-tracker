import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import * as jwtUtils from '../../utils/jwt';
import * as mailUtils from '../../utils/mail';
import { prismaMock } from '../singleton';
import * as authService from '../../services/auth.service';

jest.mock('bcryptjs', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

jest.mock('../../utils/jwt', () => ({
  signAccessToken: jest.fn(),
  signRefreshToken: jest.fn(),
  verifyRefreshToken: jest.fn(),
  signToken: jest.fn(),
}));

jest.mock('../../utils/mail', () => ({
  createResetToken: jest.fn(),
  buildResetUrl: jest.fn(),
  sendResetEmail: jest.fn(),
}));

jest.mock('../../utils/logger', () => ({
  __esModule: true,
  default: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

const mockHash = bcrypt.hash as jest.Mock;
const mockCompare = bcrypt.compare as jest.Mock;
const mockSignAccess = jwtUtils.signAccessToken as jest.Mock;
const mockSignRefresh = jwtUtils.signRefreshToken as jest.Mock;
const mockVerifyRefresh = jwtUtils.verifyRefreshToken as jest.Mock;
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
  mockSignAccess.mockReturnValue('mock-access-token');
  mockSignRefresh.mockReturnValue('mock-refresh-token');
  mockHash.mockResolvedValue('hashed_password');
  mockCompare.mockResolvedValue(false);
});

describe('AuthService', () => {
  describe('register', () => {
    it('creates user and returns tokens when email is unique', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);
      prismaMock.user.create.mockResolvedValue(SAFE_USER as any);

      const result = await authService.register({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
      });

      expect(result.user).toEqual(SAFE_USER);
      expect(result.accessToken).toBe('mock-access-token');
      expect(result.refreshToken).toBe('mock-refresh-token');
      expect(mockHash).toHaveBeenCalledWith('password123', 12);
    });

    it('throws 409 when email is already in use', async () => {
      prismaMock.user.findUnique.mockResolvedValue(DB_USER as any);

      await expect(
        authService.register({ name: 'Test', email: 'test@example.com', password: 'pass1234' })
      ).rejects.toMatchObject({ statusCode: 409, message: 'Email already in use' });
    });
  });

  describe('login', () => {
    it('returns user and tokens with valid credentials', async () => {
      prismaMock.user.findUnique.mockResolvedValue(DB_USER as any);
      mockCompare.mockResolvedValue(true);

      const result = await authService.login({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(result.user).not.toHaveProperty('password');
      expect(result.accessToken).toBe('mock-access-token');
      expect(result.refreshToken).toBe('mock-refresh-token');
    });

    it('throws 401 when user is not found', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);

      await expect(
        authService.login({ email: 'nobody@example.com', password: 'pass' })
      ).rejects.toMatchObject({ statusCode: 401, message: 'Invalid credentials' });
    });

    it('throws 401 when password is wrong', async () => {
      prismaMock.user.findUnique.mockResolvedValue(DB_USER as any);
      mockCompare.mockResolvedValue(false);

      await expect(
        authService.login({ email: 'test@example.com', password: 'wrongpass' })
      ).rejects.toMatchObject({ statusCode: 401, message: 'Invalid credentials' });
    });
  });

  describe('refresh', () => {
    const TOKEN = 'some-refresh-token-string';
    const TOKEN_HASH = crypto.createHash('sha256').update(TOKEN).digest('hex');

    const STORED_TOKEN = {
      id: 'rt-1',
      token: TOKEN_HASH,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      revoked: false,
      userId: 'user-1',
      createdAt: new Date(),
    };

    it('returns new token pair when refresh token is valid', async () => {
      mockVerifyRefresh.mockReturnValue({ userId: 'user-1', email: 'test@example.com' });
      prismaMock.refreshToken.findUnique.mockResolvedValue(STORED_TOKEN as any);
      prismaMock.user.findUnique.mockResolvedValue(DB_USER as any);

      const result = await authService.refresh(TOKEN);

      expect(result.accessToken).toBe('mock-access-token');
      expect(result.refreshToken).toBe('mock-refresh-token');
      expect(prismaMock.refreshToken.update).toHaveBeenCalledWith({
        where: { id: 'rt-1' },
        data: { revoked: true },
      });
    });

    it('throws 401 when JWT signature is invalid', async () => {
      mockVerifyRefresh.mockImplementation(() => { throw new Error('invalid signature'); });

      await expect(authService.refresh(TOKEN)).rejects.toMatchObject({
        statusCode: 401,
        message: 'Invalid or expired refresh token',
      });
    });

    it('throws 401 when token is not in the DB', async () => {
      mockVerifyRefresh.mockReturnValue({ userId: 'user-1', email: 'test@example.com' });
      prismaMock.refreshToken.findUnique.mockResolvedValue(null);

      await expect(authService.refresh(TOKEN)).rejects.toMatchObject({
        statusCode: 401,
        message: 'Invalid or expired refresh token',
      });
    });

    it('throws 401 when token has been revoked', async () => {
      mockVerifyRefresh.mockReturnValue({ userId: 'user-1', email: 'test@example.com' });
      prismaMock.refreshToken.findUnique.mockResolvedValue({ ...STORED_TOKEN, revoked: true } as any);

      await expect(authService.refresh(TOKEN)).rejects.toMatchObject({
        statusCode: 401,
        message: 'Invalid or expired refresh token',
      });
    });

    it('throws 401 when token has expired in the DB', async () => {
      mockVerifyRefresh.mockReturnValue({ userId: 'user-1', email: 'test@example.com' });
      prismaMock.refreshToken.findUnique.mockResolvedValue({
        ...STORED_TOKEN,
        expiresAt: new Date(Date.now() - 1000),
      } as any);

      await expect(authService.refresh(TOKEN)).rejects.toMatchObject({
        statusCode: 401,
        message: 'Invalid or expired refresh token',
      });
    });

    it('throws 401 when the user no longer exists', async () => {
      mockVerifyRefresh.mockReturnValue({ userId: 'user-1', email: 'test@example.com' });
      prismaMock.refreshToken.findUnique.mockResolvedValue(STORED_TOKEN as any);
      prismaMock.user.findUnique.mockResolvedValue(null);

      await expect(authService.refresh(TOKEN)).rejects.toMatchObject({
        statusCode: 401,
        message: 'User not found',
      });
    });
  });

  describe('logout', () => {
    it('marks the refresh token as revoked by its hash', async () => {
      const token = 'logout-refresh-token';
      const expectedHash = crypto.createHash('sha256').update(token).digest('hex');

      await authService.logout(token);

      expect(prismaMock.refreshToken.updateMany).toHaveBeenCalledWith({
        where: { token: expectedHash },
        data: { revoked: true },
      });
    });
  });

  describe('getProfile', () => {
    it('returns user with application count', async () => {
      const profile = { ...SAFE_USER, _count: { applications: 5 } };
      prismaMock.user.findUnique.mockResolvedValue(profile as any);

      const result = await authService.getProfile('user-1');

      expect(result._count.applications).toBe(5);
    });

    it('throws 404 when user is not found', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);

      await expect(authService.getProfile('nonexistent')).rejects.toMatchObject({
        statusCode: 404,
        message: 'User not found',
      });
    });
  });

  describe('updateProfile', () => {
    it('updates name when only name is provided', async () => {
      prismaMock.user.findUnique.mockResolvedValue(DB_USER as any);
      prismaMock.user.update.mockResolvedValue({ ...SAFE_USER, name: 'New Name' } as any);

      const result = await authService.updateProfile('user-1', { name: 'New Name' });

      expect(result.name).toBe('New Name');
      expect(prismaMock.user.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { name: 'New Name' } })
      );
    });

    it('hashes and updates password when current password is correct', async () => {
      prismaMock.user.findUnique.mockResolvedValue(DB_USER as any);
      mockCompare.mockResolvedValue(true);
      mockHash.mockResolvedValue('new_hashed_password');
      prismaMock.user.update.mockResolvedValue(SAFE_USER as any);

      await authService.updateProfile('user-1', {
        currentPassword: 'oldpass',
        newPassword: 'newpass123',
      });

      expect(prismaMock.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ password: 'new_hashed_password' }),
        })
      );
    });

    it('throws 404 when user is not found', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);

      await expect(
        authService.updateProfile('nonexistent', { name: 'Test' })
      ).rejects.toMatchObject({ statusCode: 404, message: 'User not found' });
    });

    it('throws 400 when current password is incorrect', async () => {
      prismaMock.user.findUnique.mockResolvedValue(DB_USER as any);
      mockCompare.mockResolvedValue(false);

      await expect(
        authService.updateProfile('user-1', { currentPassword: 'wrong', newPassword: 'newpass123' })
      ).rejects.toMatchObject({ statusCode: 400, message: 'Current password is incorrect' });
    });
  });

  describe('forgotPassword', () => {
    it('creates reset token and sends email when user exists', async () => {
      prismaMock.user.findUnique.mockResolvedValue(DB_USER as any);
      mockCreateResetToken.mockReturnValue('hex-token-value');
      mockBuildResetUrl.mockReturnValue('http://localhost/reset?token=hex-token-value');
      mockSendResetEmail.mockResolvedValue(true);

      const result = await authService.forgotPassword('test@example.com');

      expect(result.message).toBe('If that email exists, a reset link has been sent');
      expect(prismaMock.passwordResetToken.create).toHaveBeenCalled();
      expect(mockSendResetEmail).toHaveBeenCalled();
    });

    it('returns the same generic message when user does not exist', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);

      const result = await authService.forgotPassword('nobody@example.com');

      expect(result.message).toBe('If that email exists, a reset link has been sent');
      expect(prismaMock.passwordResetToken.create).not.toHaveBeenCalled();
    });
  });

  describe('resetPassword', () => {
    const RESET_TOKEN_ROW = {
      id: 'prt-1',
      token: 'valid-reset-token',
      expiresAt: new Date(Date.now() + 30 * 60 * 1000),
      used: false,
      userId: 'user-1',
      createdAt: new Date(),
    };

    it('resets the password and marks the token as used', async () => {
      prismaMock.passwordResetToken.findUnique.mockResolvedValue(RESET_TOKEN_ROW as any);
      mockHash.mockResolvedValue('new_hashed_password');
      prismaMock.$transaction.mockResolvedValue([] as any);

      const result = await authService.resetPassword('valid-reset-token', 'newpass123');

      expect(result.message).toBe('Password reset successfully');
      expect(prismaMock.$transaction).toHaveBeenCalled();
    });

    it('throws 400 when token is not found', async () => {
      prismaMock.passwordResetToken.findUnique.mockResolvedValue(null);

      await expect(
        authService.resetPassword('bad-token', 'newpass123')
      ).rejects.toMatchObject({ statusCode: 400, message: 'Invalid or expired reset token' });
    });

    it('throws 400 when token has already been used', async () => {
      prismaMock.passwordResetToken.findUnique.mockResolvedValue({
        ...RESET_TOKEN_ROW,
        used: true,
      } as any);

      await expect(
        authService.resetPassword('valid-reset-token', 'newpass123')
      ).rejects.toMatchObject({ statusCode: 400, message: 'Invalid or expired reset token' });
    });

    it('throws 400 when token has expired', async () => {
      prismaMock.passwordResetToken.findUnique.mockResolvedValue({
        ...RESET_TOKEN_ROW,
        expiresAt: new Date(Date.now() - 1000),
      } as any);

      await expect(
        authService.resetPassword('valid-reset-token', 'newpass123')
      ).rejects.toMatchObject({ statusCode: 400, message: 'Invalid or expired reset token' });
    });
  });
});
