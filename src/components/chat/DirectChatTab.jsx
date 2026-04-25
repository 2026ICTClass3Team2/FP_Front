import React, { useState, useEffect, useRef, useMemo } from 'react';
import { FiMessageSquare, FiSearch, FiUser, FiSend, FiArrowLeft, FiMoreVertical } from 'react-icons/fi';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import jwtAxios from '../../api/jwtAxios';
import useChatSocket from '../../hooks/useChatSocket';
import { getChatHistory, getChatConversations, markChatRead } from '../../api/chat';

const DirectChatTab = () => {
  // ─── State ───
  const [activePartner, setActivePartner] = useState(null); // 현재 활성화된 채팅 상대
  const [conversations, setConversations] = useState([]); // 대화 목록
  const [messages, setMessages] = useState([]); // 현재 대화의 메시지들
  const [searchQuery, setSearchQuery] = useState(''); // 유저 검색 쿼리
  const [searchResults, setSearchResults] = useState([]); // 검색 결과
  const [loading, setLoading] = useState(false);
  const [inputText, setInputText] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  const scrollRef = useRef(null);
  const me = JSON.parse(localStorage.getItem('user')); // 내 정보

  // ─── Socket Hook ───
  const { sendMessage } = useChatSocket({
    onNewMessage: (msg) => {
      // 1. 현재 열려있는 채팅방의 메시지인 경우 메시지 목록에 추가
      if (activePartner && (msg.senderId === activePartner.id || msg.senderId === me.id)) {
        setMessages((prev) => [...prev, msg]);
        // 내가 받은 메시지라면 읽음 처리 전송
        if (msg.senderId === activePartner.id) {
          markChatRead(activePartner.id).catch(console.error);
        }
      }
      
      // 2. 대화 목록(좌측 패널) 업데이트
      refreshConversations();
    }
  });

  // ─── 초기 데이터 로딩 ───
  useEffect(() => {
    refreshConversations();
  }, []);

  // ─── 대화방 변경 시 메시지 로딩 ───
  useEffect(() => {
    if (activePartner) {
      loadHistory(activePartner.id);
      markChatRead(activePartner.id).then(() => refreshConversations());
    } else {
      setMessages([]);
    }
  }, [activePartner]);

  // ─── 스크롤 하단 이동 ───
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // ─── 유저 검색 로직 (Debounce) ───
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (searchQuery.trim().length < 1) {
        setSearchResults([]);
        setIsSearching(false);
        return;
      }

      setLoading(true);
      setIsSearching(true);
      try {
        const response = await jwtAxios.get(`/member/search?query=${encodeURIComponent(searchQuery)}`);
        setSearchResults(response.data || []);
      } catch (error) {
        console.error('User search failed:', error);
      } finally {
        setLoading(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // ─── Action Handlers ───
  const refreshConversations = async () => {
    try {
      const data = await getChatConversations();
      setConversations(data);
    } catch (error) {
      console.error('Failed to load conversations:', error);
    }
  };

  const loadHistory = async (partnerId) => {
    try {
      const data = await getChatHistory(partnerId);
      // 백엔드는 최신순(DESC)으로 주므로 프론트에서는 시간순(ASC)으로 표시하기 위해 뒤집음
      setMessages(data.reverse());
    } catch (error) {
      console.error('Failed to load history:', error);
    }
  };

  const handleSend = (e) => {
    e.preventDefault();
    if (!inputText.trim() || !activePartner) return;

    const success = sendMessage(activePartner.id, inputText);
    if (success) {
      setInputText('');
    }
  };

  const handleUserSelect = (user) => {
    // 유저 객체 규격 맞추기 (검색 결과 vs 대화 목록)
    const partner = {
      id: user.id || user.partnerId,
      nickname: user.nickname || user.partnerNickname,
      profilePicUrl: user.profilePicUrl || user.partnerProfilePic
    };
    setActivePartner(partner);
    setSearchQuery('');
    setIsSearching(false);
  };

  // ─── Render Helpers ───
  const renderConversationList = () => (
    <div className="flex flex-col h-full bg-background">
      <div className="p-4 border-b border-border bg-muted/10">
        <h3 className="text-lg font-bold text-foreground">채팅</h3>
        <div className="relative mt-3">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="새 대화 시작하기 (아이디 검색)..." 
            className="w-full pl-9 pr-4 py-2 bg-muted/30 border border-border rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {isSearching ? (
          <div className="p-2">
            <p className="text-[10px] font-bold text-muted-foreground px-3 py-2 uppercase tracking-wider">검색 결과</p>
            {loading ? (
              <div className="flex justify-center p-4"><div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" /></div>
            ) : searchResults.length > 0 ? (
              searchResults.map(user => (
                <button key={user.id} onClick={() => handleUserSelect(user)} className="w-full flex items-center gap-3 p-3 hover:bg-muted/50 rounded-xl transition-colors">
                   <div className="w-10 h-10 rounded-full bg-muted border border-border overflow-hidden flex-shrink-0">
                    {user.profilePicUrl ? <img src={user.profilePicUrl} className="w-full h-full object-cover" /> : <FiUser className="m-auto text-muted-foreground" size={18} />}
                   </div>
                   <div className="text-left overflow-hidden">
                     <p className="text-sm font-bold text-foreground truncate">{user.nickname}</p>
                     <p className="text-[11px] text-muted-foreground truncate">@{user.username}</p>
                   </div>
                </button>
              ))
            ) : <p className="text-center text-xs text-muted-foreground py-10">검색 결과가 없습니다.</p>}
          </div>
        ) : conversations.length > 0 ? (
          <div className="p-2 space-y-1">
            {conversations.map((conv) => (
              <button
                key={conv.conversationId}
                onClick={() => handleUserSelect(conv)}
                className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all group ${activePartner?.id === conv.partnerId ? 'bg-primary/10' : 'hover:bg-muted/50'}`}
              >
                <div className="relative flex-shrink-0">
                  <div className="w-12 h-12 rounded-full bg-muted border border-border overflow-hidden">
                    {conv.partnerProfilePic ? <img src={conv.partnerProfilePic} className="w-full h-full object-cover" /> : <FiUser className="m-auto text-muted-foreground" size={20} />}
                  </div>
                  {conv.unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-[10px] font-bold px-1.5 py-0.5 rounded-full border-2 border-surface animate-bounce">
                      {conv.unreadCount}
                    </span>
                  )}
                </div>
                <div className="flex-1 text-left overflow-hidden">
                  <div className="flex justify-between items-baseline mb-0.5">
                    <span className="text-sm font-bold text-foreground truncate">{conv.partnerNickname}</span>
                    <span className="text-[10px] text-muted-foreground whitespace-nowrap ml-2">
                      {format(new Date(conv.lastMessageAt), 'p', { locale: ko })}
                    </span>
                  </div>
                  <p className={`text-xs truncate ${conv.unreadCount > 0 ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                    {conv.lastMessage}
                  </p>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-10 text-center text-muted-foreground h-full opacity-60">
            <FiMessageSquare size={40} className="mb-4" />
            <p className="text-sm font-medium">대화 내역이 없습니다</p>
            <p className="text-xs mt-1">상대방을 검색해 대화를 시작해보세요.</p>
          </div>
        )}
      </div>
    </div>
  );

  const renderChatWindow = () => (
    <div className="flex flex-col h-full bg-background animate-in slide-in-from-right-4 duration-300">
      {/* Header */}
      <div className="p-3 border-b border-border bg-surface flex items-center gap-3">
        <button onClick={() => setActivePartner(null)} className="p-2 hover:bg-muted rounded-full text-muted-foreground transition-colors">
          <FiArrowLeft size={20} />
        </button>
        <div className="w-10 h-10 rounded-full bg-muted border border-border overflow-hidden">
          {activePartner.profilePicUrl ? <img src={activePartner.profilePicUrl} className="w-full h-full object-cover" /> : <FiUser className="m-auto text-muted-foreground" size={18} />}
        </div>
        <div className="flex-1 overflow-hidden">
          <p className="text-sm font-bold text-foreground truncate">{activePartner.nickname}</p>
          <p className="text-[10px] text-success flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-success rounded-full" /> 실시간 연결됨
          </p>
        </div>
        <button className="p-2 text-muted-foreground hover:text-foreground"><FiMoreVertical /></button>
      </div>

      {/* Messages */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 bg-muted/5 custom-scrollbar"
      >
        {messages.map((msg, idx) => {
          const isMe = msg.senderId === me.id;
          const showTime = idx === messages.length - 1 || 
                           format(new Date(msg.createdAt), 'HH:mm') !== format(new Date(messages[idx+1].createdAt), 'HH:mm');

          return (
            <div key={msg.chatId || idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'} items-end gap-2`}>
              {!isMe && (
                 <div className="w-8 h-8 rounded-full bg-muted border border-border overflow-hidden flex-shrink-0 mb-1">
                   {msg.senderProfilePic ? <img src={msg.senderProfilePic} className="w-full h-full object-cover" /> : <FiUser className="m-auto text-muted-foreground" size={14} />}
                 </div>
              )}
              <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-[75%]`}>
                <div className={`px-4 py-2.5 rounded-2xl text-sm shadow-sm leading-relaxed ${
                  isMe ? 'bg-primary text-primary-foreground rounded-tr-none' : 'bg-surface border border-border rounded-tl-none text-foreground'
                }`}>
                  {msg.content}
                </div>
                {showTime && (
                  <span className="text-[9px] text-muted-foreground mt-1 px-1">
                    {format(new Date(msg.createdAt), 'a h:mm', { locale: ko })}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="p-4 bg-surface border-t border-border flex gap-2">
        <input 
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="메시지를 입력하세요..."
          className="flex-1 bg-muted/40 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 transition-all outline-none"
        />
        <button 
          type="submit"
          disabled={!inputText.trim()}
          className="w-12 h-12 bg-primary text-primary-foreground rounded-xl flex items-center justify-center disabled:opacity-50 disabled:grayscale transition-all hover:scale-105 active:scale-95 shadow-lg"
        >
          <FiSend size={18} />
        </button>
      </form>
    </div>
  );

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {activePartner ? renderChatWindow() : renderConversationList()}
    </div>
  );
};

export default DirectChatTab;
