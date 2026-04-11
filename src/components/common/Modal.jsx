import React from 'react';

const Modal = ({ isOpen, onClose, title, children }) => {
  // 열림 상태가 아니면 아무것도 렌더링하지 않음
  if (!isOpen) return null; 

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 transition-all"
      onClick={onClose}
    >
      <div 
        className="bg-background w-full max-w-2xl rounded-2xl p-6 shadow-2xl border border-border max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        
        <div className="flex items-center justify-between mb-5">
          {title && <h2 className="text-xl font-bold text-foreground">{title}</h2>}
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-3xl leading-none">&times;</button>
        </div>

        <div>
          {children}
        </div>

      </div>
    </div>
  );
};

export default Modal;