import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Modal } from '../components/ui/Modal';
import { Card } from '../components/ui/Card';
import { ApplicationTable } from '../features/applications/components/ApplicationTable';
import { ApplicationKanban } from '../features/applications/components/ApplicationKanban';
import { ApplicationForm } from '../features/applications/components/ApplicationForm';
import { useApplications, useCreateApplication } from '../features/applications/hooks/useApplications';
import { ApplicationStatus, ApplicationFormData } from '../types';
import { ALL_STATUSES } from '../utils';
import { applicationService } from '../services/application.service';

export const Applications = () => {
  const { t } = useTranslation();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<ApplicationStatus | ''>('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [order, setOrder] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const [viewMode, setViewMode] = useState<'table' | 'kanban'>('kanban');
  const [isExporting, setIsExporting] = useState(false);

  const createMutation = useCreateApplication();

  const statusOptions = [
    { value: '', label: t('applications.filters.allStatuses') },
    ...ALL_STATUSES.map((s) => ({ value: s, label: t(`status.${s}`) })),
  ];

  const sortOptions = [
    { value: 'createdAt', label: t('applications.sort.dateAdded') },
    { value: 'applicationDate', label: t('applications.sort.applicationDate') },
    { value: 'company', label: t('applications.sort.company') },
    { value: 'position', label: t('applications.sort.position') },
    { value: 'salary', label: t('applications.sort.salary') },
  ];

  const commonParams = {
    search: search || undefined,
    status: (status as ApplicationStatus) || undefined,
    sortBy,
    order,
  };

  const { data: tableData, isLoading: tableLoading } = useApplications(
    { ...commonParams, page, limit: 20 },
    viewMode === 'table',
  );

  const { data: kanbanData, isLoading: kanbanLoading } = useApplications(
    { ...commonParams, page: 1, limit: 200 },
    viewMode === 'kanban',
  );

  const data = viewMode === 'kanban' ? kanbanData : tableData;
  const isLoading = viewMode === 'kanban' ? kanbanLoading : tableLoading;

  const handleCreate = (formData: ApplicationFormData) => {
    createMutation.mutate(formData, { onSuccess: () => setIsCreateOpen(false) });
  };

  const toggleOrder = () => setOrder((o) => (o === 'asc' ? 'desc' : 'asc'));

  const handleExportCsv = async () => {
    setIsExporting(true);
    try {
      await applicationService.exportCsv({
        search: search || undefined,
        status: (status as ApplicationStatus) || undefined,
        sortBy,
        order,
      });
      toast.success('CSV exported successfully');
    } catch {
      toast.error('Could not export CSV');
    } finally {
      setIsExporting(false);
    }
  };

  const from = (page - 1) * 20 + 1;
  const to = data ? Math.min(page * 20, data.pagination.total) : 0;
  const total = data?.pagination.total ?? 0;

  return (
    <div className="space-y-4">
      <Card className="border-primary-100/70 bg-gradient-to-r from-primary-50 via-white to-indigo-50 dark:from-primary-900/20 dark:via-gray-900 dark:to-indigo-900/20">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-primary-600 dark:text-primary-400">{t('applications.label')}</p>
            <h2 className="mt-1 text-xl font-semibold text-gray-900 dark:text-white">{t('applications.title')}</h2>
            <p className="mt-2 max-w-2xl text-sm text-gray-600 dark:text-gray-400">
              {t('applications.description')}
            </p>
          </div>
          <Button onClick={() => setIsCreateOpen(true)}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            {t('applications.addApplication')}
          </Button>
        </div>
      </Card>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex-1 min-w-0">
          <Input
            placeholder={t('applications.search.placeholder')}
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            leftAddon={
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            }
          />
        </div>
        <div className="flex flex-wrap gap-2 flex-shrink-0">
          <div className="flex rounded-lg border border-gray-200 bg-white p-1 dark:border-gray-700 dark:bg-gray-800">
            <button
              type="button"
              onClick={() => setViewMode('kanban')}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${viewMode === 'kanban' ? 'bg-primary-600 text-white' : 'text-gray-600 dark:text-gray-300'}`}
            >
              {t('applications.views.kanban')}
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${viewMode === 'table' ? 'bg-primary-600 text-white' : 'text-gray-600 dark:text-gray-300'}`}
            >
              {t('applications.views.table')}
            </button>
          </div>
          <Select
            options={statusOptions}
            value={status}
            onChange={(e) => { setStatus(e.target.value as ApplicationStatus | ''); setPage(1); }}
            className="w-32 sm:w-36"
          />
          <Select
            options={sortOptions}
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="w-32 sm:w-36"
          />
          <Button variant="secondary" size="md" onClick={toggleOrder} title={order === 'asc' ? t('applications.sort.descending') : t('applications.sort.ascending')}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={order === 'asc' ? 'M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12' : 'M3 4h13M3 8h9m-9 4h9m5-4v12m0 0l-4-4m4 4l4-4'} />
            </svg>
          </Button>
          <Button variant="secondary" size="md" onClick={handleExportCsv} isLoading={isExporting}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v12m0 0l-4-4m4 4l4-4m-8 8h8" />
            </svg>
            <span className="hidden sm:inline">{t('common.export')}</span>
          </Button>
        </div>
      </div>

      <Card padding="none">
        {viewMode === 'kanban' ? (
          <div className="p-4">
            <ApplicationKanban applications={data?.applications ?? []} isLoading={isLoading} />
          </div>
        ) : (
          <>
            <ApplicationTable applications={data?.applications ?? []} isLoading={isLoading} hasActiveFilters={!!(search || status)} />

            {data && data.pagination.totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 dark:border-gray-800">
                <p className="text-sm text-gray-500">
                  {t('applications.pagination.showing', { from, to, total })}
                </p>
                <div className="flex gap-2">
                  <Button variant="secondary" size="sm" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
                    {t('common.previous')}
                  </Button>
                  <Button variant="secondary" size="sm" disabled={page >= data.pagination.totalPages} onClick={() => setPage((p) => p + 1)}>
                    {t('common.next')}
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </Card>

      <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title={t('applicationForm.newTitle')} size="lg">
        <ApplicationForm
          onSubmit={handleCreate}
          onCancel={() => setIsCreateOpen(false)}
          isLoading={createMutation.isPending}
        />
      </Modal>
    </div>
  );
};
