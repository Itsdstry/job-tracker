import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import { useAuth } from '../../../context/AuthContext';
import { authService } from '../../../services/auth.service';

export const LoginForm = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.email) errs.email = t('auth.login.emailRequired');
    if (!form.password) errs.password = t('auth.login.passwordRequired');
    return errs;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    setIsLoading(true);
    try {
      const data = await authService.login(form);
      login(data.accessToken, data.refreshToken, data.user);
      toast.success(t('auth.login.welcome', { name: data.user.name }));
      navigate('/dashboard');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label={t('auth.login.email')}
        type="email"
        placeholder="you@example.com"
        value={form.email}
        onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
        error={errors.email}
        autoComplete="email"
      />
      <Input
        label={t('auth.login.password')}
        type="password"
        placeholder="••••••••"
        value={form.password}
        onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
        error={errors.password}
        autoComplete="current-password"
      />
      <div className="flex items-center justify-end">
        <Link to="/forgot-password" className="text-xs text-primary-600 hover:underline">
          {t('auth.login.forgotPassword')}
        </Link>
      </div>
      <Button type="submit" className="w-full" size="lg" isLoading={isLoading}>
        {t('auth.login.signIn')}
      </Button>
      <p className="text-center text-sm text-gray-600 dark:text-gray-400">
        {t('auth.login.noAccount')}{' '}
        <Link to="/register" className="text-primary-600 hover:underline font-medium">
          {t('auth.login.signUp')}
        </Link>
      </p>
    </form>
  );
};
