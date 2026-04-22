import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from './AuthContext';
import useThemeStore from '../../../useThemeStore';
import CreateChannelModal from '../channel/CreateChannelModal';
import PointShopModal from '../../pages/shop/PointShopModal';
import jwtAxios from '../../api/jwtAxios';
import Modal from '../common/Modal';

const NavBar = () => {
  const [subscribedOpen, setSubscribedOpen] = useState(true);
  const [popularOpen, setPopularOpen] = useState(true);
  const [isCreateChannelOpen, setIsCreateChannelOpen] = useState(false);
  const [isPointShopOpen, setIsPointShopOpen] = useState(false);
  const [subscribedChannels, setSubscribedChannels] = useState([]);
  const [popularChannels, setPopularChannels] = useState([]);
  const [currentPoint, setCurrentPoint] = useState(null);
  const { currentUser, logout } = useAuth();
  const { isDarkMode, toggleTheme } = useThemeStore();

  const fetchChannels = async () => {
    try {
      const [subscribedRes, popularRes] = await Promise.all([
        jwtAxios.get('channels/subscribed'),
        jwtAxios.get('channels/popular'),
      ]);
      setSubscribedChannels(subscribedRes.data);
      setPopularChannels(popularRes.data);
    } catch (err) {
      // 조용히 실패 처리
    }
  };

  const fetchCurrentPoint = async () => {
    if (!currentUser) return;
    try {
      const res = await jwtAxios.get('shop/my-points');
      setCurrentPoint(res.data.points);
    } catch {
      setCurrentPoint(null);
    }
  };

  useEffect(() => {
    if (currentUser) {
      fetchChannels();
    } else {
      setSubscribedChannels([]);
      setPopularChannels([]);
    }
  }, [currentUser]);

  useEffect(() => {
    fetchCurrentPoint();
  }, [currentUser]);

  const handleLogout = async () => {
    await logout?.();
    window.location.replace('/login');
  };

  return (
    <aside className="w-64 border-r border-border flex flex-col h-full bg-background shrink-0 select-none">
      {/* 1. 상단 프로필 구역 */}
      <div className="p-5 flex flex-col gap-4">
        <Link to="/mypage" className="flex items-center gap-3 hover:bg-foreground/10 rounded-lg p-2 -m-2 transition-colors">
          <div className="w-9 h-9 bg-primary rounded-2xl flex items-center justify-center text-2xl text-primary-foreground flex-shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"
              fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m18 16 4-4-4-4"/><path d="m6 8-4 4 4 4"/><path d="m14.5 4-5 16"/>
            </svg>
          </div>
          <div className="flex flex-col">
            <span className="text-foreground font-semibold text-lg leading-none">{currentUser?.nickname || '닉네임'}</span>
            <span className="text-foreground text-sm mt-0.5">@{currentUser?.username || '사용자명'}</span>
          </div>
        </Link>

        <div className="flex gap-2">
          <button
            onClick={() => setIsPointShopOpen(true)}
            title="포인트 샵"
            className="flex-1 flex items-center gap-2.5 px-5 py-2 bg-background border-2 border-border rounded-xl shadow-sm hover:bg-yellow-50 dark:hover:bg-yellow-900/20 hover:border-yellow-400 transition-all group"
          >
            <span className="text-2xl group-hover:scale-110 transition-transform">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"
                fill="none" stroke="#f0b100" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M13.744 17.736a6 6 0 1 1-7.48-7.48"/>
                <path d="M15 6h1v4"/><path d="m6.134 14.768.866-.5 2 3.464"/>
                <circle cx="16" cy="8" r="6"/>
              </svg>
            </span>
            <span className="font-semibold text-foreground text-base">
              {currentPoint !== null ? currentPoint.toLocaleString() : '...'}
            </span>
          </button>

          <button
            onClick={toggleTheme}
            className="flex items-center justify-center px-3 py-2 bg-background border-2 border-border rounded-xl shadow-sm hover:bg-muted/5 transition-colors"
            title={isDarkMode ? '라이트 모드' : '다크 모드'}
          >
            {isDarkMode ? (
              <svg className="w-5 h-5 text-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="5" />
                <path d="M12 1v6m0 6v6M4.22 4.22l4.24 4.24m2.12 2.12l4.24 4.24M1 12h6m6 0h6M4.22 19.78l4.24-4.24m2.12-2.12l4.24-4.24M19 12l.01.01" />
              </svg>
            ) : (
              <svg className="w-5 h-5 text-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            )}
          </button>
        </div>
      </div>

      <div className="h-px bg-border/50 mx-4" />

      {/* 2. 네비게이션 메뉴 */}
      <nav className="flex-1 overflow-y-auto scrollbar-hide p-3 space-y-1">
        <Link to="/" className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-foreground hover:bg-muted/5 transition-all">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1v-5m10-10l2 2m-2-2v10a1 1 0 01-1 1v-5m-6 0a1 1 0 001-1v5" />
          </svg>
          <span>홈</span>
        </Link>

        <Link to="/qna" className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-foreground hover:bg-muted/5 transition-all">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
          <span>질문답변 게시판</span>
        </Link>

        <Link to="/study" className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-foreground hover:bg-muted/5 transition-all">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253zm0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.747 0-3.332.477-4.5 1.253z" />
          </svg>
          <span>학습</span>
        </Link>

        {/* 구독한 채널 - 스크롤 가능 */}
        <div className="pt-4 px-4">
          <button
            onClick={() => setSubscribedOpen(!subscribedOpen)}
            className="w-full flex justify-between items-center font-semibold text-foreground hover:text-foreground transition-colors"
          >
            구독한 채널
            <span className={`text-lg leading-none transition-transform duration-200 ${subscribedOpen ? 'rotate-180' : ''}`}>▾</span>
          </button>

          {subscribedOpen && (
            <div className="mt-2 flex flex-col gap-0.5 max-h-48 overflow-y-auto scrollbar-hide pr-1">
              {subscribedChannels.length === 0 ? (
                <p className="text-xs text-muted-foreground pl-2 py-1">구독한 채널이 없습니다.</p>
              ) : (
                subscribedChannels.map((ch) => (
                  <Link
                    key={ch.channelId}
                    to={`/channels/${ch.channelId}`}
                    className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-muted/5 transition-colors"
                  >
                    {ch.imageUrl ? (
                      <img src={ch.imageUrl} alt={ch.name} className="w-6 h-6 rounded-full object-cover flex-shrink-0" />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-bold text-primary">{ch.name?.[0]?.toUpperCase()}</span>
                      </div>
                    )}
                    <span className="text-sm text-foreground truncate">{ch.name}</span>
                  </Link>
                ))
              )}
            </div>
          )}
        </div>

        {/* 인기 채널 - 구독자 순 top 5 */}
        <div className="pt-2 px-4">
          <button
            onClick={() => setPopularOpen(!popularOpen)}
            className="w-full flex justify-between items-center font-semibold text-foreground hover:text-foreground transition-colors"
          >
            인기 채널
            <span className={`text-lg leading-none transition-transform duration-200 ${popularOpen ? 'rotate-180' : ''}`}>▾</span>
          </button>

          {popularOpen && (
            <div className="mt-2 flex flex-col gap-0.5">
              {popularChannels.length === 0 ? (
                <p className="text-xs text-muted-foreground pl-2 py-1">채널이 없습니다.</p>
              ) : (
                popularChannels.map((ch, idx) => (
                  <Link
                    key={ch.channelId}
                    to={`/channels/${ch.channelId}`}
                    className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-muted/5 transition-colors"
                  >
                    <span className="text-xs font-bold text-muted-foreground w-4 flex-shrink-0">{idx + 1}</span>
                    {ch.imageUrl ? (
                      <img src={ch.imageUrl} alt={ch.name} className="w-6 h-6 rounded-full object-cover flex-shrink-0" />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-bold text-primary">{ch.name?.[0]?.toUpperCase()}</span>
                      </div>
                    )}
                    <div className="flex flex-col min-w-0">
                      <span className="text-sm text-foreground truncate">{ch.name}</span>
                      <span className="text-xs text-muted-foreground">{ch.followerCount?.toLocaleString()}명</span>
                    </div>
                  </Link>
                ))
              )}
            </div>
          )}
        </div>

        {/* 채널 만들기 버튼 */}
        <div className="px-4 pt-6">
          <button
            onClick={() => setIsCreateChannelOpen(true)}
            className="btn-primary w-full py-3 text-sm font-black flex items-center justify-center gap-2"
          >
            채널 만들기
          </button>
        </div>
      </nav>

      <CreateChannelModal
        isOpen={isCreateChannelOpen}
        onClose={() => setIsCreateChannelOpen(false)}
        onSuccess={fetchChannels}
      />

      <PointShopModal
        isOpen={isPointShopOpen}
        onClose={() => { setIsPointShopOpen(false); fetchCurrentPoint(); }}
      />

      {/* 하단 로그아웃 */}
      <div className="mt-auto p-4 border-t border-border">
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl text-foreground hover:bg-foreground/10 transition-all text-sm font-medium"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4m7 14 5-5-5-5m5 5H9" />
          </svg>
          로그아웃
        </button>
      </div>
      {/* <Modal
        isOpen={isPointShopOpen}
        onClose={() => setIsShopOpen(false)}
        title="포인트 상점"
      >
        <PointShopModal />
      </Modal> */}
    </aside>
  );
};

export default NavBar;
