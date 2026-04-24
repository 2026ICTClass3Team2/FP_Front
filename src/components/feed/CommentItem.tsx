import React, { useState, useEffect, useRef } from 'react';
import { FiThumbsUp, FiThumbsDown, FiCornerDownRight, FiMoreVertical } from 'react-icons/fi';
import jwtAxios from '../../api/jwtAxios';
import { CommentResponse } from './types';
import CommentForm from './CommentForm';
import { formatTimeAgo } from '../../utils/time';
import ConfirmationModal from '../common/ConfirmationModal';
import UserProfileModal from '../common/UserProfileModal';

interface CommentItemProps {
  comment: CommentResponse;
  postId: number;
  resourcePath?: string;
  depth?: number;
  currentUser: any;
  postAuthorUserId?: number | null;
  postResolved?: boolean;
  onAcceptAnswer?: (commentId: number) => Promise<void>;
  onRefresh: () => void;
  onOptimisticDelete?: (commentId: number) => void;
  onCommentCountChange?: (delta: number) => void;
  onReportRequest?: (type: 'post' | 'comment' | 'user', id: number, authorUserId?: number | null) => void;
}

// Helper to get all descendants of a comment in a flat list (depth-first)
const getAllReplies = (comment: CommentResponse): CommentResponse[] => {
  let replies: CommentResponse[] = [];
  for (const child of comment.children || []) {
    replies.push(child);
    replies = replies.concat(getAllReplies(child)); // Recursively get children's children
  }
  return replies;
};

