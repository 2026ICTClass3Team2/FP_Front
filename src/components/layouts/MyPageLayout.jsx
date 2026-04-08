import React from 'react';
import { Outlet, Link, useParams } from 'react-router-dom';

const MyPageLayout = () => {
  // 주소창에서 userId 파라미터를 가져옵니다. 
  // (예: /user/123 으로 들어오면 userId는 '123', /mypage 로 들어오면 undefined)
  const { userId } = useParams(); 
  
  // userId가 없으면 마이페이지(내꺼)라고 판별합니다.
  const isMyPage = !userId; 

  return (
    <section>
      {/* 1. 상단 타이틀 및 뒤로가기 영역 */}
      <header>
        {!isMyPage && <button type="button">← 돌아가기</button>}
        <h2>{isMyPage ? '마이페이지' : '프로필'}</h2>
      </header>

      {/* 2. 조건부 탭 메뉴 영역 */}
      <nav>
        <ul>
          {isMyPage ? (
            /* --- [마이페이지일 때 보여줄 리스트] --- */
            <>
              <li><Link to="/mypage">프로필</Link></li>
              <li><Link to="/mypage/posts">내 게시글</Link></li>
              <li><Link to="/mypage/bookmarks">북마크</Link></li>
              <li><Link to="/mypage/blocks">차단 목록</Link></li>
            </>
          ) : (
            /* --- [타인 프로필일 때 보여줄 리스트] --- */
            <>
              <li><Link to={`/user/${userId}`}>피드</Link></li>
              <li><Link to={`/user/${userId}/info`}>프로필</Link></li>
            </>
          )}
        </ul>
      </nav>

      {/* 3. 실제 컨텐츠가 들어갈 자리 */}
      <main>
        
        <Outlet />
      </main>
    </section>
  );
};

export default MyPageLayout;