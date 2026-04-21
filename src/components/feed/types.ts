export interface CommentResponse {
  id: number;
  content: string;
  isAnswer: boolean;
  likeCount: number;
  dislikeCount: number;
  status: string; // 'active' | 'deleted'
  createdAt: string;
  authorUserId: number | null;
  authorNickname: string;
  authorProfilePicUrl: string | null;
  parentId: number | null;
  isReported?: boolean;
  children: CommentResponse[];
}