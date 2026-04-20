import React from 'react';
import { Outlet, NavLink, useParams, useNavigate } from 'react-router-dom';

const MyPageLayout = () => {
  // 주소창에서 userId 파라미터를 가져옵니다. 
  // (예: /user/123 으로 들어오면 userId는 '123', /mypage 로 들어오면 undefined)
  const { userId } = useParams(); 
  const navigate = useNavigate();
  
  // userId가 없으면 마이페이지(내꺼)라고 판별합니다.
  const isMyPage = !userId; 


  // 활성화된 탭 스타일을 지정하는 함수
  const getNavLinkClass = ({ isActive }) =>
    `pb-3 px-2 text-sm font-medium transition-colors border-b-2 ${
      isActive
        ? 'border-primary text-primary'
        : 'border-transparent text-muted-foreground hover:text-foreground'
    }`;

  return (
    <section className="max-w-[1200px] min-w-[900px] mx-auto w-full px-4 py-8 min-h-screen bg-background">
      {/* 1. 상단 타이틀 */}
      <header className="mb-8">
        <h2 className="text-3xl font-bold text-foreground">{isMyPage ? '마이페이지' : '프로필'}</h2>
      </header>

      {/* 2. 조건부 탭 메뉴 영역 */}
      <nav className="flex gap-4 border-b border-border mb-6">
        {isMyPage ? (
          /* --- [마이페이지일 때 보여줄 리스트] --- */
          <>
            <NavLink to="/mypage" end className={getNavLinkClass}>내 프로필</NavLink>
            <NavLink to="/mypage/posts" className={getNavLinkClass}>내 게시글</NavLink>
            <NavLink to="/mypage/bookmarks" className={getNavLinkClass}>내 북마크</NavLink>
            <NavLink to="/mypage/blocks" className={getNavLinkClass}>차단 목록</NavLink>
          </>
        ) : (
          /* --- [타인 프로필일 때 보여줄 리스트] --- */
          <>
            <NavLink to={`/user/${userId}`} end className={getNavLinkClass}>피드</NavLink>
            <NavLink to={`/user/${userId}/info`} className={getNavLinkClass}>프로필</NavLink>
          </>
        )}
      </nav>

      {/* 3. 실제 컨텐츠가 들어갈 자리 */}
      <main className="py-4">
        <Outlet />
      </main>
    </section>
  );
};

export default MyPageLayout;