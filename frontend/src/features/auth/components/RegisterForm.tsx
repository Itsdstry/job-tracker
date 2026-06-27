import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import { useAuth } from '../../../context/AuthContext';
import { authService } from '../../../services/auth.service';

export const RegisterForm = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.name || form.name.length < 2) errs.name = t('auth.register.errors.nameMin');
    if (!form.email) errs.email = t('auth.register.errors.emailInvalid');
    if (!form.password || form.password.length < 8) errs.password = t('auth.register.errors.passwordMin');
    return errs;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    setIsLoading(true);
    try {
      const data = await authService.register(form);
      login(data.accessToken, data.refreshToken, data.user);
      toast.success(t('auth.register.created'));
      navigate('/dashboard');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label={t('auth.register.fullName')}
        type="text"
        placeholder="John Doe"
        value={form.name}
        onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
        error={errors.name}
        autoComplete="name"
      />
      <Input
        label={t('auth.register.email')}
        type="email"
        placeholder="you@example.com"
        value={form.email}
        onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
        error={errors.email}
        autoComplete="email"
      />
      <Input
        label={t('auth.register.password')}
        type="password"
        placeholder={t('auth.register.passwordHint')}
        value={form.password}
        onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
        error={errors.password}
        autoComplete="new-password"
        hint={t('auth.register.passwordHint')}
      />
      <Button type="submit" className="w-full" size="lg" isLoading={isLoading}>
        {t('auth.register.createAccount')}
      </Button>
      <p className="text-center text-sm text-gray-600 dark:text-gray-400">
        {t('auth.register.hasAccount')}{' '}
        <Link to="/login" className="text-primary-600 hover:underline font-medium">
          {t('auth.register.signIn')}
        </Link>
      </p>
    </form>
  );
};
