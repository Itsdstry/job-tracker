import { HTMLAttributes, ReactNode } from 'react';
import clsx from 'clsx';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export const Card = ({ children, padding = 'md', className, ...props }: CardProps) => {
  return (
    <div
      className={clsx(
        'bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm',
        {
          'p-0': padding === 'none',
          'p-3 sm:p-4': padding === 'sm',
          'p-4 sm:p-6': padding === 'md',
          'p-5 sm:p-8': padding === 'lg',
        },
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};
