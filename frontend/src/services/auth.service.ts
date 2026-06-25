import { api } from './api';
import { ApiResponse, AuthResponse, User } from '../types';

export const authService = {
  register: async (data: { name: string; email: string; password: string }) => {
    const res = await api.post<ApiResponse<AuthResponse>>('/auth/register', data);
    return res.data.data;
  },

  login: async (data: { email: string; password: string }) => {
    const res = await api.post<ApiResponse<AuthResponse>>('/auth/login', data);
    return res.data.data;
  },

  forgotPassword: async (email: string) => {
    const res = await api.post<ApiResponse<{ message: string }>>('/auth/forgot-password', { email });
    return res.data.data;
  },

  resetPassword: async (token: string, password: string) => {
    const res = await api.post<ApiResponse<{ message: string }>>('/auth/reset-password', { token, password });
    return res.data.data;
  },

  getProfile: async () => {
    const res = await api.get<ApiResponse<User>>('/auth/profile');
    return res.data.data;
  },

  updateProfile: async (data: { name?: string; currentPassword?: string; newPassword?: string }) => {
    const res = await api.put<ApiResponse<User>>('/auth/profile', data);
    return res.data.data;
  },
};
