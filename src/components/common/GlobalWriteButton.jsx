import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useWriteChannelStore from '../../../useWriteChannelStore';

const GlobalWriteButton = () => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const channel = useWriteChannelStore((s) => s.channel); // 채널 상세 페이지에서 설정, 그 외 null

  const handleFeedClick = () => {
    setIsOpen(false);
    navigate('/?write=feed', { state: { channel: channel || null } });
  };

  const handleQnaClick = () => {
    setIsOpen(false);
    navigate('/qna?write=qna');
  };

  return (
    <>
      {/* 팝업 옵션들 */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 flex flex-col bg-surface border border-border rounded-2xl shadow-xl overflow-hidden z-50 min-w-[180px]">
          <button
            onClick={handleFeedClick}
            className="flex items-center gap-3 px-5 py-3.5 text-sm font-semibold text-foreground hover:bg-secondary transition-colors border-b border-border"
          >
            <svg className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            피드 게시물 작성
          </button>
          <button
            onClick={handleQnaClick}
            className="flex items-center gap-3 px-5 py-3.5 text-sm font-semibold text-foreground hover:bg-secondary transition-colors"
          >
            <svg className="w-5 h-5 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Q&A 질문 작성
          </button>
        </div>
      )}

      {/* 메인 버튼 */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 right-6 w-14 h-14 bg-primary text-primary-foreground rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center z-50 ${isOpen ? 'rotate-45 hover:bg-primary/90' : 'hover:-translate-y-1'}`}
      >
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </svg>
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