import React from 'react';
import { X } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from './Card';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footerActions?: React.ReactNode;
}

export const Modal = ({ isOpen, onClose, title, children, footerActions }: ModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="fixed inset-0" onClick={onClose} />
      <Card className="w-full max-w-lg border border-border shadow-2xl relative animate-in zoom-in-95 duration-200 bg-card z-10">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-muted-foreground/60 hover:text-foreground hover:bg-accent rounded-lg transition-colors"
          aria-label="Close modal"
        >
          <X className="w-4 h-4" />
        </button>

        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>

        <CardContent className="pt-6">{children}</CardContent>

        {footerActions && <CardFooter className="justify-end gap-3">{footerActions}</CardFooter>}
      </Card>
    </div>
  );
};

export default Modal;
