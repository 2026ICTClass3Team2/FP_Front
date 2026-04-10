// NoticeBar.tsx
import React from 'react';

const NoticeBar = () => {
  return (
    <aside className="w-80 border-l border-border flex flex-col h-full bg-background shrink-0">
      
      <div className="p-6">
        <h2 className="text-lg font-black text-foreground">공지사항</h2>
      </div>
      
    <div>유지보수 일정</div>
    <div>이번 주 일요일 오전 11시부터 오후 4시까지 유지 보수가 진행됩니다.</div>
    <div></div>

      
      <div className="flex-1 flex flex-col gap-4 p-6 overflow-y-auto scrollbar-hide max-h-[calc(100vh-120px)]">
        {/* 백엔드 연결 전: 빈 상태만 유지 */}
      </div>
    </aside>
  );
};

export default NoticeBar;