import React, { useState, useEffect, useRef } from 'react';
import { FiThumbsUp, FiThumbsDown, FiCornerDownRight, FiMoreVertical } from 'react-icons/fi';
import jwtAxios from '../../api/jwtAxios';
import { CommentResponse } from './types';
import CommentForm from './CommentForm';
import { formatTimeAgo } from '../../utils/time';
import ConfirmationModal from '../common/ConfirmationModal';

interface CommentItemProps {
  comment: CommentResponse;
  postId: number;
  depth?: number;
  currentUser: any;
  onRefresh: () => void;
  onOptimisticDelete?: (commentId: number) => void;
  onCommentCountChange?: (delta: number) => void;
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

const CommentItem: React.FC<CommentItemProps> = ({ comment, postId, depth = 0, currentUser, onRefresh, onOptimisticDelete, onCommentCountChange }) => {
  const [isReplying, setIsReplying] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // New states for reply expansion and pagination
  const [isExpanded, setIsExpanded] = useState(false); // True if replies are expanded, false if brief
  const [visibleRepliesCount, setVisibleRepliesCount] = useState(10); // How many replies are visible when expanded

  const initialBriefCount = 0; // 대댓글 기본 숨김 처리
  const repliesChunkSize = 10; // Number of replies to add when "더 보기" is clicked

  const isAuthor = currentUser?.username === comment.authorUsername || currentUser?.nickname === comment.authorNickname;
  const isDeleted = comment.status === 'deleted';
  const isRootComment = depth === 0;

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
    await jwtAxios.post(`posts/${postId}/comments`, {
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
    await jwtAxios.put(`posts/${postId}/comments/${comment.id}`, { content });
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
      await jwtAxios.delete(`posts/${postId}/comments/${comment.id}`);
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
      await jwtAxios.post(`posts/${postId}/comments/${comment.id}/like`);
      onRefresh();
    } catch (error) {
      alert('오류가 발생했습니다.');
    }
  };

  // 비추천 토글
  const handleDislike = async () => {
    if (isDeleted) return;
    try {
      await jwtAxios.post(`posts/${postId}/comments/${comment.id}/dislike`);
      onRefresh();
    } catch (error) {
      alert('오류가 발생했습니다.');
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
  const depthClass = depth > 0 ? 'ml-4 md:ml-8 lg:ml-12 border-l-2 border-gray-100 pl-4 mt-4' : 'mt-6';

  return (
    <>
      {/* The actual comment body */}
      <div className={depthClass}>
        <div className="flex items-start gap-3 relative">
        {depth > 0 && <FiCornerDownRight className="text-gray-300 mt-2 flex-shrink-0" size={16} />}
        
        {/* 프로필 이미지 */}
        {!isDeleted && (
          <div className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden flex-shrink-0 mt-1">
            {comment.authorProfilePicUrl ? (
              <img src={comment.authorProfilePicUrl} alt="profile" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-blue-100 flex items-center justify-center text-blue-500 font-bold text-sm">
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
                  <span className="font-semibold text-gray-900 text-sm">{comment.authorNickname}</span>
                  <span className="text-xs text-gray-400">{formatTimeAgo(comment.createdAt)}</span>
                </div>
                
                {isAuthor && (
                  <div className="relative" ref={dropdownRef}>
                    <button onClick={() => setIsDropdownOpen(!isDropdownOpen)} className="p-1 text-gray-400 hover:text-gray-700 rounded-full hover:bg-gray-100 transition-colors">
                      <FiMoreVertical size={16} />
                    </button>
                    {isDropdownOpen && (
                      <div className="absolute right-0 mt-1 w-24 bg-white border border-gray-200 shadow-lg rounded-xl overflow-hidden z-10">
                        <button onClick={() => { setIsEditing(true); setIsDropdownOpen(false); }} className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors">수정</button>
                        <button onClick={() => { setIsConfirmModalOpen(true); setIsDropdownOpen(false); }} className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-50 transition-colors">삭제</button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {isEditing ? (
                <CommentForm
                  initialValue={comment.content}
                  onSubmit={handleEditSubmit}
                  onCancel={() => setIsEditing(false)}
                  isReply
                />
              ) : (
                <div 
                  className="text-gray-800 text-sm leading-relaxed mb-2 [&>p]:m-0 [&_img]:inline-block [&_img]:max-h-24 [&_img]:align-middle"
                  dangerouslySetInnerHTML={{ __html: comment.content }}
                />
              )}

              <div className="flex items-center gap-4 mt-2 text-gray-500">
                <button onClick={handleLike} className="relative group flex items-center gap-1 p-1.5 hover:bg-gray-100 rounded-full hover:text-blue-500 transition-colors">
                  <FiThumbsUp size={16} />
                  <span className="text-xs font-medium">{comment.likeCount}</span>
                  <span className="absolute -top-8 left-1/2 -translate-x-1/2 px-2.5 py-1 bg-gray-800 text-white text-[11px] font-semibold rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50 shadow-sm">좋아요</span>
                </button>
                <button onClick={handleDislike} className="relative group flex items-center gap-1 p-1.5 hover:bg-gray-100 rounded-full hover:text-red-500 transition-colors">
                  <FiThumbsDown size={16} />
                  <span className="text-xs font-medium">{comment.dislikeCount}</span>
                  <span className="absolute -top-8 left-1/2 -translate-x-1/2 px-2.5 py-1 bg-gray-800 text-white text-[11px] font-semibold rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50 shadow-sm">비추천</span>
                </button>
                <button onClick={() => setIsReplying(!isReplying)} className="relative group flex items-center p-1.5 hover:bg-gray-100 rounded-full hover:text-gray-800 transition-colors">
                  <FiCornerDownRight size={16} />
                  <span className="absolute -top-8 left-1/2 -translate-x-1/2 px-2.5 py-1 bg-gray-800 text-white text-[11px] font-semibold rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50 shadow-sm">답글 달기</span>
                </button>
              </div>
            </>
          ) : (
            <p className="text-gray-400 italic text-sm py-2">
              삭제된 댓글입니다.
            </p>
          )}

          {/* 답글 폼 */}
          {isReplying && (
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

      {/* Render replies only if it's a root comment */}
      {isRootComment && allReplies.length > 0 && (
        <div className="flex flex-col">
          {repliesToRender.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              postId={postId}
              depth={1} // All replies have depth 1
              currentUser={currentUser}
              onRefresh={onRefresh}
              onOptimisticDelete={onOptimisticDelete}
              onCommentCountChange={onCommentCountChange}
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