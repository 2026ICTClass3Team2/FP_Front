import React, { useEffect, useRef } from 'react';
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
  // 클릭 시작 지점을 추적하기 위한 ref
  const mouseDownTarget = useRef<EventTarget | null>(null);

  // ESC 키 감지 로직
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleEscape);
    }
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // 마우스 누를 때 타겟 저장
  const handleMouseDown = (e: React.MouseEvent) => {
    mouseDownTarget.current = e.target;
  };

  // 마우스 뗄 때 조건 확인 (시작과 끝이 모두 배경일 때만 닫기)
  const handleMouseUp = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && mouseDownTarget.current === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 transition-all"
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
    >
      <div
        className="bg-background w-full max-w-2xl rounded-2xl p-6 shadow-2xl border border-border max-h-[90vh] overflow-y-auto text-center [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
        onMouseDown={(e) => e.stopPropagation()}
        onMouseUp={(e) => e.stopPropagation()}
      >
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30 mb-3">
          <FiAlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" aria-hidden="true" />
        </div>
        <div className="mb-2">
          <h2 className="text-xl font-bold text-foreground">{title}</h2>
        </div>
        <div className="mb-6">
          <p className="text-base text-muted-foreground">{message}</p>
        </div>
        <div className="flex justify-center gap-3">
          <button
            type="button"
            className="px-6 py-2.5 text-sm font-semibold text-muted-foreground bg-muted rounded-xl hover:bg-accent hover:text-foreground transition-colors border border-border"
            onClick={onClose}
          >
            {cancelText}
          </button>
          <button
            type="button"
            className="px-6 py-2.5 text-sm font-bold text-white bg-red-600 rounded-xl hover:bg-red-700 transition-colors shadow-md"
            onClick={() => {
              onConfirm();
              onClose();
              mouseDownTarget.current = null;
            }}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;