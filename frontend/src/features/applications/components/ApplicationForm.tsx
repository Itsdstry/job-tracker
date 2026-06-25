import { useState, useEffect } from 'react';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import { Select } from '../../../components/ui/Select';
import { Textarea } from '../../../components/ui/Textarea';
import { Application, ApplicationFormData, ApplicationStatus } from '../../../types';
import { ALL_STATUSES, STATUS_LABELS } from '../../../utils';

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
  notes: '',
  applicationDate: new Date().toISOString().split('T')[0],
  status: 'Applied',
};

const statusOptions = ALL_STATUSES.map((s) => ({ value: s, label: STATUS_LABELS[s] }));

export const ApplicationForm = ({ initialData, onSubmit, onCancel, isLoading }: ApplicationFormProps) => {
  const [form, setForm] = useState<ApplicationFormData>(defaultForm);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (initialData) {
      setForm({
        company: initialData.company,
        position: initialData.position,
        salary: initialData.salary?.toString() || '',
        location: initialData.location || '',
        notes: initialData.notes || '',
        applicationDate: initialData.applicationDate.split('T')[0],
        status: initialData.status,
      });
    }
  }, [initialData]);

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.company.trim()) errs.company = 'Company is required';
    if (!form.position.trim()) errs.position = 'Position is required';
    if (form.salary && isNaN(parseFloat(form.salary))) errs.salary = 'Invalid salary';
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
        <Input label="Company *" placeholder="Google" value={form.company} onChange={set('company')} error={errors.company} />
        <Input label="Position *" placeholder="Software Engineer" value={form.position} onChange={set('position')} error={errors.position} />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input label="Salary (USD)" type="number" placeholder="75000" value={form.salary} onChange={set('salary')} error={errors.salary} />
        <Input label="Location" placeholder="Remote / NYC" value={form.location} onChange={set('location')} />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input label="Application Date" type="date" value={form.applicationDate} onChange={set('applicationDate')} />
        <Select
          label="Status"
          options={statusOptions}
          value={form.status}
          onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as ApplicationStatus }))}
        />
      </div>
      <Textarea label="Notes" placeholder="Interview notes, contacts, next steps..." value={form.notes} onChange={set('notes')} />
      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
        <Button type="submit" isLoading={isLoading}>
          {initialData ? 'Save Changes' : 'Add Application'}
        </Button>
      </div>
    </form>
  );
};
