import { useMemo, useState } from 'react';
import clsx from 'clsx';
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

    updateMutation.mutate({ id: draggedId, data: { status } });
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
                  className="cursor-grab rounded-xl border border-gray-200 bg-white p-3 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-gray-700 dark:bg-gray-800"
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
