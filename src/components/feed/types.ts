export interface CommentResponse {
  id: number;
  content: string;
  isAnswer: boolean;
  likeCount: number;
  dislikeCount: number;
  status: string; // 'active' | 'deleted'
  createdAt: string;
  authorNickname: string;
  authorUsername?: string; // 본인 확인용 (localStorage의 username과 비교)
  authorProfilePicUrl: string | null;
  parentId: number | null;
  children: CommentResponse[];
}