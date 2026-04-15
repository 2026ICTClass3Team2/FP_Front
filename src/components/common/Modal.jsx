import React, { useEffect } from 'react';

const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  // ESC 키로 모달 닫기
  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  // 배경 스크롤 방지 로직 (기존과 동일)
  useEffect(() => {
    if (isOpen) {
      const scrollY = window.scrollY;
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      document.body.style.overflow = 'hidden';

      return () => {
        const prevScrollY = parseInt(document.body.style.top || '0') * -1;
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        document.body.style.overflow = '';
        window.scrollTo(0, prevScrollY);
      };
    }
  }, [isOpen]);

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 transition-all"
      onClick={onClose}
    >
      <div 
        className="bg-background w-full max-w-2xl rounded-2xl p-6 shadow-2xl border border-border max-h-[90vh] overflow-y-auto 
                   [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 영역 */}
        <div className="flex items-center justify-between mb-5">
          {title && <h2 className="text-xl font-bold text-foreground">{title}</h2>}
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-3xl leading-none">&times;</button>
        </div>

        {/* 본문 영역: NoticeBar에서 보낸 내용들이 이 {children} 자리에 나옵니다 */}
        <div>
          {children}
        </div>

      </div>
    </div>
  );
};

export default Modal;