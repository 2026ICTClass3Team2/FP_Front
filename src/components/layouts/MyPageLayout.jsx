import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';

const MyPageLayout = () => {
  // 활성화된 탭 스타일을 지정하는 함수
  const getNavLinkClass = ({ isActive }) =>
    `pb-3 px-2 text-sm font-medium transition-colors border-b-2 cursor-pointer ${
      isActive
        ? 'border-primary text-primary'
        : 'border-transparent text-muted-foreground hover:text-foreground'
    }`;
    
  return (
    <section className="max-w-[1200px] mx-auto w-full px-4 py-8 min-h-screen bg-background">
      {/* 1. 상단 타이틀 */}
      <header className="mb-8">
        <h2 className="text-2xl sm:text-3xl font-bold text-foreground">마이페이지</h2>
      </header>

      {/* 2. 탭 메뉴 영역 */}
      <nav className="flex gap-2 sm:gap-4 border-b border-border mb-6 overflow-x-auto scrollbar-hide">
        <NavLink to="/mypage" end className={getNavLinkClass}>내 프로필</NavLink>
        <NavLink to="/mypage/posts" className={getNavLinkClass}>내 게시글</NavLink>
        <NavLink to="/mypage/bookmarks" className={getNavLinkClass}>내 북마크</NavLink>
        <NavLink to="/mypage/notifications" className={getNavLinkClass}>알림</NavLink>
        <NavLink to="/mypage/blocks" className={getNavLinkClass}>차단 목록</NavLink>
      </nav>

      {/* 3. 실제 컨텐츠가 들어갈 자리 */}
      <main className="py-4">
        <Outlet />
      </main>
    </section>
  );
};

export default MyPageLayout;