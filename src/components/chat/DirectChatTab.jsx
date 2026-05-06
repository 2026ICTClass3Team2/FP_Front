import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { FiMessageSquare, FiSearch, FiUser, FiSend, FiArrowLeft, FiMoreVertical, FiLogOut, FiEdit2, FiTrash2 } from 'react-icons/fi';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import jwtAxios from '../../api/jwtAxios';
import useChatSocket from '../../hooks/useChatSocket';
import { getChatHistory, getChatConversations, markChatRead, leaveConversation } from '../../api/chat';
import UserProfileModal from '../common/UserProfileModal';
import { useChatStore } from '../../stores/chatStore';

const DirectChatTab = () => {
  // ─── State ───
  const [activePartner, setActivePartner] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [inputText, setInputText] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const [contextMenu, setContextMenu] = useState(null);    // { x, y, conv }
  const [msgContextMenu, setMsgContextMenu] = useState(null); // { x, y, msg }
  const [editingMsgId, setEditingMsgId] = useState(null);
  const [editText, setEditText] = useState('');

  const scrollRef = useRef(null);
  const editInputRef = useRef(null);

  const { pendingPartner, clearPendingPartner, bumpNotificationVersion } = useChatStore();
  const me = JSON.parse(localStorage.getItem('user'));
  const myId = me?.userId || me?.id;

  // ─── Socket Hook ───
  const { sendMessage, sendRaw } = useChatSocket({
    onNewMessage: (data) => {
      if (data.type === 'NEW_MESSAGE') {
        const isFromPartner = String(data.senderId) === String(activePartner?.id);
        const isFromMe = String(data.senderId) === String(myId);
        if (activePartner && (isFromPartner || isFromMe)) {
          setMessages((prev) => [...prev, data]);
          if (isFromPartner) {
            markChatRead(activePartner.id)
              .then(() => bumpNotificationVersion())
              .catch(console.error);
          }
        }
        refreshConversations();
      } else if (data.type === 'EDIT_MESSAGE') {
        setMessages(prev => prev.map(m =>
          m.chatId === data.chatId ? { ...m, content: data.content, isEdited: true } : m
        ));
      } else if (data.type === 'DELETE_MESSAGE') {
        setMessages(prev => prev.map(m =>
          m.chatId === data.chatId ? { ...m, isDeleted: true, content: null } : m
        ));
      }
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
      markChatRead(activePartner.id).then(() => {
        refreshConversations();
        bumpNotificationVersion();
      });
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

  // ─── 헤더 UserProfileModal에서 1:1 채팅 클릭 시 파트너 수신 ───
  useEffect(() => {
    if (pendingPartner) {
      handleUserSelect(pendingPartner);
      clearPendingPartner();
    }
  }, [pendingPartner]);

  // ─── 메뉴 외부 클릭 시 닫기 ───
  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // ─── 편집 모드 진입 시 input 포커스 및 커서 끝으로 이동 ───
  useEffect(() => {
    if (editingMsgId && editInputRef.current) {
      editInputRef.current.focus();
      const len = editInputRef.current.value.length;
      editInputRef.current.setSelectionRange(len, len);
    }
  }, [editingMsgId]);

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
      setMessages(data.reverse());
    } catch (error) {
      console.error('Failed to load history:', error);
    }
  };

  const handleSend = (e) => {
    e.preventDefault();
    if (!inputText.trim() || !activePartner) return;
    const success = sendMessage(activePartner.id, inputText);
    if (success) setInputText('');
  };

  const handleUserSelect = (user) => {
    const partner = {
      id: user.id || user.partnerId,
      nickname: user.nickname || user.partnerNickname,
      profilePicUrl: user.profilePicUrl || user.partnerProfilePic
    };
    setActivePartner(partner);
    setSearchQuery('');
    setIsSearching(false);
  };

  const handleLeaveChat = async (partnerId) => {
    const targetId = partnerId ?? activePartner?.id;
    if (!targetId) return;
    try {
      await leaveConversation(targetId);
      setConversations(prev => prev.filter(c => c.partnerId !== targetId));
      if (activePartner?.id === targetId) setActivePartner(null);
      setIsMenuOpen(false);
      setContextMenu(null);
    } catch (err) {
      console.error('Failed to leave conversation:', err);
    }
  };

  const handleConversationContextMenu = (e, conv) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ x: e.clientX, y: e.clientY, conv });
  };

  const handleStartChatFromModal = (partner) => {
    handleUserSelect(partner);
    setSelectedUserId(null);
  };

  const handleMsgContextMenu = (e, msg) => {
    e.preventDefault();
    e.stopPropagation();
    setMsgContextMenu({ x: e.clientX, y: e.clientY, msg });
  };

  const startEdit = (msg) => {
    setEditingMsgId(msg.chatId);
    setEditText(msg.content ?? '');
  };

  const cancelEdit = () => {
    setEditingMsgId(null);
    setEditText('');
  };

  const submitEdit = (e) => {
    e.preventDefault();
    if (!editText.trim() || !editingMsgId) return;
    sendRaw({ type: 'EDIT', chatId: editingMsgId, content: editText.trim() });
    setEditingMsgId(null);
    setEditText('');
  };

  const handleDeleteMsg = (chatId) => {
    sendRaw({ type: 'DELETE', chatId });
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
                    {user.profilePicUrl ? <img src={user.profilePicUrl} className="w-full h-full object-cover" alt="" /> : <FiUser className="m-auto text-muted-foreground" size={18} />}
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
                onContextMenu={(e) => handleConversationContextMenu(e, conv)}
                className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all group ${activePartner?.id === conv.partnerId ? 'bg-primary/10' : 'hover:bg-muted/50'}`}
              >
                <div className="relative flex-shrink-0">
                  <div className="w-12 h-12 rounded-full bg-muted border border-border overflow-hidden">
                    {conv.partnerProfilePic ? <img src={conv.partnerProfilePic} className="w-full h-full object-cover" alt="" /> : <FiUser className="m-auto text-muted-foreground" size={20} />}
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
        <button
          onClick={() => setSelectedUserId(activePartner.id)}
          className="w-10 h-10 rounded-full bg-muted border border-border overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
        >
          {activePartner.profilePicUrl ? <img src={activePartner.profilePicUrl} className="w-full h-full object-cover" alt="profile" /> : <FiUser className="m-auto text-muted-foreground h-full" size={18} />}
        </button>
        <div className="flex-1 overflow-hidden">
          <button onClick={() => setSelectedUserId(activePartner.id)} className="text-sm font-bold text-foreground truncate cursor-pointer hover:underline">
            {activePartner.nickname}
          </button>
          <p className="text-[10px] text-success flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-success rounded-full" /> 실시간 연결됨
          </p>
        </div>
        <div ref={menuRef} className="relative">
          <button
            onClick={() => setIsMenuOpen(prev => !prev)}
            className="p-2 text-muted-foreground hover:text-foreground rounded-full hover:bg-muted transition-colors"
          >
            <FiMoreVertical />
          </button>
          {isMenuOpen && (
            <div className="absolute right-0 top-10 w-36 bg-surface border border-border rounded-xl shadow-lg z-10 overflow-hidden">
              <button
                onClick={() => handleLeaveChat()}
                className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-destructive hover:bg-destructive/10 transition-colors"
              >
                <FiLogOut size={14} />
                나가기
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 bg-muted/5 custom-scrollbar"
      >
        {messages.map((msg, idx) => {
          const isMe = String(msg.senderId) === String(myId);
          const showTime = idx === messages.length - 1 ||
            format(new Date(msg.createdAt), 'HH:mm') !== format(new Date(messages[idx + 1].createdAt), 'HH:mm');
          const isEditing = editingMsgId === msg.chatId;

          return (
            <div key={msg.chatId || idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'} items-end gap-2 group`}>
              {!isMe && (
                <button
                  onClick={() => setSelectedUserId(msg.senderId)}
                  className="w-9 h-9 rounded-full bg-muted border border-border overflow-hidden flex-shrink-0 mb-1 shadow-sm cursor-pointer hover:opacity-80 transition-opacity"
                >
                  {msg.senderProfilePic ? (
                    <img src={msg.senderProfilePic} className="w-full h-full object-cover" alt="profile" />
                  ) : (
                    <FiUser className="m-auto text-muted-foreground h-full" size={16} />
                  )}
                </button>
              )}

              <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-[70%]`}>
                {!isMe && (
                  <button
                    onClick={() => setSelectedUserId(msg.senderId)}
                    className="text-[11px] font-bold text-muted-foreground ml-1 mb-1 px-1 cursor-pointer hover:underline text-left"
                  >
                    {msg.senderNickname}
                  </button>
                )}

                {isEditing ? (
                  <form onSubmit={submitEdit} className="flex flex-col gap-1 w-full min-w-[200px]">
                    <div className="flex gap-1">
                    <input
                      ref={editInputRef}
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Escape') cancelEdit(); }}
                      maxLength={500}
                      className="flex-1 bg-muted/40 border border-primary/40 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                    />
                    <button
                      type="submit"
                      disabled={!editText.trim()}
                      className="px-3 py-2 bg-primary text-primary-foreground rounded-xl text-xs font-bold disabled:opacity-50 transition-all"
                    >
                      저장
                    </button>
                    <button
                      type="button"
                      onClick={cancelEdit}
                      className="px-3 py-2 bg-muted text-muted-foreground rounded-xl text-xs font-bold hover:bg-muted/70 transition-all"
                    >
                      취소
                    </button>
                    </div>
                    <div className={`text-right text-xs ${editText.length >= 500 ? 'text-red-500 font-medium' : editText.length >= 450 ? 'text-orange-400' : 'text-muted-foreground'}`}>
                      {editText.length} / 500
                    </div>
                  </form>
                ) : (
                  <div
                    onContextMenu={isMe && !msg.isDeleted ? (e) => handleMsgContextMenu(e, msg) : undefined}
                    className={`relative px-4 py-2.5 rounded-2xl text-[13px] shadow-sm leading-relaxed transition-all ${
                      isMe
                        ? 'bg-gradient-to-br from-indigo-600 to-violet-600 text-white rounded-tr-none hover:shadow-indigo-500/20'
                        : 'bg-surface border border-border rounded-tl-none text-foreground hover:border-primary/30'
                    } ${isMe && !msg.isDeleted ? 'cursor-context-menu' : ''}`}
                  >
                    {msg.isDeleted ? (
                      <span className="italic opacity-60">삭제된 메시지입니다.</span>
                    ) : (
                      <>
                        {msg.content}
                        {msg.isEdited && (
                          <span className="text-[10px] opacity-50 ml-1.5">(수정됨)</span>
                        )}
                      </>
                    )}
                  </div>
                )}

                {showTime && !isEditing && (
                  <span className="text-[9px] text-muted-foreground mt-1 px-1 opacity-70 group-hover:opacity-100 transition-opacity">
                    {format(new Date(msg.createdAt), 'a h:mm', { locale: ko })}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="p-4 bg-surface border-t border-border flex flex-col gap-1">
        <div className="flex gap-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="메시지를 입력하세요..."
            maxLength={500}
            className="flex-1 bg-muted/40 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 transition-all outline-none"
          />
          <button
            type="submit"
            disabled={!inputText.trim()}
            className="w-12 h-12 bg-primary text-primary-foreground rounded-xl flex items-center justify-center disabled:opacity-50 disabled:grayscale transition-all hover:scale-105 active:scale-95 shadow-lg"
          >
            <FiSend size={18} />
          </button>
        </div>
        <div className={`text-right text-xs ${inputText.length >= 500 ? 'text-red-500 font-medium' : inputText.length >= 450 ? 'text-orange-400' : 'text-muted-foreground'}`}>
          {inputText.length} / 500
        </div>
      </form>
    </div>
  );

  return (
    <>
      <div className="flex flex-col h-full overflow-hidden">
        {activePartner ? renderChatWindow() : renderConversationList()}
      </div>

      {/* 대화 목록 우클릭 컨텍스트 메뉴 */}
      {contextMenu && createPortal(
        <>
          <div
            className="fixed inset-0 z-[9998]"
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => { e.stopPropagation(); setContextMenu(null); }}
          />
          <div
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
            style={{ top: contextMenu.y, left: contextMenu.x }}
            className="fixed z-[9999] bg-surface border border-border rounded-xl shadow-lg overflow-hidden w-32"
          >
            <button
              onClick={() => handleLeaveChat(contextMenu.conv.partnerId)}
              className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-destructive bg-transparent hover:bg-muted/50 cursor-pointer transition-colors"
            >
              <FiLogOut size={14} />
              나가기
            </button>
          </div>
        </>,
        document.body
      )}

      {/* 메시지 우클릭 컨텍스트 메뉴 */}
      {msgContextMenu && createPortal(
        <>
          <div
            className="fixed inset-0 z-[9998]"
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => { e.stopPropagation(); setMsgContextMenu(null); }}
          />
          <div
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
            style={{ top: msgContextMenu.y, left: msgContextMenu.x }}
            className="fixed z-[9999] bg-surface border border-border rounded-xl shadow-lg overflow-hidden w-32"
          >
            <button
              onClick={() => { startEdit(msgContextMenu.msg); setMsgContextMenu(null); }}
              className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-foreground hover:bg-muted/50 transition-colors"
            >
              <FiEdit2 size={14} />
              수정
            </button>
            <button
              onClick={() => { handleDeleteMsg(msgContextMenu.msg.chatId); setMsgContextMenu(null); }}
              className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-destructive hover:bg-destructive/10 transition-colors"
            >
              <FiTrash2 size={14} />
              삭제
            </button>
          </div>
        </>,
        document.body
      )}

      {/* User Profile Modal */}
      <UserProfileModal
        isOpen={!!selectedUserId}
        userId={selectedUserId}
        onClose={() => setSelectedUserId(null)}
        onStartChat={handleStartChatFromModal}
      />
    </>
  );
};

export default DirectChatTab;