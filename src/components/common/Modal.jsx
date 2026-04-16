import React, { useEffect, useRef } from 'react';

const Modal = ({ isOpen, onClose, title, children }) => {
  // 클릭 시작 지점을 저장하기 위한 ref
  const mouseDownTarget = useRef(null);

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

  // 모달이 열려있을 때 배경 스크롤 방지 로직
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

  if (!isOpen) return null;

  // 1. 마우스가 눌린 지점 저장
  const handleMouseDown = (e) => {
    mouseDownTarget.current = e.target;
  };

  // 2. 마우스가 떼진 지점과 눌린 지점이 모두 배경(overlay)일 때만 닫기
  const handleMouseUp = (e) => {
    // 마우스를 뗀 곳이 배경이고, 마우스를 처음 눌렀던 곳도 배경일 경우에만 onClose 실행
    if (e.target === e.currentTarget && mouseDownTarget.current === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 transition-all"
      onMouseDown={handleMouseDown} // 누르는 시점 체크
      onMouseUp={handleMouseUp}     // 떼는 시점 체크
    >
      <div 
        className="bg-background w-full max-w-2xl rounded-2xl p-6 shadow-2xl border border-border max-h-[90vh] overflow-y-auto
          [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
        // 내부 클릭 시 상위(Overlay)로 이벤트가 전파되어 닫히는 것을 방지
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

        {/* 본문 영역: NoticeBar에서 보낸 내용들이 이 {children} 자리에 나옵니다 */}
        <div>
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;