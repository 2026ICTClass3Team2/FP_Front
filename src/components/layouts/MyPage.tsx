import React, { useState } from 'react';
import MyPostList from './MyPostList';

const MyPage = () => {
  // 1. 마이페이지 탭 상태 관리 (profile, posts, bookmarks, blocks)
  const [activeTab, setActiveTab] = useState('posts'); 

  return (
    <div className="max-w-4xl mx-auto w-full px-4 py-8 min-h-screen bg-background">
      <h1 className="text-3xl font-bold mb-8 text-foreground">마이페이지</h1>
      
      {/* 탭 네비게이션 */}
      <div className="flex gap-4 border-b border-border mb-6">
        {['profile', 'posts', 'bookmarks', 'blocks'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-3 px-2 text-sm font-medium transition-colors border-b-2 ${
              activeTab === tab 
                ? 'border-primary text-primary' 
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab === 'profile' && '내 프로필'}
            {tab === 'posts' && '내 게시글'}
            {tab === 'bookmarks' && '내 북마크'}
            {tab === 'blocks' && '차단 목록'}
          </button>
        ))}
      </div>

      {/* 탭별 콘텐츠 렌더링 */}
      <div className="py-4">
        {/* 2. 내 프로필은 이미 구현되어 있다고 가정하므로 생략 안내 문구 처리 */}
        {activeTab === 'profile' && (
          <div className="text-center py-10 text-muted-foreground">내 프로필 컴포넌트가 들어갈 자리입니다.</div>
        )}
        {activeTab === 'posts' && <MyPostList />}
        {activeTab === 'bookmarks' && (
          <div className="text-center py-10 text-muted-foreground">내 북마크 목록이 들어갈 자리입니다.</div>
        )}
        {activeTab === 'blocks' && (
          <div className="text-center py-10 text-muted-foreground">차단 목록이 들어갈 자리입니다.</div>
        )}
      </div>
    </div>
  );
};

export default MyPage;