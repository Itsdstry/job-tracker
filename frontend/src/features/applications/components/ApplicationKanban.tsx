import { useMemo, useState } from 'react';
import clsx from 'clsx';
import toast from 'react-hot-toast';
import { useUpdateApplication } from '../hooks/useApplications';
import { Application, ApplicationStatus } from '../../../types';
import { formatDate, formatSalary } from '../../../utils';

const columns: Array<{ key: ApplicationStatus; title: string; description: string }> = [
  { key: 'Applied', title: 'Applied', description: 'Fresh opportunities' },
  { key: 'Interview', title: 'Interview', description: 'In discussion' },
  { key: 'TechnicalTest', title: 'Technical Test', description: 'Assessments' },
  { key: 'Offer', title: 'Offer', description: 'Positive signals' },
  { key: 'Rejected', title: 'Rejected', description: 'Closed loses' },
];

interface ApplicationKanbanProps {
  applications: Application[];
  isLoading: boolean;
}

export const ApplicationKanban = ({ applications, isLoading }: ApplicationKanbanProps) => {
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<ApplicationStatus | null>(null);
  const updateMutation = useUpdateApplication();

  const groupedApplications = useMemo(() => {
    return columns.reduce((acc, column) => {
      acc[column.key] = applications.filter((application) => application.status === column.key);
      return acc;
    }, {} as Record<ApplicationStatus, Application[]>);
  }, [applications]);

  const handleDrop = (status: ApplicationStatus) => {
    if (!draggedId) return;

    const targetApplication = applications.find((application) => application.id === draggedId);
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
        {columns.map((column) => (
          <div key={column.key} className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
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

  if (applications.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-16 h-16 rounded-full bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
          </svg>
        </div>
        <p className="font-medium text-gray-900 dark:text-white">No applications to show</p>
        <p className="mt-1 text-sm text-gray-400 dark:text-gray-500">Add an application and it will appear here on the board</p>
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
                Drop here
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
                    <p>Applied {formatDate(application.applicationDate)}</p>
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
