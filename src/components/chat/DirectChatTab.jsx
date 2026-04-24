import React from 'react';
import { FiMessageSquare, FiSearch } from 'react-icons/fi';

const DirectChatTab = () => {
  return (
    <div className="flex flex-col h-full animate-in fade-in slide-in-from-left-4 duration-300">
      <div className="p-6 border-b border-border bg-muted/20">
        <h3 className="text-xl font-bold text-foreground">1:1 채팅</h3>
        <p className="text-sm text-muted-foreground mt-1">팔로워와 실시간 대화를 나눠보세요.</p>
        
        <div className="relative mt-4">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
          <input 
            type="text" 
            placeholder="친구 검색..." 
            className="w-full pl-9 pr-4 py-2 bg-background border border-border rounded-xl text-xs focus:outline-none focus:border-primary"
          />
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-10 text-center">
        <div className="w-16 h-16 bg-muted/50 rounded-full flex items-center justify-center text-muted-foreground mb-4">
          <FiMessageSquare size={30} />
        </div>
        <p className="text-sm font-medium text-foreground">채팅 내역이 없습니다</p>
        <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
          대화를 시작하려면 사용자 프로필에서<br/>채팅 버튼을 눌러보세요.
        </p>
        
        <button className="mt-6 px-4 py-2 bg-primary/10 text-primary rounded-lg text-xs font-bold hover:bg-primary/20 transition-colors">
          연락처 찾기
        </button>
      </div>
    </div>
  );
};

export default DirectChatTab;
