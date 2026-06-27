import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useApplication, useUpdateApplication, useDeleteApplication } from '../features/applications/hooks/useApplications';
import { ApplicationForm } from '../features/applications/components/ApplicationForm';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Modal } from '../components/ui/Modal';
import { formatDate, formatSalary } from '../utils';

export const ApplicationDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const { data: app, isLoading } = useApplication(id!);
  const updateMutation = useUpdateApplication();
  const deleteMutation = useDeleteApplication();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!app) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500">Application not found.</p>
        <Button variant="ghost" className="mt-4" onClick={() => navigate('/applications')}>
          {t('common.back')}
        </Button>
      </div>
    );
  }

  const details = [
    { label: t('applicationDetail.location'), value: app.location || t('common.na') },
    { label: t('applicationDetail.salary'), value: formatSalary(app.salary) },
    { label: t('applicationDetail.applied'), value: formatDate(app.applicationDate) },
    { label: t('applicationDetail.added'), value: formatDate(app.createdAt) },
  ];

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <Button variant="ghost" size="sm" onClick={() => navigate('/applications')}>
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        {t('common.back')}
      </Button>

      <Card>
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">{app.position}</h2>
            <p className="text-gray-500 dark:text-gray-400 mt-0.5">{app.company}</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge status={app.status} />
            <Button variant="secondary" size="sm" onClick={() => setIsEditing(true)}>{t('common.edit')}</Button>
            <Button variant="danger" size="sm" onClick={() => setIsDeleteOpen(true)}>{t('common.delete')}</Button>
          </div>
        </div>

        <dl className="grid grid-cols-2 gap-4 text-sm">
          {details.map(({ label, value }) => (
            <div key={label}>
              <dt className="text-gray-500 dark:text-gray-400 font-medium">{label}</dt>
              <dd className="text-gray-900 dark:text-white mt-0.5">{value}</dd>
            </div>
          ))}
        </dl>

        {app.notes && (
          <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-700">
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">{t('applicationDetail.notes')}</p>
            <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{app.notes}</p>
          </div>
        )}
      </Card>

      <Modal isOpen={isEditing} onClose={() => setIsEditing(false)} title={t('applicationForm.editTitle')} size="lg">
        <ApplicationForm
          initialData={app}
          isLoading={updateMutation.isPending}
          onCancel={() => setIsEditing(false)}
          onSubmit={(data) =>
            updateMutation.mutate({ id: app.id, data }, { onSuccess: () => setIsEditing(false) })
          }
        />
      </Modal>

      <Modal isOpen={isDeleteOpen} onClose={() => setIsDeleteOpen(false)} title={t('common.delete')} size="sm">
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          {t('applicationDetail.deleteConfirm')}
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setIsDeleteOpen(false)}>{t('common.cancel')}</Button>
          <Button
            variant="danger"
            isLoading={deleteMutation.isPending}
            onClick={() =>
              deleteMutation.mutate(app.id, { onSuccess: () => navigate('/applications') })
            }
          >
            {t('common.delete')}
          </Button>
        </div>
      </Modal>
    </div>
  );
};
