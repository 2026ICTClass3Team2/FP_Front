import React, { useEffect, useRef } from 'react';
import { FiX, FiUsers, FiFileText } from 'react-icons/fi';

const ChannelDetailModal = ({ isOpen, onClose, channel }) => {
  const mouseDownTarget = useRef(null);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleEscape);
    }
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen || !channel) return null;

  const handleMouseDown = (e) => {
    mouseDownTarget.current = e.target;
  };

  const handleMouseUp = (e) => {
    if (e.target === e.currentTarget && mouseDownTarget.current === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 transition-all"
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
    >
      <div
        className="bg-background w-full max-w-2xl rounded-2xl shadow-2xl border border-border flex flex-col max-h-[90vh]"
        onMouseDown={e => e.stopPropagation()}
        onMouseUp={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center p-6 border-b border-border shrink-0">
          <h2 className="text-xl font-bold text-foreground">채널 상세 정보</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-lg hover:bg-muted/10">
            <FiX className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto scrollbar-hide space-y-6">
          <div className="flex flex-col sm:flex-row gap-6 items-start">
            <div className="shrink-0">
              {channel.imageUrl ? (
                <img src={channel.imageUrl} alt={channel.name} className="w-32 h-32 rounded-2xl object-cover shadow-sm border border-border" />
              ) : (
                <div className="w-32 h-32 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20">
                  <span className="text-4xl font-bold text-primary">{channel.name?.[0]?.toUpperCase()}</span>
                </div>
              )}
            </div>
            
            <div className="flex-1 space-y-4 w-full">
              <div>
                <h3 className="text-2xl font-bold text-foreground">{channel.name}</h3>
                <p className="text-sm text-muted-foreground mt-1">소유자: <span className="font-semibold text-foreground">{channel.ownerNickname}</span> (@{channel.ownerUsername})</p>
                <div className="flex items-center gap-4 mt-3">
                  <div className="flex items-center gap-1.5 text-sm font-medium text-foreground bg-muted/10 px-3 py-1.5 rounded-lg border border-border">
                    <FiUsers className="text-primary" />
                    구독자 {channel.followerCount?.toLocaleString()}명
                  </div>
                  <div className="flex items-center gap-1.5 text-sm font-medium text-foreground bg-muted/10 px-3 py-1.5 rounded-lg border border-border">
                    <FiFileText className="text-blue-500" />
                    게시물 {channel.postCount?.toLocaleString()}개
                  </div>
                </div>
              </div>

              {channel.techStacks && channel.techStacks.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-bold text-foreground">기술 스택</h4>
                  <div className="flex flex-wrap gap-2">
                    {channel.techStacks.map((stack, idx) => (
                      <span key={idx} className="px-3 py-1 bg-primary/10 text-primary text-xs font-bold rounded-full border border-primary/20">
                        {stack}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2 pt-4 border-t border-border">
            <h4 className="text-sm font-bold text-foreground">채널 설명</h4>
            <div className="bg-muted/5 p-4 rounded-xl border border-border text-sm text-foreground whitespace-pre-wrap leading-relaxed min-h-[100px]">
              {channel.description || <span className="text-muted-foreground italic">설명이 없습니다.</span>}
            </div>
          </div>
          
          <div className="flex justify-end pt-2">
            <p className="text-xs text-muted-foreground">개설일: {new Date(channel.createdAt).toLocaleString()}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChannelDetailModal;
