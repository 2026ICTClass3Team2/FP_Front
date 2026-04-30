// Header.tsx
import { Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import React, { useState, useEffect, useRef } from 'react';
import { getRecentNotifications, markAsRead } from '../../api/notification';
import { FiBell, FiCheckCircle, FiActivity, FiTrendingUp, FiClock, FiHeart } from 'react-icons/fi';
// WebSocket 훅: 폴링(setInterval) 대신 서버 푸시를 통해 알림을 실시간으로 받습니다.
import useNotificationSocket from '../../hooks/useNotificationSocket';
import ChatDropdown from '../chat/ChatDropdown';
import { globalSearch } from '../../api/search';
import UserProfileModal from '../common/UserProfileModal';
import PointShopModal from '../../pages/shop/PointShopModal';
import { useChatStore } from '../../stores/chatStore';


const Header = ({ onToggleSidebar, sidebarOpen }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'ALGORITHM';

  const handleTabChange = (tab) => {
    if (location.pathname !== '/') {
      navigate(`/?tab=${tab}`);
    } else {
      setSearchParams({ tab });
    }
  };

  const handleLogoClick = (e) => {
    if (location.pathname === '/') {
      e.preventDefault();
      navigate(0); // 같은 경로면 강제 새로고침
    }
  };

  const [notifications, setNotifications] = useState([]);
  const generalNotifications = notifications.filter(n => n.targetType !== 'chat' && n.targetType !== 'bot');
  const chatNotifications = notifications.filter(n => n.targetType === 'chat' || n.targetType === 'bot');

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isPointShopOpen, setIsPointShopOpen] = useState(false);

  // 검색 관련 상태
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState({ posts: [], users: [], channels: [] });
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // 유저 프로필 모달 상태
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);

  const { isChatOpen, openChat, closeChat, openChatWith, notificationVersion } = useChatStore();

  const handleStartChatFromModal = (partner) => {
    openChatWith(partner);
    setIsUserModalOpen(false);
    setSelectedUserId(null);
  };

  const dropdownRef = useRef(null);
  const chatRef = useRef(null);
  const searchRef = useRef(null);
  const debounceTimer = useRef(null);


  const fetchNotifications = async () => {
    try {
      const data = await getRecentNotifications();
      setNotifications(data);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  // 채팅 읽음 처리 시 헤더 알림 배지 즉시 갱신
  useEffect(() => {
    if (notificationVersion > 0) fetchNotifications();
  }, [notificationVersion]);

  // WebSocket 훅 등록: 서버에서 알림 푸시 신호를 받으면 fetchNotifications를 호출합니다.
  // 이는 기존 setInterval(60초) 폴링을 완전히 대체합니다.
  useNotificationSocket({ onNewNotification: fetchNotifications });

  useEffect(() => {
    const handleClickOutside = (event) => {
      // 알림 드롭다운 외부 클릭 감지
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
      // 채팅 드롭다운 외부 클릭 감지
      if (chatRef.current && !chatRef.current.contains(event.target)) {
        closeChat();
      }
      // 검색 결과 외부 클릭 감지
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 검색 디바운싱 처리
  useEffect(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    if (!searchQuery.trim()) {
      setSearchResults({ posts: [], users: [], channels: [] });
      setIsSearchOpen(false);
      return;
    }

    setIsLoading(true);
    debounceTimer.current = setTimeout(async () => {
      try {
        const results = await globalSearch(searchQuery);
        setSearchResults(results);
        setIsSearchOpen(true);
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setIsLoading(false);
      }
    }, 400); // 400ms 디바운스

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [searchQuery]);


  const handleMarkAsRead = async () => {
    if (generalNotifications.length === 0) return;
    const ids = generalNotifications.map(n => n.id);
    try {
      await markAsRead(ids);
      setNotifications(prev => prev.filter(n => n.targetType === 'chat' || n.targetType === 'bot'));
      setIsDropdownOpen(false);
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const handleIndividualMarkAsRead = async (e, id) => {
    e.stopPropagation();
    try {
      await markAsRead([id]);
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch (error) {
      console.error('Failed to mark individual as read:', error);
    }
  };

  const handleNotificationClick = async (n) => {
    // 1. Mark as read first
    if (!n.isRead) {
      try {
        await markAsRead([n.id]);
      } catch (error) {
        console.error('Failed to mark as read on click:', error);
      }
    }

    // 2. Navigate based on type
    setIsDropdownOpen(false);

    switch (n.targetType) {
      case 'post':
      case 'comment':
      case 'mention':
        if (n.qnaId) {
          window.location.href = `/qna?qnaId=${n.qnaId}${n.targetType !== 'post' ? `&commentId=${n.targetId}` : ''}`;
        } else if (n.postId) {
          window.location.href = `/?postId=${n.postId}${n.targetType !== 'post' ? `&commentId=${n.targetId}` : ''}`;
        }
        break;
      case 'user':
        if (n.message.includes('게시글을 올렸습니다')) {
          navigate(`/?postId=${n.targetId}`);
        } else if (n.message.includes('팔로우')) {
          window.location.href = `/profile/${n.targetId}`;
        } else {
          window.location.href = '/mypage';
        }
        break;
      case 'system':
        if (n.message.includes('point') || n.message.includes('포인트')) {
          setIsPointShopOpen(true);
        }
        break;
      case 'channel':
        if (n.message.includes('게시글이 올라왔습니다')) {
          navigate(`/?postId=${n.targetId}`);
        } else {
          window.location.href = `/channel/${n.targetId}`;
        }
        break;
      default:
        fetchNotifications();
    }
  };

  const handleAllNotifications = () => {
    setIsDropdownOpen(false);
    navigate('/mypage/notifications');
  };

  return (
    <>
      <header className="h-16 border-b border-border bg-surface/90 backdrop-blur-md flex items-center px-4 md:px-6 shrink-0 sticky top-0 z-40 shadow-md">

        {/* 왼쪽 로고 + 사이드바 토글 */}
        <div className="flex-1 min-w-[150px] flex items-center gap-2">
          {/* 햄버거 토글 버튼 */}
          <button
            onClick={onToggleSidebar}
            className="p-2 rounded-xl text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-all cursor-pointer"
            title={sidebarOpen ? '사이드바 닫기' : '사이드바 열기'}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
          <Link to="/" onClick={handleLogoClick} className="inline-flex items-center gap-3 text-foreground">
            {/* 앱 아이콘 */}
            <h1 className="font-black text-xl tracking-[0px] flex items-center gap-3">
              Dead
              {/* 앱 아이콘 */}
              <svg xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="lucide lucide-bug-off-icon lucide-bug-off"
                style={{ transition: 'none' }}>
                <path d="M12 20v-8" /><path d="M12.656 7H14a4 4 0 0 1 4 4v1.344" />
                <path d="M14.12 3.88 16 2" /><path d="M17.123 17.123A6 6 0 0 1 6 14v-3a4 4 0 0 1 1.72-3.287" />
                <path d="m2 2 20 20" /><path d="M21 5a4 4 0 0 1-3.55 3.97" />
                <path d="M22 13h-3.344" /><path d="M3 21a4 4 0 0 1 3.81-4" />
                <path d="M3 5a4 4 0 0 0 3.55 3.97" /><path d="M6 13H2" />
                <path d="m8 2 1.88 1.88" /><path d="M9.712 4.06A3 3 0 0 1 15 6v1.13" />
              </svg>
              Bug
            </h1>
          </Link>
        </div>

        {/* 중앙 탭 아이콘 (피드 네비게이션) */}
        <div className="flex items-center justify-center gap-1 flex-1">
          <button onClick={() => handleTabChange('ALGORITHM')} className={`px-8 py-2.5 rounded-xl transition-all cursor-pointer ${activeTab === 'ALGORITHM' && location.pathname === '/' ? 'text-primary bg-primary/10 shadow-sm' : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'}`} title="맞춤">
            <FiActivity size={22} className={activeTab === 'ALGORITHM' && location.pathname === '/' ? 'stroke-[2.5px]' : ''} />
          </button>
          <button onClick={() => handleTabChange('POPULAR')} className={`px-8 py-2.5 rounded-xl transition-all cursor-pointer ${activeTab === 'POPULAR' && location.pathname === '/' ? 'text-primary bg-primary/10 shadow-sm' : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'}`} title="인기">
            <FiTrendingUp size={22} className={activeTab === 'POPULAR' && location.pathname === '/' ? 'stroke-[2.5px]' : ''} />
          </button>
          <button onClick={() => handleTabChange('LATEST')} className={`px-8 py-2.5 rounded-xl transition-all cursor-pointer ${activeTab === 'LATEST' && location.pathname === '/' ? 'text-primary bg-primary/10 shadow-sm' : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'}`} title="최신">
            <FiClock size={22} className={activeTab === 'LATEST' && location.pathname === '/' ? 'stroke-[2.5px]' : ''} />
          </button>
          <button onClick={() => handleTabChange('SUBSCRIBED')} className={`px-8 py-2.5 rounded-xl transition-all cursor-pointer ${activeTab === 'SUBSCRIBED' && location.pathname === '/' ? 'text-primary bg-primary/10 shadow-sm' : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'}`} title="구독">
            <FiHeart size={22} className={activeTab === 'SUBSCRIBED' && location.pathname === '/' ? 'stroke-[2.5px]' : ''} />
          </button>
        </div>

        {/* 우측 아이콘 및 검색바 */}
        <div className="flex-1 flex items-center gap-3 justify-end min-w-[150px]">
          {/* 작아진 검색바 */}
          <div className="relative hidden lg:block w-64" ref={searchRef}>
            <div className="search-input flex items-center w-full h-11 pl-11 pr-4 text-sm relative">
              {/* 검색 아이콘 */}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-5 h-5 text-muted-foreground absolute left-4"
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
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => searchQuery && setIsSearchOpen(true)}
                placeholder="무엇이든 검색하세요"
                className="flex-1 bg-transparent outline-none text-foreground placeholder:text-muted-foreground text-base"
              />
              {isLoading && (
                <div className="absolute right-4 animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />
              )}
            </div>

            {/* 검색 결과 드롭다운 */}
            {isSearchOpen && (

              <div className="absolute top-full left-0 w-full mt-2 bg-surface border border-border rounded-xl shadow-2xl overflow-hidden z-[110] animate-in fade-in slide-in-from-top-2">
                <div className="max-h-[480px] overflow-y-auto">
                  {/* 포스트 결과 */}
                  {searchResults.posts.length > 0 && (
                    <div className="p-2">
                      <div className="px-3 py-1 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">포스트</div>
                      {searchResults.posts.map(post => (
                        <div
                          key={post.id}
                          onClick={() => { navigate(`/?postId=${post.id}`); setIsSearchOpen(false); }}
                          className="flex items-center gap-3 p-3 hover:bg-muted/50 rounded-lg cursor-pointer transition-colors"
                        >
                          {post.thumbnailUrl && (
                            <div className="w-10 h-10 rounded-md overflow-hidden flex-shrink-0 bg-muted">
                              <img src={post.thumbnailUrl} alt="" className="w-full h-full object-cover" />
                            </div>
                          )}
                          <div className="flex flex-col min-w-0">
                            <span className="text-sm font-semibold text-foreground line-clamp-1">{post.title}</span>
                            <span className="text-[11px] text-muted-foreground line-clamp-1">{post.body}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* 채널 결과 */}
                  {searchResults.channels.length > 0 && (
                    <div className="p-2 border-t border-border/50">
                      <div className="px-3 py-1 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">채널</div>
                      <div className="grid grid-cols-1 gap-1">
                        {searchResults.channels.map(channel => (
                          <div
                            key={channel.id}
                            onClick={() => { navigate(`/channels/${channel.id}`); setIsSearchOpen(false); }}
                            className="flex items-center gap-3 p-2 hover:bg-muted/50 rounded-lg cursor-pointer transition-colors"
                          >
                            <div className="w-8 h-8 rounded-lg bg-muted flex-shrink-0 overflow-hidden">
                              {channel.imageUrl ? <img src={channel.imageUrl} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full bg-primary/10" />}
                            </div>
                            <div className="flex flex-col">
                              <span className="text-sm font-semibold text-foreground">{channel.name}</span>
                              <span className="text-[10px] text-muted-foreground line-clamp-1">{channel.description}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 유저 결과 */}
                  {searchResults.users.length > 0 && (
                    <div className="p-2 border-t border-border/50">
                      <div className="px-3 py-1 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">사용자</div>
                      <div className="grid grid-cols-2 gap-1">
                        {searchResults.users.map(user => (
                          <div
                            key={user.id}
                            onClick={() => { setSelectedUserId(user.id); setIsUserModalOpen(true); setIsSearchOpen(false); }}
                            className="flex items-center gap-2 p-2 hover:bg-muted/50 rounded-lg cursor-pointer transition-colors"
                          >
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary flex-shrink-0 overflow-hidden">
                              {user.profilePicUrl ? (
                                <img src={user.profilePicUrl} alt="" className="w-full h-full object-cover" />
                              ) : (
                                user.nickname.charAt(0)
                              )}
                            </div>
                            <div className="flex flex-col truncate">
                              <span className="text-sm font-semibold text-foreground truncate">{user.nickname}</span>
                              <span className="text-[10px] text-muted-foreground truncate">@{user.username}</span>
                            </div>


                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 결과 없음 */}
                  {searchResults.posts.length === 0 && searchResults.users.length === 0 && searchResults.channels.length === 0 && (
                    <div className="p-8 text-center text-muted-foreground">
                      <p className="text-sm">검색 결과가 없습니다</p>
                      <p className="text-[11px] mt-1 opacity-70">다른 검색어를 입력해 보세요</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          <div className="relative" ref={chatRef}>
            <button
              onClick={() => isChatOpen ? closeChat() : openChat()}
              className="p-2 text-foreground hover:bg-foreground/10 rounded transition-colors cursor-pointer"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"
                className="lucide lucide-bot-message-square-icon lucide-bot-message-square relative">
                <path d="M12 6V2H8" />
                <path d="M15 11v2" />
                <path d="M2 12h2" />
                <path d="M20 12h2" />
                <path d="M20 16a2 2 0 0 1-2 2H8.828a2 2 0 0 0-1.414.586l-2.202 
              2.202A.71.71 0 0 1 4 20.286V8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2z"/>
                <path d="M9 11v2" />
              </svg>
              {chatNotifications.length > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] flex items-center justify-center rounded-full pointer-events-none">
                  {chatNotifications.length > 5 ? '5+' : chatNotifications.length}
                </span>
              )}
            </button>

            {isChatOpen && <ChatDropdown />}
          </div>

          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="p-2 text-foreground hover:bg-foreground/10 rounded transition-colors relative cursor-pointer"
            >
              <FiBell size={24} />
              {generalNotifications.length > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] flex items-center justify-center rounded-full">
                  {generalNotifications.length > 5 ? '5+' : generalNotifications.length}
                </span>
              )}
            </button>

            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-80 bg-surface border border-border rounded-xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 z-[100]">
                <div className="p-4 border-b border-border flex justify-between items-center bg-muted/50">
                  <span className="font-bold text-sm">알림</span>
                  <button
                    onClick={handleMarkAsRead}
                    className="text-xs text-primary hover:underline font-bold"
                  >
                    모두 읽음
                  </button>
                </div>

                <div className="max-h-96 overflow-y-auto bg-surface">
                  {generalNotifications.length > 0 ? (
                    generalNotifications.map((n) => (
                      <div
                        key={n.id}
                        className="group p-4 border-b border-border last:border-0 hover:bg-muted/40 transition-colors cursor-pointer relative"
                        onClick={() => handleNotificationClick(n)}
                      >
                        <div className="flex justify-between items-start gap-2 pr-6">
                          <p className="text-sm text-foreground leading-snug">{n.message}</p>
                          <button
                            onClick={(e) => handleIndividualMarkAsRead(e, n.id)}
                            className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-primary/10 rounded-full text-primary transition-all absolute right-2 top-3"
                            title="읽음 처리"
                          >
                            <FiCheckCircle size={14} />
                          </button>
                        </div>
                        <span className="text-[10px] text-muted-foreground mt-1 block">
                          {new Date(n.createdAt).toLocaleString()}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="p-10 text-center text-muted-foreground text-sm">
                      새로운 알림이 없습니다
                    </div>
                  )}
                </div>

                <button
                  onClick={handleAllNotifications}
                  className="w-full p-3 text-center text-xs font-bold text-muted-foreground hover:bg-muted/50 transition-colors border-t border-border bg-muted/20"
                >
                  전체 알림 보기
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <UserProfileModal
        isOpen={isUserModalOpen}
        onClose={() => { setIsUserModalOpen(false); setSelectedUserId(null); }}
        userId={selectedUserId}
        onStartChat={handleStartChatFromModal}
      />
      <PointShopModal isOpen={isPointShopOpen} onClose={() => setIsPointShopOpen(false)} />
    </>
  );
};

export default Header;