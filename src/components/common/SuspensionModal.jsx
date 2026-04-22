import React from 'react';
import { useAuth } from '../sidebar/AuthContext';
import { FiSlash, FiLogOut } from 'react-icons/fi';

const SuspensionModal = () => {
  const { currentUser, logout } = useAuth();

  if (!currentUser || currentUser.status !== 'suspended') return null;

  const releasedDate = currentUser.releasedAt 
    ? new Date(currentUser.releasedAt).toLocaleString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    : '무기한';

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-300">
      <div className="bg-background rounded-3xl max-w-md w-full p-8 shadow-2xl border border-red-500/20 text-center space-y-6 animate-in zoom-in-95 duration-300">
        <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto">
          <FiSlash className="w-10 h-10 text-red-500" />
        </div>
        
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-foreground">계정이 정지되었습니다</h2>
          <p className="text-muted-foreground">
            이용 약관 위반으로 인해 서비스 이용이 제한되었습니다.
          </p>
        </div>

        <div className="bg-muted/50 rounded-2xl p-4 border border-border">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1 font-semibold">정지 해제 예정일</p>
          <p className="text-lg font-bold text-primary">{releasedDate}</p>
        </div>

        <button 
          onClick={logout}
          className="w-full py-4 bg-red-500 hover:bg-red-600 text-white rounded-2xl font-bold transition-all shadow-lg shadow-red-500/20 flex items-center justify-center gap-2"
        >
          <FiLogOut /> 로그아웃
        </button>
      </div>
    </div>
  );
};

export default SuspensionModal;
