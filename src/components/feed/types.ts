export interface CommentResponse {
  id: number;
  content: string;
  isAnswer: boolean;
  likeCount: number;
  dislikeCount: number;
  status: string; // 'active' | 'deleted'
  createdAt: string;
  authorNickname: string;
  authorUsername?: string;
  authorUserId?: number | null;
  authorId?: number | null;
  author_id?: number | null;
  userId?: number | null;
  user_id?: number | null;
  authorProfilePicUrl: string | null;
  parentId: number | null;
  children: CommentResponse[];
}