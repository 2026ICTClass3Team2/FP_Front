import React, { useState, useEffect, useRef } from 'react';
import { FiX, FiCalendar, FiUser, FiMessageCircle, FiAlertTriangle, FiSlash, FiStar } from 'react-icons/fi';
import jwtAxios from '../../api/jwtAxios';
import ReportModal from './ReportModal';

const UserProfileModal = ({ isOpen, onClose, userId }) => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [blockLoading, setBlockLoading] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const backdropRef = useRef(null);

  useEffect(() => {
    if (!isOpen || !userId) return;
    setProfile(null);
    setLoading(true);
    jwtAxios.get(`mypage/users/${userId}`)
      .then(res => {
        setProfile(res.data);
        setIsBlocked(res.data.isBlocked ?? false);
        setIsFavorited(res.data.isFavorited ?? false);
      })
      .catch(() => setProfile(null))
      .finally(() => setLoading(false));
  }, [isOpen, userId]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && !isReportModalOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, isReportModalOpen]);

  if (!isOpen) return null;

  const handleBackdropClick = (e) => {
    if (e.target === backdropRef.current) onClose();
  };

  const handleBlockToggle = async () => {
    if (blockLoading) return;
    setBlockLoading(true);
    try {
      if (isBlocked) {
        await jwtAxios.delete(`mypage/users/${userId}/block`);
        setIsBlocked(false);
      } else {
        await jwtAxios.post(`mypage/users/${userId}/block`);
        setIsBlocked(true);
      }
    } catch (err) {
      alert(err.response?.data?.message || '오류가 발생했습니다.');
    } finally {
      setBlockLoading(false);
    }
  };

  const handleFavoriteToggle = async () => {
    if (favoriteLoading) return;
    setFavoriteLoading(true);
    try {
      const res = await jwtAxios.post(`favorites/users/${userId}`);
      setIsFavorited(res.data.favorited);
    } catch (err) {
      alert(err.response?.data?.message || '오류가 발생했습니다.');
    } finally {
      setFavoriteLoading(false);
    }
  };

  const handleReportSuccess = ({ additionalAction }) => {
    if (additionalAction) setIsBlocked(true);
  };

  return (
    <>
    <div
      ref={backdropRef}
      className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      <div className="bg-background rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col">
        {/* 헤더 */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-border">
          <h3 className="text-lg font-bold text-foreground">유저 프로필</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <FiX size={22} />
          </button>
        </div>

        {/* 본문 */}
        <div className="p-6">
          {loading && (
            <div className="flex justify-center py-10 text-muted-foreground text-sm">불러오는 중...</div>
          )}
          {!loading && !profile && (
            <div className="flex justify-center py-10 text-muted-foreground text-sm">유저 정보를 불러올 수 없습니다.</div>
          )}
          {!loading && profile && (
            <>
              {/* 프로필 카드 */}
              <div className="flex items-start gap-4 mb-5">
                <div className="w-16 h-16 rounded-full bg-muted overflow-hidden flex-shrink-0 border border-border">
                  {profile.profilePicUrl ? (
                    <img src={profile.profilePicUrl} alt="profile" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xl">
                      {profile.nickname?.charAt(0).toUpperCase() || 'U'}
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <div className="text-xl font-bold text-foreground mb-0.5">{profile.nickname}</div>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground mb-1">
                    <FiUser size={13} />
                    <span>@{profile.username}</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <FiCalendar size={12} />
                    <span>가입일: {profile.registeredAt?.slice(0, 10)}</span>
                  </div>
                </div>
              </div>

              {/* 관심 기술 스택 */}
              <div className="mb-5">
                <div className="text-sm font-semibold text-foreground mb-2">관심 기술 스택</div>
                <div className="flex flex-wrap gap-2">
                  {profile.techStacks && profile.techStacks.length > 0 ? (
                    profile.techStacks.map((tech) => (
                      <span key={tech} className="px-3 py-1 bg-muted text-foreground rounded-full text-xs font-semibold border border-border">
                        {tech}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-muted-foreground">관심 기술 없음</span>
                  )}
                </div>
              </div>

              {/* 액션 버튼들 (자기 자신이 아닐 때만) */}
              {!profile.isMine && (
                <div className="flex flex-col gap-2">
                  {/* 1:1 채팅 (기능 미구현) */}
                  <button
                    className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border border-border bg-background text-foreground text-sm font-semibold hover:bg-secondary transition-colors opacity-60 cursor-not-allowed"
                    disabled
                    title="준비 중인 기능입니다."
                  >
                    <FiMessageCircle size={16} />
                    1:1 채팅 (준비 중)
                  </button>

                  {/* 즐겨찾기 */}
                  <button
                    onClick={handleFavoriteToggle}
                    disabled={favoriteLoading}
                    className={`flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50 ${
                      isFavorited
                        ? 'border border-yellow-400 bg-yellow-400/20 text-yellow-500 hover:bg-yellow-400/30'
                        : 'border border-border bg-background text-foreground hover:bg-secondary'
                    }`}
                  >
                    <FiStar size={16} className={isFavorited ? 'fill-yellow-400' : ''} />
                    {favoriteLoading ? '처리 중...' : isFavorited ? '즐겨찾기 중' : '즐겨찾기'}
                  </button>

                  {/* 차단 / 차단 해제 */}
                  <button
                    onClick={handleBlockToggle}
                    disabled={blockLoading}
                    className={`flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50 ${
                      isBlocked
                        ? 'border border-border bg-muted text-foreground hover:bg-secondary'
                        : 'border border-orange-400/50 bg-orange-500/10 text-orange-500 hover:bg-orange-500/20'
                    }`}
                  >
                    <FiSlash size={16} />
                    {blockLoading ? '처리 중...' : isBlocked ? '차단 해제' : '차단'}
                  </button>

                  {/* 신고 */}
                  <button
                    onClick={() => setIsReportModalOpen(true)}
                    className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border border-red-400/30 bg-red-500/10 text-red-500 text-sm font-semibold hover:bg-red-500/20 transition-colors"
                  >
                    <FiAlertTriangle size={16} />
                    신고
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

    </div>

      {/* 유저 신고 모달 — backdrop 중첩 방지를 위해 UserProfileModal backdrop 밖에 렌더링 */}
      {profile && !profile.isMine && (
        <ReportModal
          isOpen={isReportModalOpen}
          onClose={() => setIsReportModalOpen(false)}
          targetType="user"
          targetId={profile.userId}
          onSuccess={handleReportSuccess}
        />
      )}
    </>
  );
};

export default UserProfileModal;
