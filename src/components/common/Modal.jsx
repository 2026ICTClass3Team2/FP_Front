import React from 'react';

const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null; 

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center"> {/* 배경 추가 */}
      <div className="bg-white p-6 rounded-2xl max-w-md w-full"> {/* 창 스타일 추가 */}
        
        <div> {/* 상단 제목 및 닫기 버튼 */}
          {title && <h2 className="text-xl font-bold">{title}</h2>}
          <button onClick={onClose}>닫기</button>
        </div>

        <div> {/* 핵심! 각 기능별 내용물이 들어갈 자리 */}
          {children}
        </div>

      </div>
    </div>
  );
};

export default Modal;