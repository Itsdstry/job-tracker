import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import { Select } from '../../../components/ui/Select';
import { Textarea } from '../../../components/ui/Textarea';
import { Application, ApplicationFormData, ApplicationStatus } from '../../../types';
import { ALL_STATUSES } from '../../../utils';

interface ApplicationFormProps {
  initialData?: Application;
  onSubmit: (data: ApplicationFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

const defaultForm: ApplicationFormData = {
  company: '',
  position: '',
  salary: '',
  location: '',
  url: '',
  notes: '',
  applicationDate: new Date().toISOString().split('T')[0],
  status: 'Applied',
};

export const ApplicationForm = ({ initialData, onSubmit, onCancel, isLoading }: ApplicationFormProps) => {
  const { t } = useTranslation();
  const [form, setForm] = useState<ApplicationFormData>(defaultForm);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const statusOptions = ALL_STATUSES.map((s) => ({ value: s, label: t(`status.${s}`) }));

  useEffect(() => {
    if (initialData) {
      setForm({
        company: initialData.company,
        position: initialData.position,
        salary: initialData.salary?.toString() || '',
        location: initialData.location || '',
        notes: initialData.notes || '',
        url: initialData.url || '',
        applicationDate: initialData.applicationDate.split('T')[0],
        status: initialData.status,
      });
    }
  }, [initialData]);

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.company.trim()) errs.company = t('applicationForm.errors.companyRequired');
    if (!form.position.trim()) errs.position = t('applicationForm.errors.positionRequired');
    if (form.salary && isNaN(parseFloat(form.salary))) errs.salary = t('applicationForm.errors.invalidSalary');
    return errs;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    onSubmit(form);
  };

  const set = (field: keyof ApplicationFormData) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => setForm((f) => ({ ...f, [field]: e.target.value }));

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input label={`${t('applicationForm.company')} *`} placeholder={t('applicationForm.placeholders.company')} value={form.company} onChange={set('company')} error={errors.company} />
        <Input label={`${t('applicationForm.position')} *`} placeholder={t('applicationForm.placeholders.position')} value={form.position} onChange={set('position')} error={errors.position} />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input label={t('applicationForm.salary')} type="number" placeholder={t('applicationForm.placeholders.salary')} value={form.salary} onChange={set('salary')} error={errors.salary} />
        <Input label={t('applicationForm.location')} placeholder={t('applicationForm.placeholders.location')} value={form.location} onChange={set('location')} />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input label={t('applicationForm.applicationDate')} type="date" value={form.applicationDate} onChange={set('applicationDate')} />
        <Select
          label={t('applicationForm.status')}
          options={statusOptions}
          value={form.status}
          onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as ApplicationStatus }))}
        />
      </div>
      <Input label={t('applicationForm.url')} type="url" placeholder={t('applicationForm.placeholders.url')} value={form.url} onChange={set('url')} />
      <Textarea label={t('applicationForm.notes')} placeholder={t('applicationForm.placeholders.notes')} value={form.notes} onChange={set('notes')} />
      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel}>{t('common.cancel')}</Button>
        <Button type="submit" isLoading={isLoading}>
          {initialData ? t('applicationForm.saveChanges') : t('applicationForm.addApplication')}
        </Button>
      </div>
    </form>
  );
};
