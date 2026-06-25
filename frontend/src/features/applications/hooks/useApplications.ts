import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { applicationService, ListParams } from '../../../services/application.service';
import { ApplicationFormData } from '../../../types';

export const APPLICATIONS_KEY = 'applications';

export const useApplications = (params?: ListParams) => {
  return useQuery({
    queryKey: [APPLICATIONS_KEY, params],
    queryFn: () => applicationService.list(params),
  });
};

export const useApplication = (id: string) => {
  return useQuery({
    queryKey: [APPLICATIONS_KEY, id],
    queryFn: () => applicationService.getById(id),
    enabled: !!id,
  });
};

export const useCreateApplication = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: ApplicationFormData) => applicationService.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [APPLICATIONS_KEY] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Application added!');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to create application');
    },
  });
};

export const useUpdateApplication = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ApplicationFormData> }) =>
      applicationService.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [APPLICATIONS_KEY] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Application updated!');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to update application');
    },
  });
};

export const useDeleteApplication = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => applicationService.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [APPLICATIONS_KEY] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Application deleted');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to delete application');
    },
  });
};
