import React from 'react';
import { FiBell, FiCheckCircle } from 'react-icons/fi';

const NotificationList = ({ notifications, onNotificationClick, onMarkAsRead }) => {
  const getSourceInfo = (n) => {
    if (n.qnaId) return { label: 'Q&A', color: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300' };
    if (n.postId || n.targetType === 'feed') return { label: '피드', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' };
    if (n.targetType === 'user') return { label: '유저', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' };
    if (n.targetType === 'system') return { label: '시스템', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300' };
    if (n.targetType === 'channel') return { label: '채널', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' };
    return { label: '알림', color: 'bg-muted text-muted-foreground' };
  };

  return (
    <div className="bg-card rounded-3xl border border-border overflow-hidden shadow-sm">
      {notifications && notifications.length > 0 ? (
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
                onClick={() => onNotificationClick && onNotificationClick(n)}
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
                      onClick={(e) => onMarkAsRead && onMarkAsRead(e, n.id)}
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
  );
};

export default NotificationList;
