import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'info' | 'destructive';
}

export const Badge = ({ className, variant = 'default', ...props }: BadgeProps) => {
  return (
    <span
      className={twMerge(
        clsx(
          'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
          {
            'bg-secondary text-secondary-foreground hover:bg-secondary/80': variant === 'default',
            'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20': variant === 'success',
            'bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20': variant === 'warning',
            'bg-primary/10 text-primary hover:bg-primary/20': variant === 'info',
            'bg-destructive/10 text-destructive hover:bg-destructive/20': variant === 'destructive',
          },
        ),
        className,
      )}
      {...props}
    />
  );
};

export default Badge;
