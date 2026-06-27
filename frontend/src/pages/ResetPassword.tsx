import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { authService } from '../services/auth.service';

export const ResetPassword = () => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [done, setDone] = useState(false);

  const isValid = useMemo(() => password.length >= 8 && password === confirmPassword, [password, confirmPassword]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      toast.error(t('auth.resetPassword.errors.invalidToken'));
      return;
    }
    if (!isValid) {
      toast.error(t('auth.resetPassword.errors.passwordsMustMatch'));
      return;
    }

    setIsLoading(true);
    try {
      await authService.resetPassword(token, password);
      setDone(true);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || t('auth.resetPassword.errors.invalidToken'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top_left,_rgba(99,102,241,0.15),_transparent_40%),linear-gradient(135deg,_#f8fafc_0%,_#eef2ff_100%)] p-4 dark:bg-[radial-gradient(circle_at_top_left,_rgba(129,140,248,0.2),_transparent_35%),linear-gradient(135deg,_#020617_0%,_#111827_100%)]">
      <div className="w-full max-w-md">
        <div className="rounded-3xl border border-gray-200 bg-white/90 p-8 shadow-xl backdrop-blur dark:border-gray-700 dark:bg-gray-800/90">
          <h2 className="mb-2 text-xl font-bold text-gray-900 dark:text-white">{t('auth.resetPassword.title')}</h2>
          {done ? (
            <div className="space-y-3 py-4 text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">{t('auth.resetPassword.success')}</p>
              <Link to="/login" className="inline-block text-sm text-primary-600 hover:underline">
                {t('auth.resetPassword.backToLogin')}
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <p className="text-sm text-gray-500 dark:text-gray-400">{t('auth.resetPassword.description')}</p>
              <Input
                label={t('auth.resetPassword.newPassword')}
                type="password"
                placeholder={t('auth.resetPassword.passwordHint')}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
              />
              <Input
                label={t('auth.resetPassword.confirmPassword')}
                type="password"
                placeholder={t('auth.resetPassword.confirmPassword')}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
              />
              <Button type="submit" className="w-full" isLoading={isLoading} disabled={!isValid}>
                {t('auth.resetPassword.update')}
              </Button>
              <Link to="/login" className="block text-center text-sm text-primary-600 hover:underline">
                {t('auth.resetPassword.backToLogin')}
              </Link>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
