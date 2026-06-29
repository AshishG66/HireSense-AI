import React from 'react';
import { twMerge } from 'tailwind-merge';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, options, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5 w-full">
        {label && (
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {label}
          </label>
        )}
        <select
          ref={ref}
          className={twMerge(
            'w-full px-4 py-2.5 rounded-lg border border-border bg-card text-foreground text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ring/25 focus:border-primary disabled:opacity-50 disabled:cursor-not-allowed',
            error && 'border-destructive focus:border-destructive focus:ring-destructive/20',
            className,
          )}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} className="bg-card text-foreground">
              {opt.label}
            </option>
          ))}
        </select>
        {error && <span className="text-xs text-destructive font-medium">{error}</span>}
      </div>
    );
  },
);

Select.displayName = 'Select';
export default Select;
