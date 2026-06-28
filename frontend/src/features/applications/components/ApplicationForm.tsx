import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import { Select } from '../../../components/ui/Select';
import { Textarea } from '../../../components/ui/Textarea';
import { Application, ApplicationFormData, ApplicationStatus, ApiResponse } from '../../../types';
import { ALL_STATUSES } from '../../../utils';
import { api } from '../../../services/api';

interface ScrapedJob {
  company: string | null;
  position: string | null;
  location: string | null;
  salary: string | null;
}

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
  const [scraping, setScraping] = useState(false);

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

  const handleAutoFill = async () => {
    if (!form.url) {
      toast.error(t('applicationForm.autofill.noUrl'));
      return;
    }
    setScraping(true);
    try {
      const res = await api.post<ApiResponse<ScrapedJob>>('/scrape', { url: form.url });
      const data = res.data.data;
      const filled: Partial<ApplicationFormData> = {};
      if (data.company && !form.company) filled.company = data.company;
      if (data.position && !form.position) filled.position = data.position;
      if (data.location && !form.location) filled.location = data.location;
      if (data.salary && !form.salary) filled.salary = data.salary;

      if (Object.keys(filled).length === 0) {
        toast(t('applicationForm.autofill.noData'), { icon: '⚠️' });
      } else {
        setForm((f) => ({ ...f, ...filled }));
        toast.success(t('applicationForm.autofill.success'));
      }
    } catch {
      toast.error(t('applicationForm.autofill.error'));
    } finally {
      setScraping(false);
    }
  };

  const set = (field: keyof ApplicationFormData) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => setForm((f) => ({ ...f, [field]: e.target.value }));

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* URL field with auto-fill button */}
      <div className="flex gap-2 items-end">
        <div className="flex-1">
          <Input
            label={t('applicationForm.url')}
            type="url"
            placeholder={t('applicationForm.placeholders.url')}
            value={form.url}
            onChange={set('url')}
          />
        </div>
        <button
          type="button"
          onClick={handleAutoFill}
          disabled={scraping || !form.url}
          className="mb-0.5 inline-flex items-center gap-1.5 rounded-xl border border-primary-300 bg-primary-50 px-3 py-2.5 text-sm font-medium text-primary-700 transition hover:bg-primary-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-primary-700 dark:bg-primary-900/20 dark:text-primary-300 dark:hover:bg-primary-900/40"
          title={t('applicationForm.autofill.button')}
        >
          {scraping ? (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-600 border-t-transparent" />
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          )}
          {t('applicationForm.autofill.button')}
        </button>
      </div>

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
