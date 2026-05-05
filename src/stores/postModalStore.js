import { create } from 'zustand';

export const usePostModalStore = create((set) => ({
  postId: null,
  qnaId: null,
  commentId: null,
  openPost: (postId, commentId = null) => set({ postId, qnaId: null, commentId }),
  openQna: (qnaId, commentId = null) => set({ qnaId, postId: null, commentId }),
  close: () => set({ postId: null, qnaId: null, commentId: null }),
}));