const CommentItem: React.FC<CommentItemProps> = ({
  comment,
  postId,
  resourcePath = 'posts',
  depth = 0,
  currentUser,
  postAuthorUserId,
  postResolved = false,
  onAcceptAnswer,
  onRefresh,
  onOptimisticDelete,
  onCommentCountChange,
  onReportRequest,
}) => {
  const [isReplying, setIsReplying] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isAcceptConfirmModalOpen, setIsAcceptConfirmModalOpen] = useState(false);
  const [isAccepting, setIsAccepting] = useState(false);
  const [profileModalUserId, setProfileModalUserId] = useState<number | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // New states for reply expansion and pagination
  const [isExpanded, setIsExpanded] = useState(false); // True if replies are expanded, false if brief
  const [visibleRepliesCount, setVisibleRepliesCount] = useState(10); // How many replies are visible when expanded

  const isReported = comment.isReported || false;
  const [showReportedContent, setShowReportedContent] = useState(false);

  const initialBriefCount = 0; // 대댓글 기본 숨김 처리
  const repliesChunkSize = 10; // Number of replies to add when "더 보기" is clicked

  const currentUserId = currentUser?.userId ?? currentUser?.user_id ?? currentUser?.id ?? null;
  const commentAuthorUserId = comment.authorUserId ?? comment.authorId ?? comment.author_id ?? comment.userId ?? comment.user_id ?? null;
  const isDeleted = comment.status === 'deleted';
  const isRootComment = depth === 0;
  const isQnaContext = resourcePath === 'qna';
  const isAuthor = currentUserId !== null && commentAuthorUserId !== null
    ? currentUserId === commentAuthorUserId
    : false;
  const isPostOwner = currentUserId !== null && postAuthorUserId !== null
    ? currentUserId === postAuthorUserId
    : false;
  // 채택 버튼은 루트 댓글(depth=0)에만 표시되어야 하며,
  // 대댓글(depth=1 이상)은 채택 대상이 될 수 없습니다.
  // isRootComment가 없으면 대댓글 ID가 백엔드에 전송되어
  // 잘못된 알림이 발생하거나 채택이 실패할 수 있습니다.
  const canAcceptAnswer = isQnaContext && isRootComment && isPostOwner && !postResolved && !isDeleted && !comment.isAnswer;

  // 외부 클릭 및 ESC 키 감지를 위한 useEffect
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscapeKey);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, []);

  // 대댓글 작성 처리
  const handleReplySubmit = async (content: string) => {
    if (!isRootComment) {
      // Current UI only supports one visible reply depth.
      setIsReplying(false);
      return;
    }

    await jwtAxios.post(`${resourcePath}/${postId}/comments`, {
      content,
      parentId: comment.id,
    });
    onRefresh();
    if (onCommentCountChange) onCommentCountChange(1); // 대댓글 추가 시 +1
    setIsReplying(false); // 답글 작성 후 폼 닫기
    setIsExpanded(true); // 답글 작성 후 자동으로 펼치기
    setVisibleRepliesCount(prev => prev + 1); // 새로 추가된 답글 포함
  };

  // 댓글 수정 처리
  const handleEditSubmit = async (content: string) => {
    await jwtAxios.put(`${resourcePath}/${postId}/comments/${comment.id}`, { content });
    onRefresh();
    setIsEditing(false);
  };

  // 댓글 삭제 처리
  const handleDelete = async () => {
    // 낙관적 업데이트가 가능한 경우 UI를 먼저 변경
    if (onOptimisticDelete) {
      onOptimisticDelete(comment.id);
    }

    try {
      await jwtAxios.delete(`${resourcePath}/${postId}/comments/${comment.id}`);
      if (onCommentCountChange) onCommentCountChange(-1); // 댓글 삭제 시 -1
      // 성공 시 onRefresh를 호출하지 않아 UX 개선.
      // 만약 삭제 후 다른 데이터도 갱신해야 한다면 onRefresh()를 다시 호출할 수 있습니다.
    } catch (error) {
      alert('댓글 삭제 중 오류가 발생했습니다.');
      onRefresh(); // 실패 시에는 전체 데이터를 다시 불러와서 상태를 되돌립니다.
    }
  };

  // 좋아요 토글
  const handleLike = async () => {
    if (isDeleted) return;
    try {
      await jwtAxios.post(`${resourcePath}/${postId}/comments/${comment.id}/like`);
      onRefresh();
    } catch (error) {
      alert('오류가 발생했습니다.');
    }
  };

  // 비추천 토글
  const handleDislike = async () => {
    if (isDeleted) return;
    try {
      await jwtAxios.post(`${resourcePath}/${postId}/comments/${comment.id}/dislike`);
      onRefresh();
    } catch (error) {
      alert('오류가 발생했습니다.');
    }
  };

  const handleAcceptAnswer = async () => {
    if (!onAcceptAnswer) return;

    setIsAccepting(true);
    try {
      await onAcceptAnswer(comment.id);
      setIsAcceptConfirmModalOpen(false);
      onRefresh();
    } catch (error) {
      alert('채택 처리 중 오류가 발생했습니다.');
    } finally {
      setIsAccepting(false);
    }
  };

  // Get all replies only for root comments (depth 0)
  const allReplies = isRootComment ? getAllReplies(comment) : [];
  const totalReplies = allReplies.length;

  // Determine which replies to display based on expansion state
  const repliesToRender = isExpanded
    ? allReplies.slice(0, visibleRepliesCount)
    : allReplies.slice(0, initialBriefCount);

  // Control button visibility
  const canExpand = !isExpanded && totalReplies > initialBriefCount;
  const canLoadMore = isExpanded && visibleRepliesCount < totalReplies;
  const canCollapse = isExpanded && totalReplies > initialBriefCount; // Only show collapse if there were more than initialBriefCount

  const handleExpandReplies = () => {
    setIsExpanded(true);
    setVisibleRepliesCount(repliesChunkSize); // Start with the first chunk
  };

  const handleShowMoreReplies = () => {
    setVisibleRepliesCount(prev => Math.min(prev + repliesChunkSize, totalReplies));
  };

  const handleCollapseReplies = () => {
    setIsExpanded(false);
    setVisibleRepliesCount(initialBriefCount); // Reset to initial brief count
  };

  // 깊이에 따른 마진 설정 (최대 깊이를 넘어가더라도 시각적으로 구분되도록 여백 부여)
  const depthClass = depth > 0 ? 'ml-4 md:ml-8 lg:ml-12 border-l-2 border-border pl-4 mt-4' : 'mt-6';

  return (
    <>
      {/* The actual comment body */}
      <div className={depthClass}>
        <div className="flex items-start gap-3 relative">
          {depth > 0 && <FiCornerDownRight className="text-muted-foreground mt-2 flex-shrink-0" size={16} />}

          {/* 프로필 이미지 */}
          {!isDeleted && (
            <div
              className="w-8 h-8 rounded-full bg-muted overflow-hidden flex-shrink-0 mt-1 cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all"
              onClick={() => { if (commentAuthorUserId) setProfileModalUserId(commentAuthorUserId as number); }}
            >
              {comment.authorProfilePicUrl ? (
                <img src={comment.authorProfilePicUrl} alt="profile" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                  {comment.authorNickname?.charAt(0).toUpperCase() || 'U'}
                </div>
              )}
            </div>
          )}

          <div className="flex-1 w-full">
            {!isDeleted ? (
              <>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className="font-semibold text-foreground text-sm cursor-pointer hover:underline"
                      onClick={() => { if (commentAuthorUserId) setProfileModalUserId(commentAuthorUserId as number); }}
                    >{comment.authorNickname}</span>
                    <span className="text-xs text-muted-foreground">{formatTimeAgo(comment.createdAt)}</span>
                  </div>

                  <div className="relative" ref={dropdownRef}>
                    <button onClick={() => setIsDropdownOpen(!isDropdownOpen)} className="p-1 text-muted-foreground hover:text-foreground rounded-full hover:bg-secondary transition-colors">
                      <FiMoreVertical size={16} />
                    </button>
                    {isDropdownOpen && (
                      <div className="absolute right-0 mt-1 w-24 bg-surface border border-border shadow-lg rounded-xl overflow-hidden z-10">
                        {isAuthor ? (
                          <>
                            <button onClick={() => { setIsEditing(true); setIsDropdownOpen(false); }} className="w-full text-left px-4 py-2 text-sm text-foreground hover:bg-secondary transition-colors">수정</button>
                            <button onClick={() => { setIsConfirmModalOpen(true); setIsDropdownOpen(false); }} className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-500/10 transition-colors">삭제</button>
                          </>
                        ) : (
                          <button onClick={() => { if (onReportRequest) onReportRequest('comment', comment.id, comment.authorUserId); setIsDropdownOpen(false); }} className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-500/10 transition-colors">신고</button>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {isEditing ? (
                  <CommentForm
                    initialValue={comment.content}
                    onSubmit={handleEditSubmit}
                    onCancel={() => setIsEditing(false)}
                    isReply
                  />
                ) : (
                  isReported && !showReportedContent ? (
                    <div className="flex items-center gap-2 mb-2 p-3 bg-surface border border-border rounded-xl">
                      <p className="text-sm text-muted-foreground italic">신고한 댓글입니다.</p>
                      <button
                        onClick={() => setShowReportedContent(true)}
                        className="text-xs font-semibold text-primary hover:underline"
                      >
                        [내용 보기]
                      </button>
                    </div>
                  ) : (
                    <>
                      <div
                        className="text-foreground text-sm leading-relaxed mb-2 [&>p]:m-0 [&_img]:inline-block [&_img]:max-w-full [&_img]:h-auto [&_img]:rounded-md [&_img]:align-middle [&_img]:mx-1 [&_img[src*='flaticon']]:w-24 [&_img[src*='flaticon']]:h-24 [&_pre]:bg-[#f0f0f0] dark:[&_pre]:bg-surface [&_pre]:text-foreground [&_pre]:px-3 [&_pre]:py-2 [&_pre]:rounded-md [&_pre]:overflow-x-auto [&_pre]:font-mono [&_pre]:text-sm [&_pre]:my-2 [&_pre]:whitespace-pre [&_blockquote]:border-l-4 [&_blockquote]:border-gray-300 dark:[&_blockquote]:border-gray-600 [&_blockquote]:pl-4 [&_blockquote]:my-2 [&_blockquote]:text-muted-foreground"
                        dangerouslySetInnerHTML={{ __html: comment.content }}
                      />
                      {isReported && showReportedContent && (
                        <button onClick={() => setShowReportedContent(false)} className="text-xs font-semibold text-muted-foreground hover:underline mb-1">[숨기기]</button>
                      )}
                    </>
                  )
                )}

                <div className="flex items-center gap-4 mt-2 text-muted-foreground">
                  <button onClick={handleLike} className="relative group flex items-center gap-1 p-1.5 hover:bg-secondary rounded-full hover:text-blue-500 transition-colors">
                    <FiThumbsUp size={16} />
                    <span className="text-xs font-medium">{comment.likeCount}</span>
                    <span className="absolute -top-8 left-1/2 -translate-x-1/2 px-2.5 py-1 bg-foreground text-background text-[11px] font-semibold rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50 shadow-sm">좋아요</span>
                  </button>
                  <button onClick={handleDislike} className="relative group flex items-center gap-1 p-1.5 hover:bg-secondary rounded-full hover:text-red-500 transition-colors">
                    <FiThumbsDown size={16} />
                    <span className="text-xs font-medium">{comment.dislikeCount}</span>
                    <span className="absolute -top-8 left-1/2 -translate-x-1/2 px-2.5 py-1 bg-foreground text-background text-[11px] font-semibold rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50 shadow-sm">비추천</span>
                  </button>
                  {isRootComment && (
                    <button onClick={() => setIsReplying(!isReplying)} className="relative group flex items-center p-1.5 hover:bg-gray-100 rounded-full hover:text-gray-800 transition-colors">
                      <FiCornerDownRight size={16} />
                      <span className="absolute -top-8 left-1/2 -translate-x-1/2 px-2.5 py-1 bg-gray-800 text-white text-[11px] font-semibold rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50 shadow-sm">답글 달기</span>
                    </button>
                  )}
                  {comment.isAnswer && (
                    <span className="px-2 py-1 text-[11px] font-semibold rounded-md bg-primary/10 text-primary border border-primary/20">
                      채택된 답변
                    </span>
                  )}
                  {canAcceptAnswer && (
                    <button
                      onClick={() => setIsAcceptConfirmModalOpen(true)}
                      className="px-2.5 py-1 text-[11px] font-semibold rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                    >
                      채택하기
                    </button>
                  )}
                </div>
              </>
            ) : (
              <p className="text-muted-foreground italic text-sm py-2">
                삭제된 댓글입니다.
              </p>
            )}

            {/* 답글 폼 */}
            {isRootComment && isReplying && (
              <CommentForm
                initialValue={isAuthor ? '' : `<strong>@${comment.authorNickname}</strong>&nbsp;`}
                onSubmit={handleReplySubmit}
                onCancel={() => setIsReplying(false)}
                placeholder="답글을 남겨보세요."
                isReply
              />
            )}
          </div>
        </div>
      </div>

      <ConfirmationModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={handleDelete}
        title="댓글 삭제"
        message="정말로 이 댓글을 삭제하시겠습니까? 삭제된 댓글은 되돌릴 수 없습니다."
      />

      <ConfirmationModal
        isOpen={isAcceptConfirmModalOpen}
        onClose={() => {
          if (!isAccepting) setIsAcceptConfirmModalOpen(false);
        }}
        onConfirm={handleAcceptAnswer}
        title="답변 채택"
        message="이 댓글을 채택하시겠습니까? 채택하면 질문이 해결 상태로 변경되고 포인트가 지급됩니다."
      />

      <UserProfileModal
        isOpen={profileModalUserId !== null}
        onClose={() => setProfileModalUserId(null)}
        userId={profileModalUserId}
      />

      {/* Render replies only if it's a root comment */}
      {isRootComment && allReplies.length > 0 && (
        <div className="flex flex-col">
          {repliesToRender.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              postId={postId}
              resourcePath={resourcePath}
              depth={1} // All replies have depth 1
              currentUser={currentUser}
              postAuthorUserId={postAuthorUserId}
              postResolved={postResolved}
              onAcceptAnswer={onAcceptAnswer}
              onRefresh={onRefresh}
              onOptimisticDelete={onOptimisticDelete}
              onCommentCountChange={onCommentCountChange}
              onReportRequest={onReportRequest}
            />
          ))}
          {/* Reply action buttons */}
          <div className="ml-4 md:ml-8 lg:ml-12 pl-4 mt-2 flex gap-2">
            {canExpand && (
              <button
                onClick={handleExpandReplies}
                className="text-sm font-semibold text-blue-500 hover:text-blue-600"
              >
                답글 {totalReplies}개 보기
              </button>
            )}
            {canLoadMore && (
              <button
                onClick={handleShowMoreReplies}
                className="text-sm font-semibold text-gray-500 hover:text-blue-500"
              >
                더보기
              </button>
            )}
            {canCollapse && (
              <button
                onClick={handleCollapseReplies}
                className="text-sm font-semibold text-gray-500 hover:text-blue-500"
              >
                숨기기
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default CommentItem;