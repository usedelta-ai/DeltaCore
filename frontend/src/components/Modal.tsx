import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onClose: () => void;
  disabled?: boolean;
}

export const ConfirmationModal: React.FC<ModalProps> = ({
  isOpen,
  title,
  description,
  confirmText = 'Inativar',
  cancelText = 'Cancelar',
  onConfirm,
  onClose,
  disabled = false,
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start', marginBottom: '20px' }}>
          <div style={{
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            padding: '12px',
            borderRadius: '50%',
            color: '#ef4444',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <AlertTriangle size={28} />
          </div>
          <div>
            <h2 className="modal-title" style={{ margin: 0, fontSize: '20px' }}>{title}</h2>
            <p className="modal-description" style={{ marginTop: '8px', marginBottom: 0 }}>
              {description}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
          <button className="btn btn-secondary" onClick={onClose} disabled={disabled}>
            {cancelText}
          </button>
          <button className="btn btn-danger" onClick={onConfirm} disabled={disabled}>
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};
