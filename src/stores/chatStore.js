import { create } from 'zustand';

export const useChatStore = create((set) => ({
  // 채팅 드롭다운 열림 상태 (Header 로컬 state 대신 전역 관리)
  isChatOpen: false,
  openChat: () => set({ isChatOpen: true }),
  closeChat: () => set({ isChatOpen: false }),

  // 어느 컴포넌트에서든 특정 유저와의 채팅을 한 번에 열기
  openChatWith: (partner) => set({ isChatOpen: true, pendingPartner: partner }),

  // 헤더의 UserProfileModal → DirectChatTab 으로 채팅 상대를 전달
  pendingPartner: null, // { id, nickname, profilePicUrl }
  setPendingPartner: (partner) => set({ pendingPartner: partner }),
  clearPendingPartner: () => set({ pendingPartner: null }),

  // 채팅 읽음 처리 후 헤더 알림 배지를 즉시 갱신하기 위한 카운터
  notificationVersion: 0,
  bumpNotificationVersion: () => set((state) => ({ notificationVersion: state.notificationVersion + 1 })),
}));
