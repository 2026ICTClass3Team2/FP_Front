import React from 'react';
import { FiCpu, FiPlus } from 'react-icons/fi';

const ChatBotTab = () => {
  return (
    <div className="flex flex-col h-full items-center justify-center p-8 text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center text-primary mb-6 animate-pulse">
        <FiCpu size={40} />
      </div>
      
      <h3 className="text-2xl font-black text-foreground mb-3 tracking-tight">AI 챗봇 비서</h3>
      <p className="text-muted-foreground text-sm max-w-[280px] leading-relaxed mb-8">
        준비 중인 기능입니다
      </p>

      <div className="w-full grid grid-cols-2 gap-3 opacity-40 grayscale pointer-events-none">
        <div className="p-4 bg-muted/30 border border-border rounded-2xl text-left">
          <div className="w-8 h-8 bg-background rounded-lg mb-2" />
          <div className="h-2 w-3/4 bg-border rounded-full mb-2" />
          <div className="h-2 w-1/2 bg-border rounded-full" />
        </div>
        <div className="p-4 bg-muted/30 border border-border rounded-2xl text-left">
          <div className="w-8 h-8 bg-background rounded-lg mb-2" />
          <div className="h-2 w-3/4 bg-border rounded-full mb-2" />
          <div className="h-2 w-1/2 bg-border rounded-full" />
        </div>
      </div>

      <button className="mt-8 px-6 py-2.5 bg-muted text-muted-foreground rounded-full text-xs font-bold border border-border flex items-center gap-2 cursor-not-allowed">
        <FiPlus />
        새 대화 시작하기 (Coming Soon)
      </button>
    </div>
  );
};

export default ChatBotTab;
