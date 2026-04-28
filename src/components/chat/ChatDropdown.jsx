import React, { useState, useEffect } from 'react';
import { FiMessageSquare, FiCpu, FiFileText } from 'react-icons/fi';
import ChatBotTab from './ChatBotTab';
import DirectChatTab from './DirectChatTab';
import SuggestionTab from './SuggestionTab';

const ChatDropdown = () => {
  // 로컬 스토리지에서 마지막으로 사용한 탭을 가져오거나 기본값 'bot'을 사용합니다.
  const [activeTab, setActiveTab] = useState(() => {
    return localStorage.getItem('lastChatTab') || 'bot';
  });

  // 탭 변경 시 로컬 스토리지에 저장합니다.
  useEffect(() => {
    localStorage.setItem('lastChatTab', activeTab);
  }, [activeTab]);

  return (
    <div className="absolute right-0 mt-2 w-[520px] h-[600px] bg-surface border border-border rounded-2xl shadow-2xl overflow-hidden flex z-[100] animate-in fade-in slide-in-from-top-4 duration-300">
      
      {/* 왼쪽 사이드바 (내비게이션) */}
      <div className="w-20 bg-muted/40 border-r border-border flex flex-col items-center py-6 gap-6">
        <button
          onClick={() => setActiveTab('bot')}
          className={`p-3 rounded-2xl transition-all cursor-pointer ${
            activeTab === 'bot'
            ? 'bg-primary text-primary-foreground shadow-lg scale-110'
            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
          }`}
          title="AI 챗봇"
        >
          <FiCpu size={24} />
        </button>

        <button
          onClick={() => setActiveTab('chat')}
          className={`p-3 rounded-2xl transition-all cursor-pointer ${
            activeTab === 'chat'
            ? 'bg-primary text-primary-foreground shadow-lg scale-110'
            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
          }`}
          title="1:1 채팅"
        >
          <FiMessageSquare size={24} />
        </button>

        {/* 아래쪽 배치되는 건의사항 버튼 */}
        <div className="mt-auto">
          <button
            onClick={() => setActiveTab('suggestion')}
            className={`p-3 rounded-2xl transition-all cursor-pointer ${
              activeTab === 'suggestion'
              ? 'bg-primary text-primary-foreground shadow-lg scale-110'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
            title="건의사항 보내기"
          >
            <FiFileText size={24} />
          </button>
        </div>
      </div>

      {/* 오른쪽 콘텐츠 영역 */}
      <div className="flex-1 bg-surface relative overflow-hidden">
        {activeTab === 'bot' && <ChatBotTab />}
        {activeTab === 'chat' && <DirectChatTab />}
        {activeTab === 'suggestion' && <SuggestionTab />}
      </div>
    </div>
  );
};

export default ChatDropdown;
