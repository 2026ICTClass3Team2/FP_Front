import React, { useState } from 'react';
import { FiThumbsUp, FiThumbsDown, FiCornerDownRight, FiMoreVertical } from 'react-icons/fi';
import jwtAxios from '../../api/jwtAxios';
import { CommentResponse } from './types';
import CommentForm from './CommentForm';

interface CommentItemProps {
  comment: CommentResponse;
  postId: number;
  depth?: number;
  currentUser: any;
  onRefresh: () => void;
}

// Helper to get all descendants of a comment in a flat list using recursion.
const getAllReplies = (comment: CommentResponse): CommentResponse[] => {
  let replies: CommentResponse[] = [];
  for (const child of comment.children || []) {
    replies.push(child);
    replies = replies.concat(getAllReplies(child));
  }
  return replies;
};

const CommentItem: React.FC<CommentItemProps> = ({ comment, postId, depth = 0, currentUser, onRefresh }) => {
  const [isReplying, setIsReplying] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [visibleReplies, setVisibleReplies] = useState(10);

  const isAuthor = currentUser?.username === comment.authorUsername || currentUser?.nickname === comment.authorNickname;
  const isDeleted = comment.status === 'deleted';
  const isRootComment = depth === 0;

  // 대댓글 작성 처리
  const handleReplySubmit = async (content: string) => {
    await jwtAxios.post(`posts/${postId}/comments`, {
      content,
      parentId: comment.id,
    });
    onRefresh();
  };

  // 댓글 수정 처리
  const handleEditSubmit = async (content: string) => {
    await jwtAxios.put(`posts/${postId}/comments/${comment.id}`, { content });
    onRefresh();
  };

  // 댓글 삭제 처리
  const handleDelete = async () => {
    if (window.confirm('정말로 이 댓글을 삭제하시겠습니까?')) {
      try {
        await jwtAxios.delete(`posts/${postId}/comments/${comment.id}`);
        onRefresh();
      } catch (error) {
        alert('댓글 삭제 중 오류가 발생했습니다.');
      }
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

  // Get all replies only for root comments
  const allReplies = isRootComment ? getAllReplies(comment) : [];
  const hasMoreReplies = allReplies.length > visibleReplies;

  const showMoreReplies = () => {
    setVisibleReplies(prev => prev + 10);
  };

  // 깊이에 따른 마진 설정 (최대 깊이를 넘어가더라도 시각적으로 구분되도록 여백 부여)
  const depthClass = depth > 0 ? 'ml-4 md:ml-8 lg:ml-12 border-l-2 border-gray-100 dark:border-gray-800 pl-4 mt-4' : 'mt-6';

  return (
    <>
      {/* The actual comment body */}
      <div className={depthClass}>
        <div className="flex items-start gap-3 relative">
        {depth > 0 && <FiCornerDownRight className="text-gray-300 dark:text-gray-600 mt-2 flex-shrink-0" size={16} />}
        
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
                  <span className="font-semibold text-gray-900 dark:text-white text-sm">{comment.authorNickname}</span>
                  <span className="text-xs text-gray-400">{comment.createdAt}</span>
                </div>
                
                {isAuthor && (
                  <div className="relative">
                    <button onClick={() => setIsDropdownOpen(!isDropdownOpen)} className="p-1 text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 rounded-full hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors">
                      <FiMoreVertical size={16} />
                    </button>
                    {isDropdownOpen && (
                      <div className="absolute right-0 mt-1 w-24 bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-700 shadow-lg rounded-xl overflow-hidden z-10">
                        <button onClick={() => { setIsEditing(true); setIsDropdownOpen(false); }} className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors">수정</button>
                        <button onClick={() => { handleDelete(); setIsDropdownOpen(false); }} className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">삭제</button>
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
                <p className="text-gray-800 dark:text-gray-200 text-sm whitespace-pre-wrap leading-relaxed mb-2">
                  {comment.content}
                </p>
              )}

              <div className="flex items-center gap-4 mt-2 text-gray-500">
                <button onClick={handleLike} className="flex items-center gap-1.5 hover:text-blue-500 transition-colors">
                  <FiThumbsUp size={14} /> <span className="text-xs font-medium">{comment.likeCount}</span>
                </button>
                <button onClick={handleDislike} className="flex items-center gap-1.5 hover:text-red-500 transition-colors">
                  <FiThumbsDown size={14} /> <span className="text-xs font-medium">{comment.dislikeCount}</span>
                </button>
                <button onClick={() => setIsReplying(!isReplying)} className="text-xs font-medium hover:text-gray-800 dark:hover:text-white transition-colors ml-2">
                  답글 달기
                </button>
              </div>
            </>
          ) : (
            <p className="text-gray-400 dark:text-gray-500 italic text-sm py-2">
              삭제된 댓글입니다.
            </p>
          )}

          {/* 답글 폼 */}
          {isReplying && (
            <CommentForm
              onSubmit={handleReplySubmit}
              onCancel={() => setIsReplying(false)}
              placeholder="답글을 남겨보세요."
              isReply
            />
          )}
        </div>
      </div>
      </div>

      {/* Render replies only if it's a root comment */}
      {isRootComment && allReplies.length > 0 && (
        <div className="flex flex-col">
          {allReplies.slice(0, visibleReplies).map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              postId={postId}
              depth={1} // All replies have depth 1
              currentUser={currentUser}
              onRefresh={onRefresh}
            />
          ))}
          {hasMoreReplies && (
            <div className="ml-4 md:ml-8 lg:ml-12 pl-4 mt-2">
              <button
                onClick={showMoreReplies}
                className="text-sm font-semibold text-gray-500 dark:text-gray-400 hover:text-blue-500 dark:hover:text-blue-400"
              >
                답글 {allReplies.length - visibleReplies}개 더 보기
              </button>
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default CommentItem;