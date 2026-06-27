import clsx from 'clsx';
import { useTranslation } from 'react-i18next';
import { ApplicationStatus } from '../../types';
import { STATUS_COLORS } from '../../utils';

interface BadgeProps {
  status: ApplicationStatus;
  className?: string;
}

export const Badge = ({ status, className }: BadgeProps) => {
  const { t } = useTranslation();
  return (
    <span
      className={clsx(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
        STATUS_COLORS[status],
        className
      )}
    >
      {t(`status.${status}`)}
    </span>
  );
};
