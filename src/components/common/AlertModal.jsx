import React, { useEffect, useRef } from 'react';

const AlertModal = ({ isOpen, onClose, title, message, confirmText = '확인' }) => {
  const mouseDownTarget = useRef(null);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleEscape);
    }
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleMouseDown = (e) => {
    mouseDownTarget.current = e.target;
  };
  const handleMouseUp = (e) => {
    if (e.target === e.currentTarget && mouseDownTarget.current === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 transition-all"
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
    >
      <div
        className="bg-background w-full max-w-md rounded-2xl p-6 shadow-2xl border border-border max-h-[90vh] overflow-y-auto text-center"
        onMouseDown={e => e.stopPropagation()}
        onMouseUp={e => e.stopPropagation()}
      >
        <div className="mb-2">
          <h2 className="text-xl font-bold text-foreground">{title}</h2>
        </div>
        <div className="mb-6">
          <p className="text-base text-muted-foreground">{message}</p>
        </div>
        <div className="flex justify-center">
          <button
            type="button"
            className="px-6 py-2.5 text-sm font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors shadow-md"
            onClick={onClose}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AlertModal;
