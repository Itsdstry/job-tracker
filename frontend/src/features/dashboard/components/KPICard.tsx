import { ReactNode } from 'react';
import clsx from 'clsx';
import { Card } from '../../../components/ui/Card';

interface KPICardProps {
  title: string;
  value: number | string;
  icon: ReactNode;
  color: 'blue' | 'yellow' | 'green' | 'red' | 'purple';
  subtitle?: string;
}

const COLOR_MAP = {
  blue: {
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    icon: 'text-blue-600 dark:text-blue-400',
    value: 'text-blue-600 dark:text-blue-400',
  },
  yellow: {
    bg: 'bg-yellow-50 dark:bg-yellow-900/20',
    icon: 'text-yellow-600 dark:text-yellow-400',
    value: 'text-yellow-600 dark:text-yellow-400',
  },
  green: {
    bg: 'bg-green-50 dark:bg-green-900/20',
    icon: 'text-green-600 dark:text-green-400',
    value: 'text-green-600 dark:text-green-400',
  },
  red: {
    bg: 'bg-red-50 dark:bg-red-900/20',
    icon: 'text-red-600 dark:text-red-400',
    value: 'text-red-600 dark:text-red-400',
  },
  purple: {
    bg: 'bg-purple-50 dark:bg-purple-900/20',
    icon: 'text-purple-600 dark:text-purple-400',
    value: 'text-purple-600 dark:text-purple-400',
  },
};

export const KPICard = ({ title, value, icon, color, subtitle }: KPICardProps) => {
  const colors = COLOR_MAP[color];

  return (
    <Card className="flex items-center gap-4">
      <div className={clsx('w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0', colors.bg)}>
        <span className={colors.icon}>{icon}</span>
      </div>
      <div>
        <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">{title}</p>
        <p className={clsx('text-2xl font-bold', colors.value)}>{value}</p>
        {subtitle && <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{subtitle}</p>}
      </div>
    </Card>
  );
};
