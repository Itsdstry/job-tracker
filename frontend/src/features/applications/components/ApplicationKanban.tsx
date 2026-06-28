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

const FOLLOWUP_DAYS = 7;
const needsFollowUp = (app: Application) => {
  if (app.status !== 'Applied') return false;
  const daysSinceUpdate = (Date.now() - new Date(app.updatedAt).getTime()) / (1000 * 60 * 60 * 24);
  return daysSinceUpdate > FOLLOWUP_DAYS;
};

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
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
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
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{application.company}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400 truncate">{application.position}</p>
                    </div>
                    {application.url && (
                      <a
                        href={application.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="flex-shrink-0 rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-primary-600 dark:hover:bg-gray-700 dark:hover:text-primary-400"
                        title={t('applications.kanban.viewPosting')}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </a>
                    )}
                  </div>

                  {needsFollowUp(application) && (
                    <div className="mt-2">
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {t('applications.kanban.followUp')}
                      </span>
                    </div>
                  )}
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
