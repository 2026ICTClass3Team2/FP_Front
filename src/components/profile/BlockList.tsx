import React, { useState, useEffect, useCallback } from 'react';
import jwtAxios from '../../api/jwtAxios';
import ConfirmationModal from '../common/ConfirmationModal';

interface BlockedUser {
  blockId: number;
  blockedUserId: number;
  blockedUserNickname: string;
  blockedUserProfileImageUrl: string | null;
  blockedAt: string;
}

const BlockList = () => {
  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [userToUnblock, setUserToUnblock] = useState<BlockedUser | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const fetchBlockedUsers = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await jwtAxios.get('/mypage/blocks', {
        params: { page, size: 10 }
      });
      const data = response.data;
      setBlockedUsers(data.content || []);
      setTotalPages(data.totalPages || 0);
    } catch (err: any) {
      setError(err.response?.data?.message || '차단 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchBlockedUsers();
  }, [fetchBlockedUsers]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 0 && newPage < totalPages) {
      setPage(newPage);
      window.scrollTo(0, 0);
    }
  };

  const handleUnblockRequest = (user: BlockedUser) => {
    setUserToUnblock(user);
    setIsConfirmOpen(true);
  };

  const confirmUnblock = async () => {
    if (!userToUnblock) return;

    try {
      await jwtAxios.delete(`/mypage/blocks/${userToUnblock.blockId}`);
      setBlockedUsers(prev => prev.filter(u => u.blockId !== userToUnblock.blockId));
      alert(`'${userToUnblock.blockedUserNickname}'님을 차단 해제했습니다.`);
    } catch (err) {
      alert('차단 해제에 실패했습니다.');
    } finally {
      setIsConfirmOpen(false);
      setUserToUnblock(null);
    }
  };

  return (
    <div>
      {error && <div className="text-destructive text-center py-4 bg-destructive/10 rounded-2xl mb-4">{error}</div>}
      
      {loading ? (
        <div className="text-center py-10 text-muted-foreground">목록을 불러오는 중입니다...</div>
      ) : blockedUsers.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground bg-card border border-border rounded-3xl">
          차단한 유저가 없습니다.
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {blockedUsers.map(user => (
            <div key={user.blockId} className="flex items-center justify-between p-4 bg-card border border-border rounded-2xl">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-muted overflow-hidden flex-shrink-0 border border-border flex items-center justify-center">
                  {user.blockedUserProfileImageUrl ? (
                    <img
                      src={user.blockedUserProfileImageUrl}
                      alt="profile"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        (e.currentTarget.nextSibling as HTMLElement)?.style.setProperty('display', 'flex');
                      }}
                    />
                  ) : null}
                  <div
                    className="w-full h-full bg-primary/10 items-center justify-center text-primary font-bold text-lg"
                    style={{ display: user.blockedUserProfileImageUrl ? 'none' : 'flex' }}
                  >
                    {user.blockedUserNickname?.charAt(0).toUpperCase() || 'U'}
                  </div>
                </div>
                <div>
                  <p className="font-bold text-foreground">{user.blockedUserNickname}</p>
                  <p className="text-sm text-muted-foreground">차단일: {new Date(user.blockedAt).toLocaleDateString('ko-KR')}</p>
                </div>
              </div>
              <button
                onClick={() => handleUnblockRequest(user)}
                className="px-4 py-2 bg-destructive/10 text-destructive font-semibold rounded-lg hover:bg-destructive/20 transition-colors text-sm"
              >
                차단 해제
              </button>
            </div>
          ))}
        </div>
      )}

      {!loading && totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-8">
          <button onClick={() => handlePageChange(page - 1)} disabled={page === 0} className="px-4 py-2 border border-border rounded-lg hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed text-sm">이전</button>
          <div className="flex gap-1">
            {Array.from({ length: totalPages }, (_, i) => i).map((pageNum) => (
              <button
                key={pageNum}
                onClick={() => handlePageChange(pageNum)}
                className={`w-9 h-9 rounded-lg border text-sm transition-colors flex items-center justify-center ${
                  page === pageNum ? 'bg-primary text-primary-foreground border-primary' : 'border-border hover:bg-muted'
                }`}
              >
                {pageNum + 1}
              </button>
            ))}
          </div>
          <button onClick={() => handlePageChange(page + 1)} disabled={page === totalPages - 1} className="px-4 py-2 border border-border rounded-lg hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed text-sm">다음</button>
        </div>
      )}

      <ConfirmationModal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={confirmUnblock}
        title="차단 해제"
        message={`'${userToUnblock?.blockedUserNickname}'님을 차단 해제하시겠습니까?`}
      />
    </div>
  );
};

export default BlockList;