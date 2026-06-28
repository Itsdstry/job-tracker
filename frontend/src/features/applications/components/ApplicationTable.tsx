import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Application } from '../../../types';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Modal } from '../../../components/ui/Modal';
import { ApplicationForm } from './ApplicationForm';
import { useUpdateApplication, useDeleteApplication } from '../hooks/useApplications';
import { formatDate, formatSalary } from '../../../utils';

interface ApplicationTableProps {
  applications: Application[];
  isLoading?: boolean;
  hasActiveFilters?: boolean;
}

export const ApplicationTable = ({ applications, isLoading, hasActiveFilters }: ApplicationTableProps) => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [editingApp, setEditingApp] = useState<Application | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const updateMutation = useUpdateApplication();
  const deleteMutation = useDeleteApplication();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!applications.length) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
          {hasActiveFilters ? (
            <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          ) : (
            <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          )}
        </div>
        <p className="text-gray-500 dark:text-gray-400 font-medium">
          {hasActiveFilters ? t('applications.empty.noResults') : t('applications.empty.noApplications')}
        </p>
        <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
          {hasActiveFilters ? t('applications.empty.noResultsDesc') : t('applications.empty.noApplicationsDesc')}
        </p>
      </div>
    );
  }

  const headers = [
    t('applications.table.company'),
    t('applications.table.position'),
    t('applications.table.location'),
    t('applications.table.salary'),
    t('applications.table.date'),
    t('applications.table.status'),
    t('applications.table.actions'),
  ];

  return (
    <>
      {/* Mobile card list (< md) */}
      <div className="divide-y divide-gray-100 dark:divide-gray-800 md:hidden">
        {applications.map((app) => (
          <div
            key={app.id}
            className="flex items-start justify-between gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer"
            onClick={() => navigate(`/applications/${app.id}`)}
          >
            <div className="min-w-0 flex-1">
              <p className="font-medium text-gray-900 dark:text-white truncate">{app.company}</p>
              <p className="text-sm text-gray-600 dark:text-gray-300 truncate">{app.position}</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{formatDate(app.applicationDate)}</p>
            </div>
            <div className="flex flex-col items-end gap-2 shrink-0">
              <Badge status={app.status} />
              <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                <Button variant="ghost" size="sm" onClick={() => setEditingApp(app)} aria-label={t('common.edit')}>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setDeletingId(app.id)}
                  aria-label={t('common.delete')}
                  className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop table (>= md) */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700">
              {headers.map((h) => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {applications.map((app) => (
              <tr
                key={app.id}
                className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer"
                onClick={() => navigate(`/applications/${app.id}`)}
              >
                <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{app.company}</td>
                <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{app.position}</td>
                <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{app.location || t('common.na')}</td>
                <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{formatSalary(app.salary)}</td>
                <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{formatDate(app.applicationDate)}</td>
                <td className="px-4 py-3"><Badge status={app.status} /></td>
                <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={() => setEditingApp(app)} aria-label={t('common.edit')}>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeletingId(app.id)}
                      aria-label={t('common.delete')}
                      className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal isOpen={!!editingApp} onClose={() => setEditingApp(null)} title={t('applicationForm.editTitle')} size="lg">
        {editingApp && (
          <ApplicationForm
            initialData={editingApp}
            isLoading={updateMutation.isPending}
            onCancel={() => setEditingApp(null)}
            onSubmit={(data) => {
              updateMutation.mutate(
                { id: editingApp.id, data },
                { onSuccess: () => setEditingApp(null) }
              );
            }}
          />
        )}
      </Modal>

      <Modal isOpen={!!deletingId} onClose={() => setDeletingId(null)} title={t('common.delete')} size="sm">
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          {t('applicationDetail.deleteConfirm')}
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setDeletingId(null)}>{t('common.cancel')}</Button>
          <Button
            variant="danger"
            isLoading={deleteMutation.isPending}
            onClick={() => {
              if (deletingId) {
                deleteMutation.mutate(deletingId, { onSuccess: () => setDeletingId(null) });
              }
            }}
          >
            {t('common.delete')}
          </Button>
        </div>
      </Modal>
    </>
  );
};
