import { ApplicationStatus } from '../types';

export const formatDate = (date: string, locale?: string): string => {
  return new Date(date).toLocaleDateString(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

export const formatMonth = (month: string, locale?: string): string => {
  const [year, m] = month.split('-');
  const date = new Date(Number(year), Number(m) - 1);
  return date.toLocaleDateString(locale, { month: 'short', year: '2-digit' });
};

export const formatSalary = (salary: number | null): string => {
  if (!salary) return '—';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(salary);
};

export const STATUS_COLORS: Record<ApplicationStatus, string> = {
  Applied: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  Interview: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  TechnicalTest: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  Offer: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  Rejected: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
};

export const STATUS_CHART_COLORS: Record<string, string> = {
  Applied: '#6366f1',
  Interview: '#f59e0b',
  TechnicalTest: '#8b5cf6',
  Offer: '#10b981',
  Rejected: '#ef4444',
};

export const ALL_STATUSES: ApplicationStatus[] = [
  'Applied',
  'Interview',
  'TechnicalTest',
  'Offer',
  'Rejected',
];

export const getInitials = (name: string): string => {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};
