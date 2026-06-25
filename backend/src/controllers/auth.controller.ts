import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import * as authService from '../services/auth.service';
import { sendSuccess, sendError } from '../utils/response';

export const register = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = await authService.register(req.body);
    sendSuccess(res, result, 'Account created successfully', 201);
  } catch (err: any) {
    sendError(res, err.message || 'Registration failed', err.statusCode || 500);
  }
};

export const login = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = await authService.login(req.body);
    sendSuccess(res, result, 'Login successful');
  } catch (err: any) {
    sendError(res, err.message || 'Login failed', err.statusCode || 500);
  }
};

export const getProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const profile = await authService.getProfile(req.userId!);
    sendSuccess(res, profile);
  } catch (err: any) {
    sendError(res, err.message || 'Failed to fetch profile', err.statusCode || 500);
  }
};

export const updateProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const updated = await authService.updateProfile(req.userId!, req.body);
    sendSuccess(res, updated, 'Profile updated successfully');
  } catch (err: any) {
    sendError(res, err.message || 'Failed to update profile', err.statusCode || 500);
  }
};

export const forgotPassword = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = await authService.forgotPassword(req.body.email);
    sendSuccess(res, result);
  } catch (err: any) {
    sendError(res, err.message || 'Request failed', err.statusCode || 500);
  }
};

export const resetPassword = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = await authService.resetPassword(req.body.token, req.body.password);
    sendSuccess(res, result);
  } catch (err: any) {
    sendError(res, err.message || 'Password reset failed', err.statusCode || 500);
  }
};
