import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

// 글로벌 작성 버튼 컴포넌트
const GlobalWriteButton = () => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const handleFeedClick = () => {
    setIsOpen(false);
    navigate('/?write=feed');
  };

  const handleQnaClick = () => {
    setIsOpen(false);
    navigate('/qna?write=qna');
  };

  return (
    <>
      {/* 팝업 옵션들 */}
      {isOpen && (
        <div className="fixed bottom-20 right-6 flex flex-col gap-2 z-50">
          <button
            onClick={handleFeedClick}
            className="bg-primary text-primary-foreground px-4 py-2 rounded-lg shadow-lg hover:bg-primary/90 transition-colors text-sm font-medium"
          >
            피드 게시물 작성
          </button>
          <button
            onClick={handleQnaClick}
            className="bg-primary text-primary-foreground px-4 py-2 rounded-lg shadow-lg hover:bg-primary/90 transition-colors text-sm font-medium"
          >
            Q&A 질문 작성
          </button>
        </div>
      )}

      {/* 메인 버튼 */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-primary text-primary-foreground rounded-full shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all flex items-center justify-center text-3xl font-light z-50"
      >
        +
      </button>

      {/* 배경 클릭으로 닫기 */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
};

export default GlobalWriteButton;