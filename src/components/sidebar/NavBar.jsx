// NavBar.tsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import useThemeStore from '../../../useThemeStore';
import Modal from '../../components/common/Modal';
import PointShopModal from '../../pages/shop/PointShopModal';

const NavBar = () => {
  const [subscribedOpen, setSubscribedOpen] = useState(false);
  const [popularOpen, setPopularOpen] = useState(false);
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const { isDarkMode, toggleTheme } = useThemeStore();


  const [isShopOpen, setIsShopOpen] = useState(false);

  const handleLogout = async () => {
    await logout?.();
    navigate('/login');
  };

  return (
    <aside className="w-64 border-r border-border flex flex-col h-full bg-background shrink-0 select-none">
      {/* 1. 상단 프로필 구역 */}
      <div className="p-5 flex flex-col gap-4">
        <Link to="/mypage" className="flex items-center gap-3 
        hover:bg-foreground/10 rounded-lg p-2 -m-2 transition-colors">
          {/* 프로필 이미지 placeholder (이미지와 동일한 파란색 느낌) */}
          <div className="w-9 h-9 bg-primary rounded-2xl flex items-center 
          justify-center text-2xl text-primary-foreground flex-shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"
              fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              className="lucide lucide-code-xml-icon lucide-code-xml"><path d="m18 16 4-4-4-4" />
              <path d="m6 8-4 4 4 4" /><path d="m14.5 4-5 16" /></svg>
          </div>
          <div className="flex flex-col">
            <span className="text-foreground font-semibold text-lg leading-none">{currentUser?.nickname || '닉네임'}</span>
            <span className="text-foreground text-sm mt-0.5">@{currentUser?.username || '사용자명'}</span>
          </div>
        </Link>

        {/* 포인트 버튼 및 테마 토글 - 나란히 배치 */}
        <div className="flex gap-2">
          <button
            onClick={() => setIsShopOpen(true)}
            className="flex-1 flex items-center gap-2.5 px-5 py-2 bg-background border-2 
            border-border rounded-xl shadow-sm transition-all duration-200
          hover:bg-muted/10 hover:border-primary/40 hover:-translate-y-0.5 hover:shadow-md
          active:scale-95"
          >
            <span className="text-2xl">
              <svg xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#f0b100"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="lucide lucide-coins-icon lucide-coins">
                <path d="M13.744 17.736a6 6 0 1 1-7.48-7.48" />
                <path d="M15 6h1v4" />
                <path d="m6.134 14.768.866-.5 2 3.464" />
                <circle cx="16" cy="8" r="6" />
              </svg>
            </span>
            <span className="font-semibold text-foreground text-base">포인트샵</span>
          </button>

          <button
            onClick={toggleTheme}
            className="flex items-center justify-center px-3 py-2 bg-background border-2 
            border-border rounded-xl shadow-sm hover:bg-muted/5 transition-colors"
            title={isDarkMode ? '라이트 모드' : '다크 모드'}
          >
            {isDarkMode ? (
              <svg className="w-5 h-5 text-foreground"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round">
                <circle cx="12" cy="12" r="5" />
                <path d="M12 1v6m0 6v6M4.22 4.22l4.24 4.24m2.12 2.12l4.24 4.24M1 
                12h6m6 0h6M4.22 19.78l4.24-4.24m2.12-2.12l4.24-4.24M19 12l.01.01" />
              </svg>
            ) : (
              <svg className="w-5 h-5 text-foreground"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            )}
          </button>
        </div>
      </div>

      <div className="h-px bg-border/50 mx-4" />

      {/* 2. 네비게이션 메뉴 */}
      <nav className="flex-1 overflow-y-auto scrollbar-hide p-3 space-y-1">
        {/* 홈 (기존 "피드" → "홈"으로 변경) */}
        <Link
          to="/"
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl 
          font-semibold text-foreground hover:bg-muted/5 transition-all"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-5 h-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2.5"
          >
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1v-5m10-10l2 
            2m-2-2v10a1 1 0 01-1 1v-5m-6 0a1 1 0 001-1v5" />
          </svg>
          <span>홈</span>
        </Link>

        <Link
          to="/qna"
          className="w-full flex items-center gap-3 px-4 py-3 
          rounded-xl font-semibold text-foreground 
          hover:bg-muted/5 transition-all"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-5 h-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2.5"
          >
            <path strokeLinecap="round"
              strokeLinejoin="round"
              d="M8 10h.01M12 10h.01M16 10h.01M9 
            16H5a2 2 0 01-2-2V6a2 2 0 012-2 2 2 0 01-2-2 2 2 0 
            012-2 2 2 0 01-2-2z" />
          </svg>
          <span>질문답변 게시판</span>
        </Link>

        <Link
          to="/study"
          className="w-full flex items-center gap-3 
          px-4 py-3 rounded-xl font-semibold text-foreground 
          hover:bg-muted/5 transition-all"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-5 h-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2.5"
          >
            <path strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 
            5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 
            18 7.5 18 9.246 18 10.832 18.477 12 19.253zm0-13C13.168 
            5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 
            18.477 18.247 18 16.5 18 14.754 18 13.168 18.477 12 19.253z" />
          </svg>
          <span>학습</span>
        </Link>

        {/* 구독한 채널 - 메뉴와 동일한 폰트 크기·색상 + 클릭 시 하단 메뉴 토글 */}
        <div className="pt-4 px-4">
          <button
            onClick={() => setSubscribedOpen(!subscribedOpen)}
            className="w-full flex justify-between items-center 
            font-semibold text-foreground hover:text-foreground transition-colors"
          >
            구독한 채널
            <span
              className={`text-lg leading-none transition-transform duration-200 ${subscribedOpen ? 'rotate-180' : ''
                }`}
            >
              ▾
            </span>
          </button>
          {subscribedOpen && (
            <div className="mt-2 pl-6 flex flex-col gap-1 text-sm text-foreground">
              {/* 백엔드 연결 전 placeholder - 실제 채널 리스트는 나중에 map으로 대체 */}
            </div>
          )}
        </div>

        {/* 인기 채널 - 메뉴와 동일한 폰트 크기·색상 + 클릭 시 하단 메뉴 토글 */}
        <div className="pt-2 px-4">
          <button
            onClick={() => setPopularOpen(!popularOpen)}
            className="w-full flex justify-between items-center 
            font-semibold text-foreground hover:text-foreground transition-colors"
          >
            인기 채널
            <span
              className={`text-lg leading-none transition-transform duration-200 ${popularOpen ? 'rotate-180' : ''
                }`}
            >
              ▾
            </span>
          </button>
          {popularOpen && (
            <div className="mt-2 pl-6 flex flex-col gap-1 text-sm text-foreground">
              {/* 백엔드 연결 전 placeholder - 실제 채널 리스트는 나중에 map으로 대체 */}
            </div>
          )}
        </div>

        {/* 채널 만들기 버튼 */}
        <div className="px-4 pt-6">
          <button className="btn-primary w-full py-3 text-sm 
          font-black flex items-center justify-center gap-2">
            채널 만들기
          </button>
        </div>
      </nav>

      {/* 하단 로그아웃 */}
      <div className="mt-auto p-4 border-t border-border">
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center 
          gap-3 py-3 px-4 rounded-xl text-foreground hover:bg-foreground/10 
          transition-all text-sm font-medium"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4m7 14 5-5-5-5m5 5H9" />
          </svg>
          로그아웃
        </button>
      </div>
      <Modal
        isOpen={isShopOpen}
        onClose={() => setIsShopOpen(false)}
        title="포인트 상점"
      >
        <PointShopModal />
      </Modal>
    </aside>
  );
};

export default NavBar;