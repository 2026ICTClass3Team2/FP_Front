import React, { useState, useEffect } from 'react';
import { FiMessageSquare, FiSearch, FiUser } from 'react-icons/fi';
import jwtAxios from '../../api/jwtAxios';

const DirectChatTab = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);

  // 검색 로직 (Debounce 적용)
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (searchQuery.trim().length < 1) {
        setSearchResults([]);
        return;
      }

      setLoading(true);
      try {
        const response = await jwtAxios.get(`/member/search?query=${encodeURIComponent(searchQuery)}`);
        setSearchResults(response.data || []);
      } catch (error) {
        console.error('User search failed:', error);
      } finally {
        setLoading(false);
      }
    }, 400); // 400ms 디바운스

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleUserClick = (user) => {
    // 향후 실제 채팅방 오픈 로직이 들어갈 자리입니다.
    console.log('Selected user for chat:', user);
  };

  return (
    <div className="flex flex-col h-full animate-in fade-in slide-in-from-left-4 duration-300">
      <div className="p-6 border-b border-border bg-muted/20">
        <h3 className="text-xl font-bold text-foreground">1:1 채팅</h3>
        <p className="text-sm text-muted-foreground mt-1">팔로워와 실시간 대화를 나눠보세요.</p>
        
        <div className="relative mt-4">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="닉네임 또는 아이디로 검색..." 
            className="w-full pl-9 pr-4 py-2.5 bg-background border border-border rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {loading ? (
          <div className="flex justify-center p-8">
            <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          </div>
        ) : searchResults.length > 0 ? (
          <div className="p-2">
            {searchResults.map((user) => (
              <button
                key={user.id}
                onClick={() => handleUserClick(user)}
                className="w-full flex items-center gap-3 p-3 hover:bg-muted/50 rounded-xl transition-colors group"
              >
                <div className="w-10 h-10 rounded-full overflow-hidden bg-muted flex items-center justify-center border border-border">
                  {user.profilePicUrl ? (
                    <img src={user.profilePicUrl} alt={user.nickname} className="w-full h-full object-cover" />
                  ) : (
                    <FiUser className="text-muted-foreground" size={20} />
                  )}
                </div>
                <div className="flex flex-col items-start overflow-hidden">
                  <span className="text-sm font-bold text-foreground truncate w-full">{user.nickname}</span>
                  <span className="text-[11px] text-muted-foreground truncate w-full">@{user.username}</span>
                </div>
                <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
                  <FiMessageSquare className="text-primary" size={18} />
                </div>
              </button>
            ))}
          </div>
        ) : searchQuery.trim() !== '' ? (
          <div className="p-10 text-center text-muted-foreground text-sm">
            검색 결과가 없습니다.
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-10 text-center">
            <div className="w-16 h-16 bg-muted/50 rounded-full flex items-center justify-center text-muted-foreground mb-4">
              <FiMessageSquare size={30} />
            </div>
            <p className="text-sm font-medium text-foreground">채팅 내역이 없습니다</p>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              대화를 시작하려면 사용자 프로필에서<br/>채팅 버튼을 눌러보거나 위에서 검색해보세요.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DirectChatTab;
