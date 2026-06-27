import { useMemo, useState } from 'react';
import clsx from 'clsx';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { useUpdateApplication } from '../hooks/useApplications';
import { Application, ApplicationStatus } from '../../../types';
import { formatDate, formatSalary } from '../../../utils';

type ColumnKey = ApplicationStatus;

const columnKeys: ColumnKey[] = ['Applied', 'Interview', 'TechnicalTest', 'Offer', 'Rejected'];

interface ApplicationKanbanProps {
  applications: Application[];
  isLoading: boolean;
}

export const ApplicationKanban = ({ applications, isLoading }: ApplicationKanbanProps) => {
  const { t } = useTranslation();
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<ApplicationStatus | null>(null);
  const updateMutation = useUpdateApplication();

  const columns = [
    { key: 'Applied' as ColumnKey, title: t('applications.kanban.applied'), description: t('applications.kanban.appliedDesc') },
    { key: 'Interview' as ColumnKey, title: t('applications.kanban.interview'), description: t('applications.kanban.interviewDesc') },
    { key: 'TechnicalTest' as ColumnKey, title: t('applications.kanban.technicalTest'), description: t('applications.kanban.technicalTestDesc') },
    { key: 'Offer' as ColumnKey, title: t('applications.kanban.offer'), description: t('applications.kanban.offerDesc') },
    { key: 'Rejected' as ColumnKey, title: t('applications.kanban.rejected'), description: t('applications.kanban.rejectedDesc') },
  ];

  const groupedApplications = useMemo(() => {
    return columnKeys.reduce((acc, key) => {
      acc[key] = applications.filter((app) => app.status === key);
      return acc;
    }, {} as Record<ApplicationStatus, Application[]>);
  }, [applications]);

  const handleDrop = (status: ApplicationStatus) => {
    if (!draggedId) return;

    const targetApplication = applications.find((app) => app.id === draggedId);
    if (!targetApplication || targetApplication.status === status) {
      setDraggedId(null);
      setDragOverColumn(null);
      return;
    }

    const statusLabel = columns.find((c) => c.key === status)?.title ?? status;
    updateMutation.mutate(
      { id: draggedId, data: { status } },
      {
        onSuccess: () => toast.success(`Moved to ${statusLabel}`),
        onError: () => toast.error('Failed to update status'),
      }
    );
    setDraggedId(null);
    setDragOverColumn(null);
  };

  if (isLoading) {
    return (
      <div className="grid gap-4 xl:grid-cols-5">
        {columnKeys.map((key) => (
          <div key={key} className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <div className="mb-4 h-5 w-24 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="h-24 animate-pulse rounded-xl bg-gray-100 dark:bg-gray-700" />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 xl:grid-cols-5">
      {columns.map((column) => (
        <div
          key={column.key}
          onDragOver={(event) => {
            event.preventDefault();
            setDragOverColumn(column.key);
          }}
          onDragLeave={() => setDragOverColumn((current) => (current === column.key ? null : current))}
          onDrop={() => handleDrop(column.key)}
          className={clsx(
            'flex min-h-[420px] flex-col rounded-2xl border border-gray-200 bg-gray-50/80 p-3 shadow-sm transition dark:border-gray-700 dark:bg-gray-900/60',
            dragOverColumn === column.key && 'border-primary-400 bg-primary-50/70 ring-2 ring-primary-200 dark:border-primary-500 dark:bg-primary-950/20 dark:ring-primary-900/40'
          )}
        >
          <div className="mb-3 flex items-start justify-between">
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{column.title}</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">{column.description}</p>
            </div>
            <span className="rounded-full bg-white px-2.5 py-1 text-xs font-medium text-gray-600 shadow-sm dark:bg-gray-800 dark:text-gray-300">
              {groupedApplications[column.key].length}
            </span>
          </div>

          <div className="flex-1 space-y-3">
            {groupedApplications[column.key].length === 0 ? (
              <div className="flex h-24 items-center justify-center rounded-xl border border-dashed border-gray-200 bg-white/70 text-center text-sm text-gray-500 dark:border-gray-700 dark:bg-gray-800/70 dark:text-gray-400">
                {t('applications.kanban.dropHere')}
              </div>
            ) : (
              groupedApplications[column.key].map((application) => (
                <div
                  key={application.id}
                  draggable
                  onDragStart={() => setDraggedId(application.id)}
                  onDragEnd={() => setDraggedId(null)}
                  className={clsx(
                    'cursor-grab rounded-xl border border-gray-200 bg-white p-3 shadow-sm transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md dark:border-gray-700 dark:bg-gray-800',
                    draggedId === application.id && 'opacity-40 scale-95'
                  )}
                >
                  <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">{application.company}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{application.position}</p>
                  </div>

                  <div className="mt-3 space-y-1 text-xs text-gray-500 dark:text-gray-400">
                    <p>{t('applications.appliedOn', { date: formatDate(application.applicationDate) })}</p>
                    {application.location && <p>{application.location}</p>}
                    {application.salary ? <p>{formatSalary(application.salary)}</p> : null}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      ))}
    </div>
  );
};
