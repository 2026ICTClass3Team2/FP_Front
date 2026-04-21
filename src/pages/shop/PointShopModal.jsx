import React, { useState } from 'react';

const PointShopModal = () => {
  // 임시 관리자 상태 (나중에 계정 연동 시 수정)
  const [isAdmin, setIsAdmin] = useState(true); 

  return (
    <div className="space-y-6">
      {/* 관리자 전용 영역 */}
      {isAdmin && (
        <div className="p-4 border-2 border-dashed border-primary/30 rounded-xl bg-primary/5 mb-4">
          <p className="text-sm font-bold text-primary mb-2">관리자 전용 메뉴</p>
          <button className="w-full py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition">
            + 새 아이템 등록 (인텔리제이 백엔드 연동 예정)
          </button>
        </div>
      )}

      {/* 아이템 리스트 영역 (예시) */}
      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 border border-border rounded-xl">이모티콘 A - 100P</div>
        <div className="p-4 border border-border rounded-xl">이모티콘 B - 200P</div>
      </div>
    </div>
  );
};

export default PointShopModal;