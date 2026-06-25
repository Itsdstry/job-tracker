import { useQuery } from '@tanstack/react-query';
import { dashboardService } from '../../../services/dashboard.service';

export const useDashboardStats = () => {
  return useQuery({
    queryKey: ['dashboard', 'stats'],
    queryFn: dashboardService.getStats,
    staleTime: 30_000,
  });
};

export const useDashboardCharts = () => {
  return useQuery({
    queryKey: ['dashboard', 'charts'],
    queryFn: dashboardService.getCharts,
    staleTime: 30_000,
  });
};
