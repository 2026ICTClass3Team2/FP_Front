// Header.tsx
import React from 'react';
import { Link } from 'react-router-dom';

const Header = () => {
  return (
    <header className="h-16 border-b border-border bg-background flex items-center px-4 md:px-6 shrink-0">
      
      <Link to="/" className="flex items-center gap-3 min-w-[200px] text-foreground">
        {/* 앱 아이콘 */}
        <div>
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-bug-off-icon lucide-bug-off" style={{ transition: 'none' }}><path d="M12 20v-8"/><path d="M12.656 7H14a4 4 0 0 1 4 4v1.344"/><path d="M14.12 3.88 16 2"/><path d="M17.123 17.123A6 6 0 0 1 6 14v-3a4 4 0 0 1 1.72-3.287"/><path d="m2 2 20 20"/><path d="M21 5a4 4 0 0 1-3.55 3.97"/><path d="M22 13h-3.344"/><path d="M3 21a4 4 0 0 1 3.81-4"/><path d="M3 5a4 4 0 0 0 3.55 3.97"/><path d="M6 13H2"/><path d="m8 2 1.88 1.88"/><path d="M9.712 4.06A3 3 0 0 1 15 6v1.13"/></svg>
        </div>
        <h1 className="font-black text-xl tracking-[0px]">Dead Bug</h1>
      </Link>

      {/* 중앙 검색바 */}
      <div className="flex-1 flex justify-center px-4 md:px-12">
        <div className="relative w-full max-w-2xl">
          <div className="search-input flex items-center w-full h-11 pl-11 pr-4 text-sm">
            {/* 검색 아이콘 */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-5 h-5 text-muted-foreground absolute left-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 21l-6-6m2-5a7 7 0 01-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              type="text"
              placeholder="무엇이든 검색하세요"
              className="flex-1 bg-transparent outline-none text-foreground placeholder:text-muted-foreground text-base"
            />
          </div>
        </div>
      </div>

      {/* 오른쪽 알림 및 메시지 아이콘 */}
      <div className="flex items-center gap-3 min-w-[200px] justify-end">
        <button className="p-2 text-foreground hover:bg-foreground/10 rounded transition-colors">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        </button>
        <button className="p-2 text-foreground hover:bg-foreground/10 rounded transition-colors">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
        </button>
      </div>
    </header>
  );
};

export default Header;