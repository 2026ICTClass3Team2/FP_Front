import React from 'react';

const Modal = ({ isOpen, onClose, title, children }) => {
  // 열림 상태가 아니면 아무것도 렌더링하지 않음
  if (!isOpen) return null; 

  return (
    <div> {/* 모달 전체 배경 영역 */}
      <div> {/* 실제 모달 창 영역 */}
        
        <div> {/* 상단 제목 및 닫기 버튼 */}
          {title && <h2>{title}</h2>}
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