import React, { useEffect, useLayoutEffect, useRef, useCallback } from 'react';

const Modal = ({ isOpen, onClose, title, children, maxWidth = 'max-w-2xl', maxHeight = 'max-h-[90vh]' }) => {
  const mouseDownTarget = useRef(null);
  const scrollRef = useRef(null);
  const savedScrollTop = useRef(0);

  // 모달이 열릴 때 저장된 스크롤 위치 초기화
  useEffect(() => {
    if (isOpen) savedScrollTop.current = 0;
  }, [isOpen]);

  // 모든 렌더 직후(브라우저 페인트 전)에 스크롤 위치 복원
  // 리렌더로 인해 포커스 이동 등으로 scrollTop이 0으로 튀는 것을 방지
  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const maxScroll = el.scrollHeight - el.clientHeight;
    el.scrollTop = Math.min(savedScrollTop.current, Math.max(0, maxScroll));
  });

  // 사용자가 직접 스크롤할 때 위치 저장
  const handleScroll = useCallback(() => {
    if (scrollRef.current) {
      savedScrollTop.current = scrollRef.current.scrollTop;
    }
  }, []);

  // ESC 키로 모달 닫기
  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  // 모달이 열려있을 때 배경 스크롤 방지
  useEffect(() => {
    if (!isOpen) return;
    const main = document.querySelector('main');
    if (!main) return;
    const prevOverflow = main.style.overflow;
    main.style.overflow = 'hidden';
    return () => { main.style.overflow = prevOverflow; };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleMouseDown = (e) => { mouseDownTarget.current = e.target; };
  const handleMouseUp = (e) => {
    if (e.target === e.currentTarget && mouseDownTarget.current === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 transition-all"
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
    >
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className={`bg-background w-full ${maxWidth} ${maxHeight} rounded-2xl p-6 shadow-2xl border border-border overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]`}
        onMouseDown={(e) => e.stopPropagation()}
        onMouseUp={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          {title && <h2 className="text-xl font-bold text-foreground">{title}</h2>}
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground text-3xl leading-none"
          >
            &times;
          </button>
        </div>
        <div>
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;
