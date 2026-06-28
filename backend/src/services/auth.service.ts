import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { prisma } from '../prisma/client';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/jwt';
import { buildResetUrl, createResetToken, sendResetEmail } from '../utils/mail';
import logger from '../utils/logger';

export interface RegisterDto {
  name: string;
  email: string;
  password: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface UpdateProfileDto {
  name?: string;
  currentPassword?: string;
  newPassword?: string;
  emailReminders?: boolean;
}

const SALT_ROUNDS = 12;

const createTokenPair = async (userId: string, email: string) => {
  const accessToken = signAccessToken({ userId, email });
  const refreshToken = signRefreshToken({ userId, email });

  await prisma.refreshToken.create({
    data: {
      token: crypto.createHash('sha256').update(refreshToken).digest('hex'),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      userId,
    },
  });

  return { accessToken, refreshToken };
};

export const register = async (dto: RegisterDto) => {
  const existing = await prisma.user.findUnique({ where: { email: dto.email } });
  if (existing) throw { statusCode: 409, message: 'Email already in use' };

  const hashedPassword = await bcrypt.hash(dto.password, SALT_ROUNDS);
  const user = await prisma.user.create({
    data: { name: dto.name, email: dto.email, password: hashedPassword },
    select: { id: true, name: true, email: true, createdAt: true },
  });

  logger.info({ userId: user.id, email: user.email }, 'User registered');
  const tokens = await createTokenPair(user.id, user.email);
  return { user, ...tokens };
};

export const login = async (dto: LoginDto) => {
  const user = await prisma.user.findUnique({ where: { email: dto.email } });
  if (!user) {
    logger.warn({ email: dto.email }, 'Login failed: user not found');
    throw { statusCode: 401, message: 'Invalid credentials' };
  }

  const valid = await bcrypt.compare(dto.password, user.password);
  if (!valid) {
    logger.warn({ userId: user.id, email: user.email }, 'Login failed: wrong password');
    throw { statusCode: 401, message: 'Invalid credentials' };
  }

  logger.info({ userId: user.id, email: user.email }, 'User logged in');
  const { password: _, ...safeUser } = user;
  const tokens = await createTokenPair(user.id, user.email);
  return { user: safeUser, ...tokens };
};

export const refresh = async (refreshToken: string) => {
  let payload;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    throw { statusCode: 401, message: 'Invalid or expired refresh token' };
  }

  const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
  const stored = await prisma.refreshToken.findUnique({ where: { token: tokenHash } });

  if (!stored || stored.revoked || stored.expiresAt < new Date()) {
    throw { statusCode: 401, message: 'Invalid or expired refresh token' };
  }

  await prisma.refreshToken.update({ where: { id: stored.id }, data: { revoked: true } });

  const user = await prisma.user.findUnique({ where: { id: payload.userId } });
  if (!user) throw { statusCode: 401, message: 'User not found' };

  const tokens = await createTokenPair(user.id, user.email);
  return tokens;
};

export const logout = async (refreshToken: string) => {
  const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
  await prisma.refreshToken.updateMany({
    where: { token: tokenHash },
    data: { revoked: true },
  });
  return { message: 'Logged out successfully' };
};

export const getProfile = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      emailReminders: true,
      createdAt: true,
      _count: { select: { applications: true } },
    },
  });
  if (!user) throw { statusCode: 404, message: 'User not found' };
  return user;
};

export const updateProfile = async (userId: string, dto: UpdateProfileDto) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw { statusCode: 404, message: 'User not found' };

  const updateData: { name?: string; password?: string; emailReminders?: boolean } = {};

  if (dto.name) updateData.name = dto.name;
  if (typeof dto.emailReminders === 'boolean') updateData.emailReminders = dto.emailReminders;

  if (dto.currentPassword && dto.newPassword) {
    const valid = await bcrypt.compare(dto.currentPassword, user.password);
    if (!valid) throw { statusCode: 400, message: 'Current password is incorrect' };
    updateData.password = await bcrypt.hash(dto.newPassword, SALT_ROUNDS);
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: updateData,
    select: { id: true, name: true, email: true, emailReminders: true, createdAt: true },
  });

  return updated;
};

export const forgotPassword = async (email: string) => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return { message: 'If that email exists, a reset link has been sent' };

  const token = createResetToken();
  const expiresAt = new Date(Date.now() + 1000 * 60 * 30);

  await prisma.passwordResetToken.create({
    data: { token, expiresAt, userId: user.id },
  });

  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const resetUrl = buildResetUrl(frontendUrl, token);
  await sendResetEmail(user.email, resetUrl);

  return { message: 'If that email exists, a reset link has been sent' };
};

export const resetPassword = async (token: string, newPassword: string) => {
  const resetToken = await prisma.passwordResetToken.findUnique({ where: { token } });
  if (!resetToken) throw { statusCode: 400, message: 'Invalid or expired reset token' };
  if (resetToken.used || resetToken.expiresAt < new Date()) {
    throw { statusCode: 400, message: 'Invalid or expired reset token' };
  }

  const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);

  await prisma.$transaction([
    prisma.user.update({
      where: { id: resetToken.userId },
      data: { password: hashedPassword },
    }),
    prisma.passwordResetToken.update({
      where: { id: resetToken.id },
      data: { used: true },
    }),
  ]);

  return { message: 'Password reset successfully' };
};
