import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { twMerge } from 'tailwind-merge';

interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'info';
  onClose: () => void;
  className?: string;
}

export const Toast = ({ message, type = 'success', onClose, className }: ToastProps) => {
  const icons = {
    success: <CheckCircle className="w-5 h-5 text-emerald-500" />,
    error: <AlertCircle className="w-5 h-5 text-destructive" />,
    info: <Info className="w-5 h-5 text-primary" />,
  };

  const borderColors = {
    success: 'border-emerald-500/25',
    error: 'border-destructive/25',
    info: 'border-primary/25',
  };

  return (
    <div
      className={twMerge(
        'flex items-center gap-3 px-4 py-3 rounded-xl border bg-card text-foreground shadow-lg animate-in slide-in-from-bottom-5 fade-in duration-200',
        borderColors[type],
        className,
      )}
      role="alert"
    >
      {icons[type]}
      <span className="text-sm font-medium">{message}</span>
      <button
        onClick={onClose}
        className="ml-auto p-1 text-muted-foreground/60 hover:text-foreground hover:bg-accent rounded-lg transition-colors"
        aria-label="Close alert"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

export default Toast;
