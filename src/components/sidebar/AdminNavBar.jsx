import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';
import useThemeStore from '../../../useThemeStore';
import { FiHome, FiMessageCircle, FiBookOpen, FiPlus, FiLogOut, FiMoon, FiSun } from 'react-icons/fi';
import CreateChannelModal from '../channel/CreateChannelModal';

const AdminNavBar = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { isDarkMode, toggleTheme } = useThemeStore();
  const [isCreateChannelOpen, setIsCreateChannelOpen] = useState(false);

  const getNavClass = (path, isExact = false) => {
    const isActive = isExact 
      ? location.pathname === path 
      : location.pathname.startsWith(path);

    if (isActive) {
      return "w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-all border text-red-500 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800";
    }
    return "w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-foreground hover:bg-muted/5 transition-all border border-transparent";
  };

  const handleLogout = async () => {
    await logout?.();
    window.location.replace('/login');
  };

  return (
    <aside className="w-64 border-r border-border flex flex-col h-full bg-background shrink-0 select-none">
      {/* 1. 상단 프로필 구역 (어드민) */}
      <div className="p-5 flex flex-col gap-4">
        <Link to="/mypage" className="flex items-center gap-3 hover:bg-foreground/10 rounded-lg p-2 -m-2 transition-colors">
          <div className="w-9 h-9 bg-red-500 rounded-2xl flex items-center justify-center text-xl text-white flex-shrink-0 font-bold">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"
              fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m18 16 4-4-4-4"/><path d="m6 8-4 4 4 4"/><path d="m14.5 4-5 16"/>
            </svg>
          </div>
          <div className="flex flex-col">
            <span className="text-red-500 font-bold text-lg leading-none">관리자</span>
            <span className="text-foreground text-sm mt-0.5">@{currentUser?.username || 'admin'}</span>
          </div>
        </Link>

        <div className="flex gap-2">
          <button className="flex-1 flex items-center gap-2.5 px-5 py-2 bg-background border-2 border-border rounded-xl shadow-sm hover:bg-muted/5 transition-colors">
            <span className="text-2xl">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"
                fill="none" stroke="#f0b100" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M13.744 17.736a6 6 0 1 1-7.48-7.48"/>
                <path d="M15 6h1v4"/><path d="m6.134 14.768.866-.5 2 3.464"/>
                <circle cx="16" cy="8" r="6"/>
              </svg>
            </span>
            <span className="font-semibold text-foreground text-base">무제한</span>
          </button>

          <button
            onClick={toggleTheme}
            className="flex items-center justify-center px-3 py-2 bg-background border-2 border-border rounded-xl shadow-sm hover:bg-muted/5 transition-colors"
            title={isDarkMode ? '라이트 모드' : '다크 모드'}
          >
            {isDarkMode ? <FiSun className="w-5 h-5 text-foreground" /> : <FiMoon className="w-5 h-5 text-foreground" />}
          </button>
        </div>
      </div>

      <div className="h-px bg-border/50 mx-4" />

      {/* 2. 네비게이션 메뉴 */}
      <nav className="flex-1 overflow-y-auto scrollbar-hide p-3 space-y-1">
        
        {/* 관리자 대시보드 */}
        <Link to="/admin" className={getNavClass('/admin')}>
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span>관리자 페이지</span>
        </Link>

        {/* 일반 메뉴 */}
        <Link to="/" className={getNavClass('/', true)}>
          <FiHome className="w-5 h-5" />
          <span>피드</span>
        </Link>

        <Link to="/qna" className={getNavClass('/qna')}>
          <FiMessageCircle className="w-5 h-5" />
          <span>질문답변 게시판</span>
        </Link>

        <Link to="/study" className={getNavClass('/study')}>
          <FiBookOpen className="w-5 h-5" />
          <span>학습</span>
        </Link>

        {/* 채널 만들기 버튼 */}
        <div className="px-4 pt-6">
          <button
            onClick={() => setIsCreateChannelOpen(true)}
            className="btn-primary w-full py-3 text-sm font-black flex items-center justify-center gap-2"
          >
            <FiPlus className="w-4 h-4" />
            채널 만들기
          </button>
        </div>
      </nav>

      <CreateChannelModal
        isOpen={isCreateChannelOpen}
        onClose={() => setIsCreateChannelOpen(false)}
        onSuccess={() => {}} // 관리자 네비게이션에는 채널 목록이 없으므로 빈 함수 전달
      />

      {/* 하단 로그아웃 */}
      <div className="mt-auto p-4 border-t border-border">
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl text-foreground hover:bg-foreground/10 transition-all text-sm font-medium"
        >
          <FiLogOut className="w-5 h-5" />
          로그아웃
        </button>
      </div>
    </aside>
  );
};

export default AdminNavBar;
