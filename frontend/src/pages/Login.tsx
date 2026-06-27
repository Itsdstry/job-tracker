import { useTranslation } from 'react-i18next';
import { LoginForm } from '../features/auth/components/LoginForm';

export const Login = () => {
  const { t } = useTranslation();

  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top_left,_rgba(99,102,241,0.15),_transparent_40%),linear-gradient(135deg,_#f8fafc_0%,_#eef2ff_100%)] p-4 dark:bg-[radial-gradient(circle_at_top_left,_rgba(129,140,248,0.2),_transparent_35%),linear-gradient(135deg,_#020617_0%,_#111827_100%)]">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-600 to-violet-500 shadow-lg">
            <svg className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Job Tracker Pro</h1>
          <p className="mt-1 text-gray-500 dark:text-gray-400">{t('auth.login.title')}</p>
        </div>
        <div className="rounded-3xl border border-gray-200 bg-white/90 p-8 shadow-xl backdrop-blur dark:border-gray-700 dark:bg-gray-800/90">
          <LoginForm />
        </div>
      </div>
    </div>
  );
};
