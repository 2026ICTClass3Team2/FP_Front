import React, { useState, useEffect, use } from 'react';
import { getAllNotifications, markAllAsRead, markAsRead, getNotificationSettings, updateNotificationSettings } from '../../api/notification';
import { FiSettings, FiCheckCircle, FiBell } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

const NotificationTab = () => {
  const [notifications, setNotifications] = useState([]);
  const [filter, setFilter] = useState('all');
  const [settings, setSettings] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchNotifications();
  }, [filter]);

  const fetchNotifications = async () => {
    try {
      const data = await getAllNotifications(filter);
      setNotifications(data);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead();
      fetchNotifications();
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const openSettings = async () => {
    try {
      const data = await getNotificationSettings();
      setSettings(data);
      setIsModalOpen(true);
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    }
  };

  const handleToggleSetting = (key) => {
    setSettings({ ...settings, [key]: !settings[key] });
  };

  const saveSettings = async () => {
    try {
      await updateNotificationSettings(settings);
      setIsModalOpen(false);
    } catch (error) {
      console.error('Failed to update settings:', error);
    }
  };

  const getFilterClass = (f) => (
    `px-4 py-2 rounded-full text-sm font-medium transition-all ${
      filter === f 
        ? 'bg-primary text-primary-foreground shadow-md' 
        : 'bg-muted text-muted-foreground hover:bg-muted/80'
    }`
  );

  const handleIndividualMarkAsRead = async (e, id) => {
    e.stopPropagation();
    try {
      // Optimistic update
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
      await markAsRead([id]);
    } catch (error) {
      console.error('Failed to mark individual as read:', error);
      fetchNotifications(); // Rollback on error
    }
  };

  const handleNotificationClick = async (n) => {
    if (!n.isRead) {
      try {
        // Optimistic update
        setNotifications(prev => prev.map(item => item.id === n.id ? { ...item, isRead: true } : item));
        await markAsRead([n.id]);
      } catch (error) {
        console.error('Failed to mark as read on click:', error);
        fetchNotifications(); // Rollback
      }
    }
    switch (n.targetType) {
      case 'post':
      case 'comment':
      case 'mention':
        if (n.qnaId) {
          // window.location.href = `/qna?qnaId=${n.qnaId}${n.targetType !== 'post' ? `&commentId=${n.targetId}` : ''}`;
          navigate(`/qna?qnaId=${n.qnaId}${n.targetType !== 'post' ? `&commentId=${n.targetId}` : ''}`);
        } else if (n.postId) {
          // window.location.href = `/?postId=${n.postId}${n.targetType !== 'post' ? `&commentId=${n.targetId}` : ''}`;
          navigate(`/?postId=${n.postId}${n.targetType !== 'post' ? `&commentId=${n.targetId}` : ''}`);
        }
        break;
      case 'user': 
        // If it's a profile-related notification (like a follow), go to profile
        // Otherwise (like admin warnings), go to mypage
        if (n.message.includes('팔로우')) {
          window.location.href = `/profile/${n.targetId}`;
        } else {
          window.location.href = '/mypage';
        }
        break;
      case 'system':
        if (n.message.includes('point') || n.message.includes('포인트')) {
          window.location.href = '/mypage/points';
        }
        break;
      case 'channel':
        window.location.href = `/channel/${n.targetId}`;
        break;
      default:
        fetchNotifications();
    }
  };

  const getSourceInfo = (n) => {
    if (n.qnaId) return { label: 'Q&A', color: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300' };
    if (n.postId || n.targetType === 'feed') return { label: '피드', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' };
    if (n.targetType === 'user') return { label: '유저', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' };
    if (n.targetType === 'system') return { label: '시스템', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300' };
    if (n.targetType === 'channel') return { label: '채널', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' };
    return { label: '알림', color: 'bg-muted text-muted-foreground' };
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center bg-card p-4 rounded-2xl border border-border shadow-sm">
        <div className="flex gap-2">
          <button onClick={() => setFilter('all')} className={getFilterClass('all')}>전체</button>
          <button onClick={() => setFilter('read')} className={getFilterClass('read')}>읽음</button>
          <button onClick={() => setFilter('new')} className={getFilterClass('new')}>신규</button>
        </div>
        
        <div className="flex gap-3">
          <button 
            onClick={handleMarkAllAsRead}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-primary hover:bg-primary/5 rounded-xl transition-colors"
          >
            <FiCheckCircle />
            <span>전체 읽기</span>
          </button>
          <button 
            onClick={openSettings}
            className="p-2 text-muted-foreground hover:bg-foreground/10 rounded-xl transition-colors"
          >
            <FiSettings size={20} />
          </button>
        </div>
      </div>

      <div className="bg-card rounded-3xl border border-border overflow-hidden shadow-sm">
        {notifications.length > 0 ? (
          <div className="divide-y divide-border">
            {notifications.map((n) => {
              const source = getSourceInfo(n);
              return (
                <div 
                  key={n.id} 
                  className={`group p-6 flex items-start gap-4 transition-all cursor-pointer relative ${
                    !n.isRead 
                      ? 'bg-primary/[0.03] hover:bg-primary/[0.06]' 
                      : 'hover:bg-muted/10 opacity-80 hover:opacity-100'
                  }`}
                  onClick={() => handleNotificationClick(n)}
                >
                  {/* 읽지 않음 강조 바 */}
                  {!n.isRead && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary shadow-[0_0_8px_rgba(var(--primary),0.4)]" />
                  )}

                  <div className={`p-3 rounded-2xl flex-shrink-0 ${!n.isRead ? 'bg-primary/20 text-primary shadow-sm' : 'bg-muted/50 text-muted-foreground'}`}>
                    <FiBell size={20} />
                  </div>
                  
                  <div className="flex-1 relative">
                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ${source.color}`}>
                        {source.label}
                      </span>
                      {!n.isRead && (
                        <span className="flex h-2 w-2 rounded-full bg-primary animate-pulse shadow-[0_0_8px_rgba(var(--primary),0.5)]"></span>
                      )}
                    </div>

                    <div className="flex justify-between items-start mb-1 pr-10">
                      <p className={`text-sm leading-relaxed ${!n.isRead ? 'font-bold text-foreground' : 'text-muted-foreground'}`}>
                        {n.message}
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground/70 font-medium">
                      {new Date(n.createdAt).toLocaleString()}
                    </span>
                    
                    {!n.isRead && (
                      <button 
                        onClick={(e) => handleIndividualMarkAsRead(e, n.id)}
                        className="absolute right-0 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 p-2.5 hover:bg-primary/10 rounded-xl text-primary transition-all flex items-center gap-1.5 text-xs font-bold border border-transparent hover:border-primary/20 bg-background/50 backdrop-blur-sm shadow-sm"
                      >
                        <FiCheckCircle size={16} />
                        <span>읽음 표시</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-24 text-center bg-muted/5">
            <div className="w-16 h-16 bg-muted rounded-3xl flex items-center justify-center mx-auto mb-4 text-muted-foreground/30 shadow-inner">
              <FiBell size={32} />
            </div>
            <p className="text-muted-foreground font-medium">표시할 알림이 없습니다.</p>
          </div>
        )}
      </div>

      {isModalOpen && settings && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-card w-full max-w-md rounded-[2.5rem] shadow-2xl border border-border/50 overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-8 duration-300">
            <div className="p-8 border-b border-border/40 bg-muted/20">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-black flex items-center gap-3 text-foreground">
                  <div className="p-2 bg-primary/10 rounded-xl">
                    <FiSettings className="text-primary" />
                  </div>
                  알림 설정
                </h2>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 hover:bg-muted rounded-full transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
              <p className="text-sm text-muted-foreground mt-2 font-medium">관심 있는 활동에 대한 알림을 제어하세요.</p>
            </div>
            
            <div className="p-8 space-y-3 max-h-[60vh] overflow-y-auto custom-scrollbar">
              {[
                { key: 'followedChannel', label: '구독 채널 새 글', desc: '구독 중인 채널에 새로운 포스트가 올라오면 알림을 받습니다.' },
                { key: 'followedUser', label: '팔로우 유저 새 글', desc: '팔로우 중인 유저가 새로운 포스트를 올리면 알림을 받습니다.' },
                { key: 'postComment', label: '내 글의 새 댓글', desc: '내 포스트나 QnA에 새로운 댓글이 달리면 알림을 받습니다.' },
                { key: 'commentReply', label: '내 댓글의 새 답글', desc: '내 댓글에 새로운 답글이 달리면 알림을 받습니다.' },
                { key: 'qnaAnswer', label: 'QnA 답변 채택', desc: '내 댓글이 QnA 답변으로 채택되면 알림을 받습니다.' },
                { key: 'pointTransaction', label: '포인트 변동', desc: '포인트 획득 및 사용 시 알림을 받습니다.' },
                { key: 'mention', label: '멘션', desc: '다른 유저가 나를 @멘션하면 알림을 받습니다.'},
                { key: 'chat', label: '채팅 (준비 중)', desc: '새로운 채팅 메시지가 오면 알림을 받습니다.', disabled: true },
              ].map((opt) => (
                <div key={opt.key} className={`flex items-center justify-between p-4 rounded-3xl transition-all ${opt.disabled ? 'opacity-40 grayscale cursor-not-allowed' : 'hover:bg-muted/30 group'}`}>
                  <div className="flex-1 pr-6">
                    <p className="text-sm font-black text-foreground group-hover:text-primary transition-colors">{opt.label}</p>
                    <p className="text-[11px] text-muted-foreground font-semibold leading-snug mt-0.5">{opt.desc}</p>
                  </div>
                  <button 
                    disabled={opt.disabled}
                    onClick={() => handleToggleSetting(opt.key)}
                    className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-300 ease-in-out focus:outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring ${
                      settings[opt.key] ? 'bg-primary' : 'bg-muted-foreground/20 hover:bg-muted-foreground/30'
                    }`}
                  >
                    <span className={`pointer-events-none inline-block h-6 w-6 transform rounded-full shadow-lg ring-0 transition duration-300 ease-in-out ${
                      settings[opt.key] 
                        ? 'translate-x-5 bg-primary-foreground' 
                        : 'translate-x-0 bg-white'
                    }`} />
                  </button>
                </div>
              ))}
            </div>

            <div className="p-8 bg-muted/20 flex gap-4">
              <button 
                onClick={() => setIsModalOpen(false)}
                className="flex-1 py-4 px-6 rounded-2xl font-black bg-muted text-foreground hover:bg-muted/80 hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                닫기
              </button>
              <button 
                onClick={saveSettings}
                className="flex-1 py-4 px-6 rounded-2xl font-black bg-primary text-primary-foreground shadow-xl shadow-primary/20 hover:shadow-primary/40 hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                설정 저장
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationTab;
