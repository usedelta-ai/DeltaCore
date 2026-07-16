import React from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { Button } from './Button';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  maxWidth?: string;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = '560px',
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-5">
      <div
        className="w-full bg-white border border-border-low-contrast rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        style={{ maxWidth }}
      >
        <div className="flex justify-between items-center px-6 py-5 border-b border-border-low-contrast">
          <h2 className="text-headline-md font-headline-md font-bold m-0">{title}</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg border-none cursor-pointer text-on-surface-variant hover:bg-surface-container transition-colors"
          >
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
};

// ----- Confirmation Modal (existing pattern) -----

interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onClose: () => void;
  disabled?: boolean;
  variant?: 'danger' | 'primary';
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  title,
  description,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  onConfirm,
  onClose,
  disabled = false,
  variant = 'danger',
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-5">
      <div className="w-full max-w-[420px] bg-white border border-border-low-contrast rounded-2xl shadow-2xl p-6">
        <div className="flex gap-4 items-start mb-5">
          <div className="bg-status-critical/10 p-3 rounded-full text-status-critical flex items-center justify-center flex-shrink-0">
            <AlertTriangle size={28} />
          </div>
          <div>
            <h2 className="text-headline-md font-headline-md font-bold m-0">{title}</h2>
            <p className="text-body-md text-on-surface-variant mt-2 mb-0">{description}</p>
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <Button variant="secondary" onClick={onClose} disabled={disabled}>
            {cancelText}
          </Button>
          <Button variant={variant} onClick={onConfirm} disabled={disabled}>
            {confirmText}
          </Button>
        </div>
      </div>
    </div>
  );
};
