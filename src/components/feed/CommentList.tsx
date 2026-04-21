import React, { useState, useEffect, useCallback, useRef } from 'react';
import jwtAxios from '../../api/jwtAxios';
import { CommentResponse } from './types';
import CommentItem from './CommentItem';
import CommentForm from './CommentForm';

interface CommentListProps {
  postId: number;
  commentCount?: number;
  onCommentCountChange?: (delta: number) => void;
  resourcePath?: string;
  postAuthorUserId?: number | null;
  postResolved?: boolean;
  onAcceptAnswer?: (commentId: number) => Promise<void>;
  onReportRequest?: (type: 'post' | 'comment' | 'user', id: number) => void;
}

const CommentList: React.FC<CommentListProps> = ({
  postId,
  commentCount = 0,
  onCommentCountChange,
  resourcePath = 'posts',
  postAuthorUserId,
  postResolved = false,
  onAcceptAnswer,
  onReportRequest,
}) => {
  const [comments, setComments] = useState<CommentResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<any>({});
  const currentUserFetched = useRef(false);

  // 메인 댓글 더보기/간략히 상태 관리
  const [isExpanded, setIsExpanded] = useState(false);
  const [visibleCommentsCount, setVisibleCommentsCount] = useState(3);
  const initialBriefCount = 3; // 처음에 보여줄 댓글 수
  const commentsChunkSize = 10; // 더보기 클릭 시 추가로 보여줄 댓글 수

  useEffect(() => {
    if (currentUserFetched.current) return;
    currentUserFetched.current = true;
    jwtAxios.get('mypage/profile')
      .then(res => setCurrentUser(res.data))
      .catch(() => setCurrentUser({}));
  }, []);

  const fetchComments = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await jwtAxios.get(`${resourcePath}/${postId}/comments`);
      setComments(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || '댓글을 불러오는 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  }, [postId, resourcePath]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const handleMainCommentSubmit = async (content: string) => {
    await jwtAxios.post(`${resourcePath}/${postId}/comments`, { content });
    if (onCommentCountChange) onCommentCountChange(1); // 댓글 추가 시 +1
    fetchComments(); // 작성 완료 후 댓글 리스트 갱신
  };

  // 댓글 삭제 시 낙관적 업데이트를 위한 핸들러
  const handleOptimisticDelete = (commentId: number) => {
    const updateRecursively = (list: CommentResponse[]): CommentResponse[] => {
      return list.map(c => {
        if (c.id === commentId) {
          // status를 'deleted'로 변경하여 UI에 즉시 반영
          return { ...c, status: 'deleted' };
        }
        if (c.children && c.children.length > 0) {
          return { ...c, children: updateRecursively(c.children) };
        }
        return c;
      });
    };
    setComments(prev => updateRecursively(prev));
  };

  // 댓글 렌더링을 위한 계산 로직
  const totalComments = comments.length;
  const commentsToRender = isExpanded
    ? comments.slice(0, visibleCommentsCount)
    : comments.slice(0, initialBriefCount);

  const canExpand = !isExpanded && totalComments > initialBriefCount;
  const canLoadMore = isExpanded && visibleCommentsCount < totalComments;
  const canCollapse = isExpanded && totalComments > initialBriefCount;

  const handleExpandComments = () => {
    setIsExpanded(true);
    setVisibleCommentsCount(Math.min(initialBriefCount + commentsChunkSize, totalComments));
  };
  const handleShowMoreComments = () => {
    setVisibleCommentsCount(prev => Math.min(prev + commentsChunkSize, totalComments));
  };
  const handleCollapseComments = () => {
    setIsExpanded(false);
    setVisibleCommentsCount(initialBriefCount);
  };

  return (
    <section className="w-full mt-10 pt-8 border-t border-border">
      {/* 메인 댓글 작성 폼 */}
      {currentUser.userId ? ( <CommentForm onSubmit={handleMainCommentSubmit} /> ) : ( <div className="p-4 mb-6 text-center bg-surface border border-border rounded-xl"> <p className="text-sm text-muted-foreground"> 댓글을 작성하려면 <a href="/login" className="font-semibold text-primary hover:underline">로그인</a>이 필요합니다. </p> </div> )}

      <h3 className="text-lg font-bold text-foreground mt-8 mb-6 flex items-center gap-1.5">
        댓글 <span className="text-primary">{commentCount}</span>
      </h3>

      {error && <div className="text-red-500 text-sm mb-4 p-4 bg-red-500/10 rounded-xl">{error}</div>}

      {isLoading && comments.length === 0 ? (
        <div className="flex justify-center py-10">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : comments.length > 0 ? (
        <div className="flex flex-col">
          {commentsToRender.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              postId={postId}
              resourcePath={resourcePath}
              currentUser={currentUser}
              postAuthorUserId={postAuthorUserId}
              postResolved={postResolved}
              onAcceptAnswer={onAcceptAnswer}
              onRefresh={fetchComments}
              onOptimisticDelete={handleOptimisticDelete}
              onCommentCountChange={onCommentCountChange}
            />
          ))}

          {/* 메인 댓글 더보기 / 간략히 버튼 영역 */}
          <div className="mt-6 flex justify-center gap-3">
            {canExpand && (
              <button
                onClick={handleExpandComments}
                className="px-5 py-2 text-sm font-semibold text-muted-foreground bg-surface hover:bg-secondary hover:text-primary rounded-full transition-colors border border-border shadow-sm"
              >
                댓글 더보기
              </button>
            )}
            {canLoadMore && (
              <button
                onClick={handleShowMoreComments}
                className="px-5 py-2 text-sm font-semibold text-muted-foreground bg-surface hover:bg-secondary hover:text-primary rounded-full transition-colors border border-border shadow-sm"
              >
                댓글 더보기
              </button>
            )}
            {canCollapse && (
              <button
                onClick={handleCollapseComments}
                className="px-5 py-2 text-sm font-semibold text-muted-foreground bg-surface hover:bg-secondary hover:text-primary rounded-full transition-colors border border-border shadow-sm"
              >
                간략히
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="text-center py-10 text-muted-foreground">작성된 댓글이 없습니다. 첫 번째 댓글을 남겨보세요!</div>
      )}
    </section>
  );
};

export default CommentList;