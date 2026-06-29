import React from 'react';
import { X } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from './Card';

interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footerActions?: React.ReactNode;
  side?: 'left' | 'right';
}

export const Drawer = ({
  isOpen,
  onClose,
  title,
  children,
  footerActions,
  side = 'right',
}: DrawerProps) => {
  if (!isOpen) return null;

  const sideClasses = {
    left: 'left-0 h-full w-96 animate-in slide-in-from-left duration-200',
    right: 'right-0 h-full w-96 animate-in slide-in-from-right duration-200',
  };

  return (
    <div className="fixed inset-0 z-50 flex bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="fixed inset-0" onClick={onClose} />
      <Card
        className={`fixed z-10 flex flex-col bg-card border-y-0 rounded-none shadow-2xl ${sideClasses[side]} border-${side === 'left' ? 'r' : 'l'} border-border`}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-muted-foreground/60 hover:text-foreground hover:bg-accent rounded-lg transition-colors"
          aria-label="Close drawer"
        >
          <X className="w-4 h-4" />
        </button>

        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>

        <CardContent className="flex-1 overflow-y-auto pt-6">{children}</CardContent>

        {footerActions && (
          <CardFooter className="justify-end gap-3 mt-auto">{footerActions}</CardFooter>
        )}
      </Card>
    </div>
  );
};

export default Drawer;
