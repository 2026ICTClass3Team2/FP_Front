import React, { useState, useEffect } from 'react';
import jwtAxios from '../../api/jwtAxios';
import { useAuth } from '../../components/sidebar/AuthContext';
import { FiSearch, FiAlertCircle, FiSlash, FiCheck, FiX, FiRotateCcw, FiUnlock } from 'react-icons/fi';
import ConfirmationModal from '../../components/common/ConfirmationModal';

const UserManagementTab = ({ fetchStats }) => {
  const { token } = useAuth();
  const [users, setUsers] = useState([]);
  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [suspendModal, setSuspendModal] = useState(null);
  const [warningModal, setWarningModal] = useState(null);
  const [revertWarningModal, setRevertWarningModal] = useState(null);
  const [revertSuspendModal, setRevertSuspendModal] = useState(null);

  const fetchUsers = async () => {
    try {
      const response = await jwtAxios.get('admin/users', {
        params: {
          keyword: keyword || undefined,
          status: statusFilter === 'all' ? undefined : statusFilter,
          page,
          size: 10
        }
      });
      setUsers(response.data.content);
      setTotalPages(response.data.totalPages);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchUsers();
    }, 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line
  }, [keyword, page, statusFilter]);

  const handleWarn = async () => {
    if (!warningModal) return;
    try {
      await jwtAxios.post(`admin/users/${warningModal.id}/warn`);
      alert('경고가 부여되었습니다.');
      setWarningModal(null);
      fetchUsers();
    } catch (error) {
      console.error('Warn error:', error);
      alert('오류가 발생했습니다.');
      setWarningModal(null);
    }
  };

  const handleSuspendSubmit = async (e) => {
    e.preventDefault();
    try {
      const reason = e.target.reason.value;
      const days = parseInt(e.target.days.value);
      const releasedAt = new Date();
      releasedAt.setDate(releasedAt.getDate() + days);

      await jwtAxios.post(`admin/users/${suspendModal.id}/suspend`, {
        reason,
        releasedAt: releasedAt.toISOString()
      });
      alert('정지 처리가 완료되었습니다.');
      setSuspendModal(null);
      fetchUsers();
    } catch (error) {
      console.error('Suspend error:', error);
      alert('오류가 발생했습니다.');
    }
  };

  const handleRevertWarning = async (reason = "I made a mistake") => {
    if (!revertWarningModal) return;
    try {
      await jwtAxios.post(`admin/users/${revertWarningModal.id}/revert-warn`, { reason });
      alert('경고가 철회되었습니다.');
      setRevertWarningModal(null);
      fetchUsers();
    } catch (error) {
      console.error('Revert warning error:', error);
      alert('오류가 발생했습니다.');
    }
  };

  const handleRevertSuspendSubmit = async (e) => {
    e.preventDefault();
    try {
      const reason = e.target.reason.value;
      await jwtAxios.post(`admin/users/${revertSuspendModal.id}/revert-suspend`, { reason });
      alert('정지가 해제되었습니다.');
      setRevertSuspendModal(null);
      fetchUsers();
    } catch (error) {
      console.error('Revert suspend error:', error);
      alert('오류가 발생했습니다.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
        <div className="flex gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-96">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="닉네임, 아이디, 이메일 검색" 
              className="w-full pl-10 pr-10 py-2 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50"
              value={keyword}
              onChange={(e) => {
                setKeyword(e.target.value);
                setPage(0);
              }}
            />
            {keyword && (
              <button 
                onClick={() => { setKeyword(''); setPage(0); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <FiX />
              </button>
            )}
          </div>
        </div>

        <select 
          className="w-full sm:w-auto px-4 py-2 bg-background border border-border rounded-xl focus:outline-none"
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }}
        >
          <option value="all">전체 상태</option>
          <option value="active">활성</option>
          <option value="suspended">정지됨</option>
          <option value="deleted">탈퇴함</option>
        </select>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-border bg-muted/5 text-sm text-muted-foreground">
              <th className="py-3 px-4 font-semibold">아이디</th>
              <th className="py-3 px-4 font-semibold">닉네임/이메일</th>
              <th className="py-3 px-4 font-semibold">상태</th>
              <th className="py-3 px-4 font-semibold text-center">경고</th>
              <th className="py-3 px-4 font-semibold">가입일</th>
              <th className="py-3 px-4 font-semibold text-right">작업</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id} className="border-b border-border hover:bg-muted/5 transition-colors">
                <td className="py-3 px-4">{user.username}</td>
                <td className="py-3 px-4">
                  <div className="font-medium">{user.nickname}</div>
                  <div className="text-xs text-muted-foreground">{user.email}</div>
                </td>
                <td className="py-3 px-4">
                  <span className={`px-2 py-1 rounded-md text-xs font-bold ${
                    user.status === 'active' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                    user.status === 'suspended' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                    'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
                  }`}>
                    {user.status === 'active' ? '활성' : user.status === 'suspended' ? '정지' : '탈퇴'}
                  </span>
                </td>
                <td className="py-3 px-4 text-center font-bold text-red-500">
                  {user.warningCount}회
                </td>
                <td className="py-3 px-4 text-sm text-muted-foreground">
                  {new Date(user.registeredAt).toLocaleDateString()}
                </td>
                <td className="py-3 px-4 text-right">
                  <div className="flex justify-end gap-2">
                    <button 
                      onClick={() => setWarningModal(user)}
                      disabled={user.status !== 'active'}
                      className="p-2 text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-lg transition-colors disabled:opacity-50"
                      title="경고 부여"
                    >
                      <FiAlertCircle />
                    </button>
                    <button 
                      onClick={() => setRevertWarningModal(user)}
                      disabled={user.warningCount === 0 || user.status === 'deleted'}
                      className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors disabled:opacity-50"
                      title="경고 철회"
                    >
                      <FiRotateCcw />
                    </button>
                    <button 
                      onClick={() => setSuspendModal(user)}
                      disabled={user.status !== 'active'}
                      className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50"
                      title="정지 처분"
                    >
                      <FiSlash />
                    </button>
                    {user.status === 'suspended' && (
                      <button 
                        onClick={() => setRevertSuspendModal(user)}
                        className="p-2 text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                        title="정지 해제"
                      >
                        <FiUnlock />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan="6" className="py-8 text-center text-muted-foreground">검색 결과가 없습니다.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          {Array.from({ length: totalPages }).map((_, i) => (
            <button
              key={i}
              onClick={() => setPage(i)}
              className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                page === i ? 'bg-primary text-primary-foreground' : 'bg-muted/10 hover:bg-muted/20 text-foreground'
              }`}
            >
              {i + 1}
            </button>
          ))}
        </div>
      )}

      {/* Suspend Modal */}
      {suspendModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-background rounded-2xl max-w-md w-full p-6 shadow-xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-red-500">사용자 정지</h3>
              <button onClick={() => setSuspendModal(null)} className="text-muted-foreground hover:text-foreground">
                <FiX className="w-6 h-6" />
              </button>
            </div>
            
            <p className="mb-4">
              <span className="font-bold">{suspendModal.nickname}</span> ({suspendModal.username}) 사용자를 정지합니다.
            </p>

            <form onSubmit={handleSuspendSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">정지 사유</label>
                <textarea 
                  name="reason" 
                  required 
                  className="w-full bg-background border border-border rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-red-500"
                  rows="3"
                  placeholder="정지 사유를 상세히 입력하세요."
                ></textarea>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">정지 기간</label>
                <select name="days" className="w-full bg-background border border-border rounded-xl p-3 focus:outline-none">
                  <option value="1">1일</option>
                  <option value="3">3일</option>
                  <option value="7">7일</option>
                  <option value="30">30일</option>
                  <option value="365">1년</option>
                  <option value="36500">영구 정지</option>
                </select>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setSuspendModal(null)} className="flex-1 py-2.5 rounded-xl border border-border hover:bg-muted/5 font-semibold">취소</button>
                <button type="submit" className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white font-semibold transition-colors">정지하기</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Warning Modal */}
      <ConfirmationModal
        isOpen={!!warningModal}
        onClose={() => setWarningModal(null)}
        onConfirm={handleWarn}
        title="사용자 경고"
        message={`정말로 ${warningModal?.nickname || ''}님에게 경고를 부여하시겠습니까? (3회 누적 시 자동 정지됩니다.)`}
        confirmText="경고 부여"
        cancelText="취소"
      />

      {/* Revert Warning Confirmation / Modal */}
      {revertWarningModal && (
        revertWarningModal.warningCount > 0 && revertWarningModal.warningCount % 3 === 0 && revertWarningModal.status === 'suspended' ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-background rounded-2xl max-w-md w-full p-6 shadow-xl">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-blue-500">경고 및 정지 철회</h3>
                <button onClick={() => setRevertWarningModal(null)} className="text-muted-foreground hover:text-foreground">
                  <FiX className="w-6 h-6" />
                </button>
              </div>
              <p className="mb-4">
                <span className="font-bold">{revertWarningModal.nickname}</span>님은 현재 3회 경고 누적으로 정지 상태입니다. 
                경고를 철회하면 정지도 함께 해제됩니다.
              </p>
              <form onSubmit={(e) => { e.preventDefault(); handleRevertWarning(e.target.reason.value); }} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">철회 사유 (정지 테이블 업데이트용)</label>
                  <textarea 
                    name="reason" 
                    required 
                    defaultValue="I made a mistake"
                    className="w-full bg-background border border-border rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows="3"
                  ></textarea>
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setRevertWarningModal(null)} className="flex-1 py-2.5 rounded-xl border border-border hover:bg-muted/5 font-semibold">취소</button>
                  <button type="submit" className="flex-1 py-2.5 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-semibold transition-colors">철회 및 해제</button>
                </div>
              </form>
            </div>
          </div>
        ) : (
          <ConfirmationModal
            isOpen={!!revertWarningModal}
            onClose={() => setRevertWarningModal(null)}
            onConfirm={() => handleRevertWarning()}
            title="경고 철회"
            message={`정말로 ${revertWarningModal?.nickname || ''}님의 경고 1회를 철회하시겠습니까?`}
            confirmText="경고 철회"
            cancelText="취소"
          />
        )
      )}

      {/* Revert Suspension Modal */}
      {revertSuspendModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-background rounded-2xl max-w-md w-full p-6 shadow-xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-green-500">정지 해제</h3>
              <button onClick={() => setRevertSuspendModal(null)} className="text-muted-foreground hover:text-foreground">
                <FiX className="w-6 h-6" />
              </button>
            </div>
            <p className="mb-4">
              <span className="font-bold">{revertSuspendModal.nickname}</span>님의 정지를 조기에 해제합니다.
            </p>
            <form onSubmit={handleRevertSuspendSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">해제 사유 (정지 테이블 업데이트용)</label>
                <textarea 
                  name="reason" 
                  required 
                  defaultValue="I made a mistake"
                  className="w-full bg-background border border-border rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-green-500"
                  rows="3"
                ></textarea>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setRevertSuspendModal(null)} className="flex-1 py-2.5 rounded-xl border border-border hover:bg-muted/5 font-semibold">취소</button>
                <button type="submit" className="flex-1 py-2.5 rounded-xl bg-green-500 hover:bg-green-600 text-white font-semibold transition-colors">해제하기</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagementTab;
