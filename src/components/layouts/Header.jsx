// Header.tsx
import React from 'react';
import { Link } from 'react-router-dom';

const Header = () => {
  return (
    <header className="h-16 border-b border-border bg-background flex items-center px-4 md:px-6 z-50 shrink-0">
      
      <Link to="/" className="flex items-center gap-3 min-w-[200px]">
        {/* 이미지의 파란색 앱 아이콘 */}
        <div className="w-8 h-8 bg-primary rounded-2xl flex items-center justify-center text-2xl text-primary-foreground flex-shrink-0 shadow-sm">
          🪲
        </div>
        <h1 className="font-black text-2xl tracking-[-0.5px] text-foreground">Dead Bug</h1>
      </Link>

      {/* 중앙 검색바 */}
      <div className="flex-1 flex justify-center px-4 md:px-12">
        <div className="relative w-full max-w-2xl">
          <div className="search-input flex items-center w-full h-11 pl-11 pr-4 text-sm">
            {/* 검색 아이콘 */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-5 h-5 text-muted absolute left-4"
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
              className="flex-1 bg-transparent outline-none text-foreground placeholder:text-muted text-base"
            />
          </div>
        </div>
      </div>

      
      <div className="flex items-center gap-3 min-w-[200px] justify-end">
        <button className="p-2 text-muted hover:text-foreground transition-colors">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        </button>
        <button className="p-2 text-muted hover:text-foreground transition-colors">
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