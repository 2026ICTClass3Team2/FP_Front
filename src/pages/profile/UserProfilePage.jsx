import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import jwtAxios from '../../api/jwtAxios';
import { FiMoreVertical, FiCalendar, FiUser, FiAlertTriangle, FiSlash, FiStar } from 'react-icons/fi';
import ReportModal from '../../components/common/ReportModal';
import ConfirmationModal from '../../components/common/ConfirmationModal';

const UserProfilePage = () => {
  const { userId } = useParams();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isBlockConfirmOpen, setIsBlockConfirmOpen] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await jwtAxios.get(`/mypage/users/${userId}`);
        setProfile(res.data);
        setIsBlocked(res.data.isBlocked ?? false);
        setIsFavorited(res.data.isFavorited ?? false);
      } catch (err) {
        setError(err.response?.data?.message || '프로필 정보를 불러오지 못했습니다.');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [userId]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleFavoriteToggle = async () => {
    if (favoriteLoading) return;
    setFavoriteLoading(true);
    try {
      const res = await jwtAxios.post(`/favorites/users/${userId}`);
      setIsFavorited(res.data.favorited);
    } catch (err) {
      alert(err.response?.data?.message || '오류가 발생했습니다.');
    } finally {
      setFavoriteLoading(false);
    }
  };

  const handleBlock = async () => {
    try {
      await jwtAxios.post('/reports', {
        targetType: 'user',
        targetId: Number(userId),
        reasonType: 'other',
        reasonDetail: '사용자 직접 차단',
        blockUser: true,
      });
      setIsBlocked(true);
      alert(`'${profile?.nickname}'님을 차단했습니다.`);
    } catch (err) {
      alert(err.response?.data?.message || '차단에 실패했습니다.');
    } finally {
      setIsBlockConfirmOpen(false);
    }
  };

  if (loading) return <div className="flex justify-center items-center h-96">로딩 중...</div>;
  if (error) return <div className="text-red-500 text-center py-10">{error}</div>;
  if (!profile) return null;

  const isMyProfile = profile.isMine === true;

  return (
    <div className="flex items-start bg-surface rounded-2xl shadow p-12 border border-border min-h-[220px] w-full max-w-[1200px] min-w-[900px] mx-auto">
      {/* 프로필 이미지 */}
      <div className="w-32 h-32 bg-primary flex items-center justify-center text-primary-foreground text-5xl font-bold mr-12 select-none border border-border overflow-hidden">
        {profile.profilePicUrl ? (
          <img src={profile.profilePicUrl} alt="프로필" className="w-full h-full object-cover" />
        ) : (
          (profile.nickname?.[0] || '닉')
        )}
      </div>

      {/* 우측 정보 */}
      <div className="flex-1 flex flex-col gap-2">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-4 mb-2">
              <span className="text-3xl font-bold text-foreground">{profile.nickname}</span>
              {isBlocked && (
                <span className="px-3 py-1 bg-red-100 text-red-500 text-sm font-semibold rounded-xl">차단됨</span>
              )}
            </div>
            <div className="flex items-center gap-3 text-muted-foreground text-lg mb-1">
              <FiUser className="w-5 h-5" /> @{profile.username}
            </div>
            <div className="flex items-center gap-3 text-muted-foreground text-lg mb-1">
              <FiCalendar className="w-5 h-5" /> 가입일: {profile.registeredAt?.slice(0, 10)}
            </div>
          </div>

          {/* 즐겨찾기 + 메뉴 버튼 (타인 프로필일 때만) */}
          {!isMyProfile && (
            <div className="flex items-center gap-2">
              <button
                onClick={handleFavoriteToggle}
                disabled={favoriteLoading}
                title={isFavorited ? '즐겨찾기 해제' : '즐겨찾기 추가'}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-sm font-semibold transition-all ${
                  isFavorited
                    ? 'bg-yellow-400/20 border-yellow-400 text-yellow-500 hover:bg-yellow-400/30'
                    : 'bg-background border-border text-muted-foreground hover:border-yellow-400 hover:text-yellow-500'
                }`}
              >
                <FiStar size={16} className={isFavorited ? 'fill-yellow-400 text-yellow-400' : ''} />
                {isFavorited ? '즐겨찾기 중' : '즐겨찾기'}
              </button>
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="p-2 text-muted-foreground hover:text-foreground rounded-full hover:bg-secondary transition-colors"
              >
                <FiMoreVertical size={22} />
              </button>
              {isMenuOpen && (
                <div className="absolute right-0 mt-1 w-36 bg-surface border border-border shadow-lg rounded-xl overflow-hidden z-10">
                  <button
                    onClick={() => { setIsReportModalOpen(true); setIsMenuOpen(false); }}
                    className="w-full text-left px-4 py-2.5 text-sm text-red-500 hover:bg-red-500/10 transition-colors flex items-center gap-2"
                  >
                    <FiAlertTriangle size={14} /> 신고하기
                  </button>
                  {!isBlocked && (
                    <button
                      onClick={() => { setIsBlockConfirmOpen(true); setIsMenuOpen(false); }}
                      className="w-full text-left px-4 py-2.5 text-sm text-foreground hover:bg-secondary transition-colors flex items-center gap-2"
                    >
                      <FiSlash size={14} /> 차단하기
                    </button>
                  )}
                </div>
              )}
            </div>
            </div>
          )}
        </div>

        <div className="mt-7">
          <div className="font-bold text-lg mb-3 text-foreground">관심 기술 스택</div>
          <div className="flex flex-wrap gap-3">
            {profile.techStacks && profile.techStacks.length > 0 ? (
              profile.techStacks.map((tech) => (
                <span key={tech} className="px-4 py-2 bg-muted text-foreground rounded-full text-base font-semibold border border-border">
                  {tech}
                </span>
              ))
            ) : (
              <span className="text-base text-muted-foreground">관심 기술 없음</span>
            )}
          </div>
        </div>
      </div>

      <ReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        targetType="user"
        targetId={Number(userId)}
        onSuccess={() => {
          setIsReportModalOpen(false);
        }}
      />

      <ConfirmationModal
        isOpen={isBlockConfirmOpen}
        onClose={() => setIsBlockConfirmOpen(false)}
        onConfirm={handleBlock}
        title="차단하기"
        message={`'${profile?.nickname}'님을 차단하시겠습니까? 차단하면 이 유저의 게시글과 댓글이 보이지 않습니다.`}
      />
    </div>
  );
};

export default UserProfilePage;
