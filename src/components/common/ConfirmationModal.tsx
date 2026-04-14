import React from 'react';
import { FiAlertTriangle } from 'react-icons/fi';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = '삭제',
  cancelText = '취소',
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-6 text-center"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
          <FiAlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" aria-hidden="true" />
        </div>
        <div className="mt-3">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">{title}</h3>
          <div className="mt-2">
            <p className="text-sm text-gray-500 dark:text-gray-400">{message}</p>
          </div>
        </div>
        <div className="mt-6 flex justify-center gap-3">
          <button type="button" className="px-6 py-2.5 text-sm font-semibold text-gray-700 bg-gray-100 dark:text-gray-300 dark:bg-gray-700 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors" onClick={onClose}>{cancelText}</button>
          <button type="button" className="px-6 py-2.5 text-sm font-bold text-white bg-red-600 rounded-xl hover:bg-red-700 transition-colors shadow-md" onClick={() => { onConfirm(); onClose(); }}>{confirmText}</button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;