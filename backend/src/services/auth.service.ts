import bcrypt from 'bcryptjs';
import { prisma } from '../prisma/client';
import { signToken } from '../utils/jwt';
import { buildResetUrl, createResetToken, sendResetEmail } from '../utils/mail';

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
}

const SALT_ROUNDS = 12;

export const register = async (dto: RegisterDto) => {
  const existing = await prisma.user.findUnique({ where: { email: dto.email } });
  if (existing) throw { statusCode: 409, message: 'Email already in use' };

  const hashedPassword = await bcrypt.hash(dto.password, SALT_ROUNDS);
  const user = await prisma.user.create({
    data: { name: dto.name, email: dto.email, password: hashedPassword },
    select: { id: true, name: true, email: true, createdAt: true },
  });

  const token = signToken({ userId: user.id, email: user.email });
  return { user, token };
};

export const login = async (dto: LoginDto) => {
  const user = await prisma.user.findUnique({ where: { email: dto.email } });
  if (!user) throw { statusCode: 401, message: 'Invalid credentials' };

  const valid = await bcrypt.compare(dto.password, user.password);
  if (!valid) throw { statusCode: 401, message: 'Invalid credentials' };

  const token = signToken({ userId: user.id, email: user.email });
  const { password: _, ...safeUser } = user;
  return { user: safeUser, token };
};

export const getProfile = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
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

  const updateData: { name?: string; password?: string } = {};

  if (dto.name) updateData.name = dto.name;

  if (dto.currentPassword && dto.newPassword) {
    const valid = await bcrypt.compare(dto.currentPassword, user.password);
    if (!valid) throw { statusCode: 400, message: 'Current password is incorrect' };
    updateData.password = await bcrypt.hash(dto.newPassword, SALT_ROUNDS);
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: updateData,
    select: { id: true, name: true, email: true, createdAt: true },
  });

  return updated;
};

export const forgotPassword = async (email: string) => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return { message: 'If that email exists, a reset link has been sent' };

  const token = createResetToken();
  const expiresAt = new Date(Date.now() + 1000 * 60 * 30);

  await prisma.passwordResetToken.create({
    data: {
      token,
      expiresAt,
      userId: user.id,
    },
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
