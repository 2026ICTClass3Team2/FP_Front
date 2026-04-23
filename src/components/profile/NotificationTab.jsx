import React, { useState, useEffect } from 'react';
import { getAllNotifications, markAllAsRead, getNotificationSettings, updateNotificationSettings } from '../../api/notification';
import { FiSettings, FiCheckCircle, FiBell } from 'react-icons/fi';

const NotificationTab = () => {
  const [notifications, setNotifications] = useState([]);
  const [filter, setFilter] = useState('all');
  const [settings, setSettings] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

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
            {notifications.map((n) => (
              <div 
                key={n.id} 
                className={`p-6 flex items-start gap-4 transition-colors ${!n.isRead ? 'bg-primary/5' : 'hover:bg-muted/10'}`}
              >
                <div className={`p-3 rounded-2xl ${!n.isRead ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'}`}>
                  <FiBell size={20} />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-1">
                    <p className={`text-sm ${!n.isRead ? 'font-bold text-foreground' : 'text-muted-foreground'}`}>
                      {n.message}
                    </p>
                    {!n.isRead && (
                      <span className="w-2 h-2 bg-primary rounded-full"></span>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {new Date(n.createdAt).toLocaleString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-20 text-center">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4 text-muted-foreground/50">
              <FiBell size={32} />
            </div>
            <p className="text-muted-foreground">표시할 알림이 없습니다.</p>
          </div>
        )}
      </div>

      {isModalOpen && settings && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-card w-full max-w-md rounded-3xl shadow-2xl border border-border overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-border bg-muted/30">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <FiSettings className="text-primary" />
                알림 설정
              </h2>
              <p className="text-sm text-muted-foreground mt-1">알림을 받고 싶은 항목을 선택하세요.</p>
            </div>
            
            <div className="p-6 space-y-4">
              {[
                { key: 'followedChannel', label: '구독 채널 새 글', desc: '구독 중인 채널에 새로운 포스트가 올라오면 알림을 받습니다.' },
                { key: 'followedUser', label: '팔로우 유저 새 글', desc: '팔로우 중인 유저가 새로운 포스트를 올리면 알림을 받습니다.' },
                { key: 'postComment', label: '내 글의 새 댓글', desc: '내 포스트나 QnA에 새로운 댓글이 달리면 알림을 받습니다.' },
                { key: 'commentReply', label: '내 댓글의 새 답글', desc: '내 댓글에 새로운 답글이 달리면 알림을 받습니다.' },
                { key: 'qnaAnswer', label: 'QnA 답변 채택', desc: '내 댓글이 QnA 답변으로 채택되면 알림을 받습니다.' },
                { key: 'pointTransaction', label: '포인트 변동', desc: '포인트 획득 및 사용 시 알림을 받습니다.' },
                { key: 'mention', label: '멘션 (준비 중)', desc: '다른 유저가 나를 @멘션하면 알림을 받습니다.', disabled: true },
                { key: 'chat', label: '채팅 (준비 중)', desc: '새로운 채팅 메시지가 오면 알림을 받습니다.', disabled: true },
              ].map((opt) => (
                <div key={opt.key} className={`flex items-center justify-between p-3 rounded-2xl hover:bg-muted/50 transition-colors ${opt.disabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
                  <div className="flex-1 pr-4">
                    <p className="text-sm font-bold">{opt.label}</p>
                    <p className="text-[11px] text-muted-foreground leading-tight">{opt.desc}</p>
                  </div>
                  <button 
                    disabled={opt.disabled}
                    onClick={() => handleToggleSetting(opt.key)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      settings[opt.key] ? 'bg-primary' : 'bg-muted'
                    }`}
                  >
                    <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      settings[opt.key] ? 'translate-x-5' : 'translate-x-0'
                    }`} />
                  </button>
                </div>
              ))}
            </div>

            <div className="p-6 bg-muted/30 flex gap-3">
              <button 
                onClick={() => setIsModalOpen(false)}
                className="flex-1 py-3 px-4 rounded-xl font-bold bg-muted hover:bg-muted/80 transition-all"
              >
                취소
              </button>
              <button 
                onClick={saveSettings}
                className="flex-1 py-3 px-4 rounded-xl font-bold bg-primary text-primary-foreground shadow-lg hover:shadow-primary/25 transition-all"
              >
                저장하기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationTab;
