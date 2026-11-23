import React, { useEffect } from 'react';
import './ConfirmModal.css';

interface ConfirmModalProps {
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    isDestructive?: boolean;
    onConfirm: () => void;
    onCancel: () => void;
}

export function ConfirmModal({
    isOpen,
    title,
    message,
    confirmText = 'Confirmar',
    cancelText = 'Cancelar',
    isDestructive = false,
    onConfirm,
    onCancel,
}: ConfirmModalProps) {
    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onCancel();
        };
        window.addEventListener('keydown', handleKeyDown);
        document.body.classList.add('modal-open');

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            document.body.classList.remove('modal-open');
        };
    }, [isOpen, onCancel]);

    if (!isOpen) return null;

    return (
        <div className="confirm-modal-overlay" onClick={onCancel}>
            <div className="confirm-modal-box" onClick={(e) => e.stopPropagation()}>
                <h3 className="confirm-modal-title">{title}</h3>
                <p className="confirm-modal-message">{message}</p>

                <div className="confirm-modal-actions">
                    <button
                        type="button"
                        className="btn-modal-cancel"
                        onClick={onCancel}
                    >
                        {cancelText}
                    </button>
                    <button
                        type="button"
                        className={isDestructive ? 'btn-modal-danger' : 'btn-modal-confirm'}
                        onClick={onConfirm}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
}