import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { authService } from '../services/auth.service';
import { useAuth } from '../context/AuthContext';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { formatDate, getInitials } from '../utils';

export const Profile = () => {
  const { t } = useTranslation();
  const { updateUser } = useAuth();
  const qc = useQueryClient();

  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: authService.getProfile,
  });

  const [nameForm, setNameForm] = useState({ name: '' });
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '' });

  const updateMutation = useMutation({
    mutationFn: authService.updateProfile,
    onSuccess: (updated) => {
      updateUser(updated);
      qc.invalidateQueries({ queryKey: ['profile'] });
      toast.success(t('profile.updated'));
      setNameForm({ name: '' });
      setPwForm({ currentPassword: '', newPassword: '' });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Update failed');
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Profile overview */}
      <Card>
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="w-14 h-14 sm:w-16 sm:h-16 shrink-0 bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 rounded-full flex items-center justify-center text-xl font-bold">
            {profile ? getInitials(profile.name) : '?'}
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white truncate">{profile?.name}</h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm truncate">{profile?.email}</p>
            <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">
              {t('profile.memberSince', { date: profile ? formatDate(profile.createdAt) : '—' })}
            </p>
          </div>
          <div className="shrink-0 text-right">
            <p className="text-xl sm:text-2xl font-bold text-primary-600 dark:text-primary-400">
              {profile?._count?.applications ?? 0}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{t('nav.applications')}</p>
          </div>
        </div>
      </Card>

      {/* Update name */}
      <Card>
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">{t('profile.updateName')}</h3>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (nameForm.name) updateMutation.mutate({ name: nameForm.name });
          }}
          className="space-y-4"
        >
          <Input
            label={t('profile.newName')}
            placeholder={profile?.name}
            value={nameForm.name}
            onChange={(e) => setNameForm({ name: e.target.value })}
          />
          <div className="flex justify-end">
            <Button type="submit" isLoading={updateMutation.isPending} disabled={!nameForm.name}>
              {t('profile.saveName')}
            </Button>
          </div>
        </form>
      </Card>

      {/* Change password */}
      <Card>
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">{t('profile.changePassword')}</h3>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (pwForm.currentPassword && pwForm.newPassword) {
              updateMutation.mutate(pwForm);
            }
          }}
          className="space-y-4"
        >
          <Input
            label={t('profile.currentPassword')}
            type="password"
            value={pwForm.currentPassword}
            onChange={(e) => setPwForm((f) => ({ ...f, currentPassword: e.target.value }))}
            autoComplete="current-password"
          />
          <Input
            label={t('profile.newPassword')}
            type="password"
            value={pwForm.newPassword}
            onChange={(e) => setPwForm((f) => ({ ...f, newPassword: e.target.value }))}
            hint={t('profile.passwordHint')}
            autoComplete="new-password"
          />
          <div className="flex justify-end">
            <Button
              type="submit"
              isLoading={updateMutation.isPending}
              disabled={!pwForm.currentPassword || !pwForm.newPassword}
            >
              {t('profile.changePassword')}
            </Button>
          </div>
        </form>
      </Card>

      {/* Email reminders */}
      <Card>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              {t('profile.reminders.title')}
            </h3>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              {t('profile.reminders.description')}
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={profile?.emailReminders ?? false}
            disabled={updateMutation.isPending}
            onClick={() =>
              profile &&
              updateMutation.mutate({ emailReminders: !profile.emailReminders })
            }
            className={`relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${
              profile?.emailReminders
                ? 'bg-primary-600 cursor-pointer'
                : 'bg-gray-200 dark:bg-gray-600 cursor-pointer'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition-transform ${
                profile?.emailReminders ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </Card>
    </div>
  );
};
