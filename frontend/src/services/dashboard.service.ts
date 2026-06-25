import { api } from './api';
import { ApiResponse, DashboardStats, DashboardCharts } from '../types';

export const dashboardService = {
  getStats: async () => {
    const res = await api.get<ApiResponse<DashboardStats>>('/dashboard/stats');
    return res.data.data;
  },

  getCharts: async () => {
    const res = await api.get<ApiResponse<DashboardCharts>>('/dashboard/charts');
    return res.data.data;
  },
};
