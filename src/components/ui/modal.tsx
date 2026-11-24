import * as React from 'react';
import { X } from 'lucide-react';
import { Button } from './button';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
}) => {
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Soft translucent backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/20 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog Box */}
      <div className="relative w-full max-w-lg rounded-3xl border border-slate-100 bg-white shadow-2xl shadow-slate-900/10 z-10 overflow-hidden transform transition-all animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-[#181829]">{title}</h3>
            {description && (
              <p className="text-xs text-[#71758E] mt-0.5">{description}</p>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full -mr-2"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="p-6 text-sm text-slate-700">{children}</div>

        {footer && (
          <div className="flex items-center justify-end gap-2.5 p-4 sm:p-5 bg-slate-50/70 border-t border-slate-100">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};
