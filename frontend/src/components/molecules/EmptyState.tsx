import React from 'react';
import { Sparkles } from 'lucide-react';
import Button from '../atoms/Button';

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
  actionText?: string;
  onAction?: () => void;
}

export const EmptyState = ({ title, description, icon, actionText, onAction }: EmptyStateProps) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center rounded-2xl border border-dashed border-border bg-card/30 max-w-lg mx-auto min-h-[300px] select-none">
      <div className="w-12 h-12 rounded-full bg-secondary border border-border flex items-center justify-center mb-4 text-muted-foreground">
        {icon || <Sparkles className="w-5 h-5 text-primary" />}
      </div>
      <h3 className="text-lg font-bold font-display text-foreground mb-1.5">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-sm mb-6 leading-relaxed">{description}</p>
      {actionText && onAction && (
        <Button variant="primary" onClick={onAction}>
          {actionText}
        </Button>
      )}
    </div>
  );
};

export default EmptyState;
