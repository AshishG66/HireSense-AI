import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = 'text', label, error, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5 w-full">
        {label && (
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {label}
          </label>
        )}
        <input
          ref={ref}
          type={type}
          className={twMerge(
            clsx(
              'w-full px-4 py-2.5 rounded-lg border bg-card text-foreground placeholder-muted-foreground/50 text-sm transition-all duration-200 focus:outline-none focus:ring-2',
              {
                'border-border focus:border-primary focus:ring-ring/25': !error,
                'border-destructive focus:border-destructive focus:ring-destructive/20': error,
              },
            ),
            className,
          )}
          {...props}
        />
        {error && <span className="text-xs text-destructive font-medium">{error}</span>}
      </div>
    );
  },
);

Input.displayName = 'Input';
export default Input;
