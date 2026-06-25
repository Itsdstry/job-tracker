import { api } from './api';
import {
  ApiResponse,
  Application,
  ApplicationFormData,
  ApplicationsResponse,
  ApplicationStatus,
} from '../types';

export interface ListParams {
  status?: ApplicationStatus;
  search?: string;
  sortBy?: string;
  order?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export const applicationService = {
  list: async (params?: ListParams) => {
    const res = await api.get<ApiResponse<ApplicationsResponse>>('/applications', { params });
    return res.data.data;
  },

  getById: async (id: string) => {
    const res = await api.get<ApiResponse<Application>>(`/applications/${id}`);
    return res.data.data;
  },

  create: async (data: ApplicationFormData) => {
    const payload = {
      ...data,
      salary: data.salary ? parseFloat(data.salary) : null,
    };
    const res = await api.post<ApiResponse<Application>>('/applications', payload);
    return res.data.data;
  },

  update: async (id: string, data: Partial<ApplicationFormData>) => {
    const payload = {
      ...data,
      salary: data.salary !== undefined ? (data.salary ? parseFloat(data.salary) : null) : undefined,
    };
    const res = await api.put<ApiResponse<Application>>(`/applications/${id}`, payload);
    return res.data.data;
  },

  delete: async (id: string) => {
    await api.delete(`/applications/${id}`);
  },
};
