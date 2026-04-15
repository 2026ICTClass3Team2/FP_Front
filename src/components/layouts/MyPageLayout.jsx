import React from 'react';
import { Outlet, NavLink, useParams, useNavigate } from 'react-router-dom';

const MyPageLayout = () => {
  // 주소창에서 userId 파라미터를 가져옵니다. 
  // (예: /user/123 으로 들어오면 userId는 '123', /mypage 로 들어오면 undefined)
  const { userId } = useParams(); 
  const navigate = useNavigate();
  
  // userId가 없으면 마이페이지(내꺼)라고 판별합니다.
  const isMyPage = !userId; 

  const navLinkClass = ({ isActive }) =>
    `inline-block py-3 px-1 text-base ${isActive ? 'border-b-2 border-primary text-primary font-bold' : 'border-b-2 border-transparent text-muted-foreground hover:text-foreground'}`;

  return (
    <div className="max-w-5xl mx-auto py-8 px-4">
      {/* 1. 상단 타이틀 및 뒤로가기 영역 */}
      <header className="flex items-center mb-8">
        {!isMyPage && (
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="mr-4 p-2 rounded-full hover:bg-accent transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
        )}
        <h2 className="text-3xl font-bold">{isMyPage ? '마이페이지' : '프로필'}</h2>
      </header>

      {/* 2. 조건부 탭 메뉴 영역 */}
      <nav className="mb-8 border-b border-border">
        <ul className="flex items-center gap-8 -mb-px">
          {isMyPage ? (
            <>
              <li><NavLink to="/mypage" end className={navLinkClass}>프로필</NavLink></li>
              <li><NavLink to="/mypage/posts" className={navLinkClass}>내 게시글</NavLink></li>
              <li><NavLink to="/mypage/bookmarks" className={navLinkClass}>북마크</NavLink></li>
              <li><NavLink to="/mypage/blocks" className={navLinkClass}>차단 목록</NavLink></li>
            </>
          ) : (
            <>
              <li><NavLink to={`/user/${userId}`} end className={navLinkClass}>피드</NavLink></li>
              <li><NavLink to={`/user/${userId}/info`} className={navLinkClass}>프로필</NavLink></li>
            </>
          )}
        </ul>
      </nav>

      {/* 3. 실제 컨텐츠가 들어갈 자리 */}
      <main>
        <Outlet />
      </main>
    </div>
  );
};

export default MyPageLayout;