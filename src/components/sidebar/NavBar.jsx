import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import useThemeStore from '../../../useThemeStore';
import CreateChannelModal from '../channel/CreateChannelModal';
import PointShopModal from '../../pages/shop/PointShopModal';
import jwtAxios from '../../api/jwtAxios';
import Modal from '../common/Modal';
import UserProfileModal from '../common/UserProfileModal';
import { useChatStore } from '../../stores/chatStore';
import { FiBookOpen, FiHome, FiMessageCircle, FiMoon, FiSun, FiStar } from 'react-icons/fi';

const NavBar = ({ collapsed = false }) => {
  const [subscribedOpen, setSubscribedOpen] = useState(false);
  const [popularOpen, setPopularOpen]       = useState(false);
  const [favoritesOpen, setFavoritesOpen]   = useState(false);
  const [isCreateChannelOpen, setIsCreateChannelOpen] = useState(false);
  const [isPointShopOpen, setIsPointShopOpen]         = useState(false);
  const [subscribedChannels, setSubscribedChannels]   = useState([]);
  const [popularChannels, setPopularChannels]         = useState([]);
  const [favoriteUsers, setFavoriteUsers]             = useState([]);
  const [currentPoint, setCurrentPoint] = useState(null);
  const [profilePicUrl, setProfilePicUrl] = useState(null);
  const [profileModalUserId, setProfileModalUserId] = useState(null);

  const { currentUser, logout } = useAuth();
  const { openChatWith } = useChatStore();
  const { isDarkMode, toggleTheme } = useThemeStore();
  const location = useLocation();

  const getNavClass = (path, isExact = false) => {
    const isActive = isExact 
      ? location.pathname === path 
      : location.pathname.startsWith(path);

    if (isActive) {
      return "w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-all border text-primary bg-primary/10 border-primary/20 dark:bg-primary/20 dark:border-primary/30";
    }
    return "w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-foreground hover:bg-muted/5 transition-all border border-transparent";
  };

  const fetchChannels = async () => {
    try {
      const [subscribedRes, popularRes] = await Promise.all([
        jwtAxios.get('channels/subscribed'),
        jwtAxios.get('channels/popular'),
      ]);
      setSubscribedChannels(subscribedRes.data);
      setPopularChannels(popularRes.data);
    } catch {
      // 조용히 실패 처리
    }
  };

  const fetchFavoriteUsers = async () => {
    try {
      const res = await jwtAxios.get('favorites/users');
      setFavoriteUsers(res.data);
    } catch {
      setFavoriteUsers([]);
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

  const fetchProfilePic = async () => {
    if (!currentUser) return;
    try {
      const res = await jwtAxios.get('/mypage/profile');
      setProfilePicUrl(res.data.profilePicUrl || null);
    } catch {
      setProfilePicUrl(null);
    }
  };

  useEffect(() => {
    if (currentUser) {
      fetchChannels();
      fetchProfilePic();
      fetchFavoriteUsers();
    } else {
      setSubscribedChannels([]);
      setPopularChannels([]);
      setFavoriteUsers([]);
      setProfilePicUrl(null);
    }
  }, [currentUser]);

  useEffect(() => {
    fetchCurrentPoint();
  }, [currentUser]);

  useEffect(() => {
    window.addEventListener('point-updated', fetchCurrentPoint);
    return () => window.removeEventListener('point-updated', fetchCurrentPoint);
  }, []);

  const handleLogout = async () => {
    await logout?.();
    window.location.replace('/login');
  };

  // 포인트샵 닫기: 유저 모달이 닫히면 포인트 갱신
  const handleShopClose = () => {
    setIsPointShopOpen(false);
    fetchCurrentPoint();
  };

  return (
    <aside
      className={`border-r border-border flex flex-col bg-surface shrink-0 select-none overflow-hidden transition-all duration-300 ease-in-out shadow-[4px_0_20px_rgba(0,0,0,0.08)] fixed top-0 left-0 z-50 h-dvh w-64 lg:relative lg:h-full lg:z-auto ${collapsed ? '-translate-x-full lg:translate-x-0 lg:w-0 lg:border-r-0 lg:shadow-none' : 'translate-x-0'}`}
    >

      {/* 1. 상단 프로필 구역 */}
      <div className="p-5 flex flex-col gap-4">
        <Link to="/mypage" className="flex items-center gap-3 hover:bg-foreground/10 dark:hover:bg-foreground/20 rounded-lg p-2 -m-2 transition-colors cursor-pointer">
          {profilePicUrl ? (
            <img src={profilePicUrl} alt="프로필" className="w-9 h-9 rounded-2xl object-cover flex-shrink-0" />
          ) : (
            <div className="w-9 h-9 bg-primary rounded-2xl flex items-center justify-center text-lg font-bold text-primary-foreground flex-shrink-0">
              {(currentUser?.nickname || currentUser?.username || '?')[0].toUpperCase()}
            </div>
          )}
          <div className="flex flex-col">
            <span className="text-foreground font-semibold text-lg leading-none">
              {currentUser?.nickname || '닉네임'}
            </span>
            <span className="text-foreground text-sm mt-0.5">
              @{currentUser?.username || '사용자명'}
            </span>
          </div>
        </Link>

        <div className="flex gap-2">
          {/* 포인트 / 포인트샵 버튼 */}
          <button
            onClick={() => setIsPointShopOpen(true)}
            title="포인트 샵"
            className="flex-1 flex items-center gap-2.5 px-5 py-2 bg-background border-2 border-border rounded-xl shadow-sm transition-all duration-150 hover:border-foreground/30 hover:bg-foreground/5 group cursor-pointer"
          >
            <span className="transition-transform duration-150 group-hover:scale-110">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"
                fill="none" stroke="#f0b100" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M13.744 17.736a6 6 0 1 1-7.48-7.48"/>
                <path d="M15 6h1v4"/>
                <path d="m6.134 14.768.866-.5 2 3.464"/>
                <circle cx="16" cy="8" r="6"/>
              </svg>
            </span>
            <span className="font-semibold text-foreground text-base">
              {currentPoint !== null ? currentPoint.toLocaleString() : '...'}
            </span>
          </button>

          {/* 다크모드 토글 */}
          <button
            onClick={toggleTheme}
            className="flex items-center justify-center px-3 py-2 bg-background border-2 border-border rounded-xl shadow-sm hover:bg-muted/5 transition-colors cursor-pointer"
            title={isDarkMode ? '라이트 모드' : '다크 모드'}
          >
            {isDarkMode ? <FiSun className="w-5 h-5 text-foreground" /> : <FiMoon className="w-5 h-5 text-foreground" />}
          </button>
        </div>
      </div>

      <div className="h-px bg-border/50 mx-4" />

      {/* 2. 네비게이션 메뉴 */}
      <nav className="flex-1 overflow-y-auto scrollbar-hide p-3 space-y-1">
       
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

        {/* 팔로우 */}
        <Link to="/favorites" className={getNavClass('/favorites')}>
          <FiStar className="w-5 h-5" />
          <span>팔로우</span>
        </Link>

        <div className="pt-2 px-4">
          <button
            onClick={() => setFavoritesOpen(!favoritesOpen)}
            className="w-full flex justify-between items-center font-semibold text-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            팔로우한 유저
            <span className={`text-lg leading-none transition-transform duration-200 ${favoritesOpen ? 'rotate-180' : ''}`}>▾</span>
          </button>

          {favoritesOpen && (
            <div className="mt-2 flex flex-col gap-0.5 max-h-48 overflow-y-auto scrollbar-hide pr-1">
              {favoriteUsers.length === 0 ? (
                <p className="text-xs text-muted-foreground pl-2 py-1">팔로우한 유저가 없습니다.</p>
              ) : (
                favoriteUsers.map((u) => (
                  <button key={u.userId} onClick={() => setProfileModalUserId(u.userId)}
                    className="w-full text-left flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-foreground/10 transition-colors cursor-pointer">
                    {u.profilePicUrl ? (
                      <img src={u.profilePicUrl} alt={u.nickname} className="w-6 h-6 rounded-full object-cover flex-shrink-0" />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-yellow-400/30 flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-bold text-yellow-600">{u.nickname?.[0]?.toUpperCase()}</span>
                      </div>
                    )}
                    <span className="text-sm text-foreground truncate">{u.nickname}</span>
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        {/* 구독한 채널 */}
        <div className="pt-4 px-4">
          <button
            onClick={() => setSubscribedOpen(!subscribedOpen)}
            className="w-full flex justify-between items-center font-semibold text-foreground hover:text-foreground transition-colors cursor-pointer"
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
                  <Link key={ch.channelId} to={`/channels/${ch.channelId}`}
                    className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-foreground/10 active:bg-foreground/10 transition-colors cursor-pointer">
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

        {/* 인기 채널 */}
        <div className="pt-2 px-4">
          <button
            onClick={() => setPopularOpen(!popularOpen)}
            className="w-full flex justify-between items-center font-semibold text-foreground hover:text-foreground transition-colors cursor-pointer"
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
                  <Link key={ch.channelId} to={`/channels/${ch.channelId}`}
                    className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-foreground/10 active:bg-foreground/10 transition-colors cursor-pointer">
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
            className="btn-primary w-full py-3 text-sm font-black flex items-center justify-center gap-2 cursor-pointer"
          >
            채널 만들기
          </button>
        </div>
      </nav>

      {/* ── 모달 영역 ── */}
      <CreateChannelModal
        isOpen={isCreateChannelOpen}
        onClose={() => setIsCreateChannelOpen(false)}
        onSuccess={fetchChannels}
      />

      <PointShopModal
        isOpen={isPointShopOpen}
        onClose={handleShopClose}
        currentUser={currentUser}
      />

      <UserProfileModal
        isOpen={profileModalUserId !== null}
        onClose={() => setProfileModalUserId(null)}
        userId={profileModalUserId}
        onStartChat={(partner) => {
          openChatWith(partner);
          setProfileModalUserId(null);
        }}
      />

      {/* 하단 로그아웃 */}
      <div className="mt-auto p-4 border-t border-border">
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl text-foreground hover:bg-foreground/10 transition-all text-sm font-medium cursor-pointer"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4m7 14 5-5-5-5m5 5H9"/>
          </svg>
          로그아웃
        </button>
      </div>
    </aside>
  );
};

export default NavBar;
