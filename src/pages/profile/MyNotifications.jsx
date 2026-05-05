import React, { useState, useEffect } from 'react';
import { getAllNotifications, markAllAsRead, markAsRead, getNotificationSettings, updateNotificationSettings } from '../../api/notification';
import { FiSettings, FiCheckCircle } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import PointShopModal from '../shop/PointShopModal';
import NotificationList from '../../components/profile/NotificationList';
import Modal from '../../components/common/Modal';
import { usePostModalStore } from '../../stores/postModalStore';

const MyNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const generalNotifications = notifications.filter(n => n.targetType !== 'chat' && n.targetType !== 'bot');
  const [filter, setFilter] = useState('all');
  const [settings, setSettings] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPointShopOpen, setIsPointShopOpen] = useState(false);
  const navigate = useNavigate();
  const { openPost, openQna } = usePostModalStore();

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
    if (generalNotifications.length === 0) return;
    const ids = generalNotifications.map(n => n.id);
    try {
      await markAsRead(ids);
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
    `px-4 py-2 rounded-full text-sm font-medium transition-colors ${filter === f
      ? 'bg-primary text-primary-foreground'
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
          openQna(n.qnaId, n.targetType !== 'post' ? n.targetId : null);
        } else if (n.postId) {
          openPost(n.postId, n.targetType !== 'post' ? n.targetId : null);
        }
        break;
      case 'admin':
        break;
      case 'user':
        if (n.message.includes('게시글을 올렸습니다')) {
          openPost(n.targetId);
        } else if (n.message.includes('팔로우')) {
          navigate(`/profile/${n.targetId}`);
        } else {
          navigate('/mypage');
        }
        break;
      case 'system':
        if (n.message.includes('point') || n.message.includes('포인트')) {
          setIsPointShopOpen(true);
        }
        break;
      case 'channel':
        if (n.message.includes('게시글이 올라왔습니다')) {
          openPost(n.targetId);
        } else {
          navigate(`/channels/${n.targetId}`);
        }
        break;
      default:
        fetchNotifications();
    }
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
        <div className="flex gap-2">
          {[
            { id: 'all', label: '전체' },
            { id: 'read', label: '읽음' },
            { id: 'new', label: '신규' }
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={getFilterClass(f.id)}
            >
              {f.label}
            </button>
          ))}
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

      <NotificationList
        notifications={generalNotifications}
        onNotificationClick={handleNotificationClick}
        onMarkAsRead={handleIndividualMarkAsRead}
      />

      <Modal
        isOpen={isModalOpen && !!settings}
        onClose={() => setIsModalOpen(false)}
        title="알림 설정"
        maxWidth="max-w-md"
      >
        <p className="text-sm text-muted-foreground mb-4 font-medium">관심 있는 활동에 대한 알림을 제어하세요.</p>
        <div className="space-y-3">
          {[
            { key: 'followedChannel', label: '구독 채널 새 글', desc: '구독 중인 채널에 새로운 포스트가 올라오면 알림을 받습니다.' },
            { key: 'followedUser', label: '팔로우 유저 새 글', desc: '팔로우 중인 유저가 새로운 포스트를 올리면 알림을 받습니다.' },
            { key: 'postComment', label: '내 글의 새 댓글', desc: '내 포스트나 QnA에 새로운 댓글이 달리면 알림을 받습니다.' },
            { key: 'commentReply', label: '내 댓글의 새 답글', desc: '내 댓글에 새로운 답글이 달리면 알림을 받습니다.' },
            { key: 'qnaAnswer', label: 'QnA 답변 채택', desc: '내 댓글이 QnA 답변으로 채택되면 알림을 받습니다.' },
            { key: 'pointTransaction', label: '포인트 변동', desc: '포인트 획득 및 사용 시 알림을 받습니다.' },
            { key: 'mention', label: '멘션', desc: '다른 유저가 나를 @멘션하면 알림을 받습니다.' }
          ].map((opt) => (
            <div key={opt.key} className="flex items-center justify-between p-4 rounded-3xl hover:bg-muted/30 group transition-all">
              <div className="flex-1 pr-6">
                <p className="text-sm font-black text-foreground group-hover:text-primary transition-colors">{opt.label}</p>
                <p className="text-[11px] text-muted-foreground font-semibold leading-snug mt-0.5">{opt.desc}</p>
              </div>
              <button
                onClick={() => handleToggleSetting(opt.key)}
                className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-300 ease-in-out focus:outline-none ${settings?.[opt.key] ? 'bg-primary' : 'bg-muted-foreground/20 hover:bg-muted-foreground/30'
                  }`}
              >
                <span className={`pointer-events-none inline-block h-6 w-6 transform rounded-full shadow-lg ring-0 transition duration-300 ease-in-out ${settings?.[opt.key] ? 'translate-x-5 bg-primary-foreground' : 'translate-x-0 bg-white'
                  }`} />
              </button>
            </div>
          ))}
        </div>
        <div className="flex gap-4 mt-6">
          <button
            onClick={() => setIsModalOpen(false)}
            className="flex-1 py-3 px-6 rounded-2xl font-black bg-muted text-foreground hover:bg-muted/80 transition-all"
          >
            닫기
          </button>
          <button
            onClick={saveSettings}
            className="flex-1 py-3 px-6 rounded-2xl font-black bg-primary text-primary-foreground shadow-xl shadow-primary/20 hover:shadow-primary/40 transition-all"
          >
            설정 저장
          </button>
        </div>
      </Modal>
      <PointShopModal isOpen={isPointShopOpen} onClose={() => setIsPointShopOpen(false)} />
    </div>
  );
};

export default MyNotifications;
