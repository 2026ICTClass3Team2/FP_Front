import { create } from 'zustand';

// 채널 상세 페이지에서 GlobalWriteButton에 현재 채널을 자동 설정하기 위한 store
const useWriteChannelStore = create((set) => ({
  channel: null, // { channelId, name, imageUrl }
  setChannel: (channel) => set({ channel }),
  clearChannel: () => set({ channel: null }),
  onWriteClick: null, // 채널 상세 페이지에서 모달을 직접 열기 위한 콜백
  setOnWriteClick: (fn) => set({ onWriteClick: fn }),
  clearOnWriteClick: () => set({ onWriteClick: null }),
}));

export default useWriteChannelStore;
