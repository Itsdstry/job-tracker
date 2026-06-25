import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { authService } from '../services/auth.service';

export const ResetPassword = () => {
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
      toast.error('Missing reset token');
      return;
    }
    if (!isValid) {
      toast.error('Passwords must match and be at least 8 characters');
      return;
    }

    setIsLoading(true);
    try {
      await authService.resetPassword(token, password);
      setDone(true);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Could not reset password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top_left,_rgba(99,102,241,0.15),_transparent_40%),linear-gradient(135deg,_#f8fafc_0%,_#eef2ff_100%)] p-4 dark:bg-[radial-gradient(circle_at_top_left,_rgba(129,140,248,0.2),_transparent_35%),linear-gradient(135deg,_#020617_0%,_#111827_100%)]">
      <div className="w-full max-w-md">
        <div className="rounded-3xl border border-gray-200 bg-white/90 p-8 shadow-xl backdrop-blur dark:border-gray-700 dark:bg-gray-800/90">
          <h2 className="mb-2 text-xl font-bold text-gray-900 dark:text-white">Set a new password</h2>
          {done ? (
            <div className="space-y-3 py-4 text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">Your password was updated successfully.</p>
              <Link to="/login" className="inline-block text-sm text-primary-600 hover:underline">
                Go to login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <p className="text-sm text-gray-500 dark:text-gray-400">Choose a new password for your account.</p>
              <Input
                label="New password"
                type="password"
                placeholder="Min. 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
              />
              <Input
                label="Confirm password"
                type="password"
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
              />
              <Button type="submit" className="w-full" isLoading={isLoading} disabled={!isValid}>
                Update password
              </Button>
              <Link to="/login" className="block text-center text-sm text-primary-600 hover:underline">
                Back to login
              </Link>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
