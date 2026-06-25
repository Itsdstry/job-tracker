import clsx from 'clsx';
import { ApplicationStatus } from '../../types';
import { STATUS_COLORS, STATUS_LABELS } from '../../utils';

interface BadgeProps {
  status: ApplicationStatus;
  className?: string;
}

export const Badge = ({ status, className }: BadgeProps) => {
  return (
    <span
      className={clsx(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
        STATUS_COLORS[status],
        className
      )}
    >
      {STATUS_LABELS[status]}
    </span>
  );
};
