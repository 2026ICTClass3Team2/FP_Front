import React, { useState, useEffect, useRef } from 'react';
import { FiMoreVertical, FiHeart, FiThumbsDown, FiMessageCircle, FiShare2, FiEye, FiBookmark } from 'react-icons/fi';
import jwtAxios from '../../api/jwtAxios';
import { formatTimeAgo } from '../../utils/time';
import { stripHtml } from '../../utils/text';

// QnA 게시글 카드 컴포넌트
export interface QnAPost {
  qnaId: number;
  title: string;
  body?: string;
  createdAt: string;
  techStacks?: string[];
  tags?: string[];
  
  authorProfileImageUrl?: string | null;
  nickname: string;
  username: string;
  authorUserId?: number | null;
  authorId?: number | null;
  author_id?: number | null;
  userId?: number | null;
  user_id?: number | null;
  
  likeCount?: number;
  likes?: number;
  dislikeCount?: number;
  dislikes?: number;
  viewCount?: number;
  views?: number;
  commentCount?: number;
  commentsCount?: number;
  shareCount?: number;
  shares?: number;
  
  isLiked?: boolean;
  liked?: boolean;
  isDisliked?: boolean;
  disliked?: boolean;
  isBookmarked?: boolean;
  bookmarked?: boolean;
  isAuthor?: boolean;
  author?: boolean;
  
  resolved?: boolean;
  points?: number;
  manualRewardPoints?: number;
}

interface QnAPostCardProps {
  post: QnAPost;
  onEdit?: (post: QnAPost) => void;
  onDelete?: (qnaId: number) => void;
  onDetailClick?: () => void;
  onComment?: () => void;
}

const QnAPostCard: React.FC<QnAPostCardProps> = ({ 
  post, 
  onEdit, 
  onDelete, 
  onDetailClick, 
  onComment 
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [localPost, setLocalPost] = useState<QnAPost>(post);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Sync with parent data changes
  useEffect(() => {
    setLocalPost(post);
  }, [post]);

  // Close dropdown on outside click
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

  // Normalize data (handle both API response patterns)
  const tags = localPost.techStacks || localPost.tags || [];
  const likeCount = localPost.likeCount ?? localPost.likes ?? 0;
  const dislikeCount = localPost.dislikeCount ?? localPost.dislikes ?? 0;
  const viewCount = localPost.viewCount ?? localPost.views ?? 0;
  const commentCount = localPost.commentCount ?? localPost.commentsCount ?? 0;
  const shareCount = localPost.shareCount ?? localPost.shares ?? 0;
  
  const isMyPost = localPost.isAuthor || localPost.author === true;
  const isLiked = localPost.isLiked || localPost.liked === true;
  const isDisliked = localPost.isDisliked || localPost.disliked === true;
  const isBookmarked = localPost.isBookmarked || localPost.bookmarked === true;

  // Optimistic update - Like
  const handleLikeClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const originalState = { ...localPost };

    setLocalPost(prev => {
      const newState = { ...prev };
      if (newState.isLiked || newState.liked) {
        newState.likeCount = (newState.likeCount ?? 0) - 1;
        newState.isLiked = false;
      } else {
        newState.likeCount = (newState.likeCount ?? 0) + 1;
        newState.isLiked = true;
        if (newState.isDisliked || newState.disliked) {
          newState.dislikeCount = (newState.dislikeCount ?? 0) - 1;
          newState.isDisliked = false;
        }
      }
      newState.liked = newState.isLiked;
      newState.disliked = newState.isDisliked;
      return newState;
    });

    try {
      await jwtAxios.post(`qna/${localPost.qnaId}/like`);
    } catch (error) {
      setLocalPost(originalState);
      alert('요청에 실패했습니다.');
    }
  };

  // Optimistic update - Dislike
  const handleDislikeClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const originalState = { ...localPost };

    setLocalPost(prev => {
      const newState = { ...prev };
      if (newState.isDisliked || newState.disliked) {
        newState.dislikeCount = (newState.dislikeCount ?? 0) - 1;
        newState.isDisliked = false;
      } else {
        newState.dislikeCount = (newState.dislikeCount ?? 0) + 1;
        newState.isDisliked = true;
        if (newState.isLiked || newState.liked) {
          newState.likeCount = (newState.likeCount ?? 0) - 1;
          newState.isLiked = false;
        }
      }
      newState.liked = newState.isLiked;
      newState.disliked = newState.isDisliked;
      return newState;
    });

    try {
      await jwtAxios.post(`qna/${localPost.qnaId}/dislike`);
    } catch (error) {
      setLocalPost(originalState);
      alert('요청에 실패했습니다.');
    }
  };

  // Optimistic update - Bookmark
  const handleBookmarkClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const originalBookmarked = isBookmarked;
    
    setLocalPost(prev => ({
      ...prev,
      isBookmarked: !originalBookmarked,
      bookmarked: !originalBookmarked,
    }));

    try {
      await jwtAxios.post(`qna/${localPost.qnaId}/bookmark`);
    } catch (error) {
      setLocalPost(prev => ({ 
        ...prev, 
        isBookmarked: originalBookmarked, 
        bookmarked: originalBookmarked 
      }));
      alert('요청에 실패했습니다.');
    }
  };

  // Share (copy to clipboard)
  const handleShareClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const url = `${window.location.origin}/qna/${localPost.qnaId}`;
    try {
      await navigator.clipboard.writeText(url);
      alert('클립보드에 복사되었습니다.');
    } catch (err) {
      alert('복사에 실패했습니다.');
    }
  };

  // Handle edit
  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDropdownOpen(false);
    if (onEdit) onEdit(localPost);
  };

  // Handle delete
  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDropdownOpen(false);
    if (onDelete) {
      onDelete(localPost.qnaId);
    }
  };

  return (
    <article className="bg-surface border border-border rounded-2xl p-5 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all flex flex-col gap-4 cursor-pointer">
      {/* Main content area (clickable for detail modal) */}
      <div onClick={onDetailClick} className="cursor-pointer flex flex-col gap-4">
        {/* Top: Profile and info section */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            {/* Round profile image */}
            <div className="w-10 h-10 rounded-full bg-background overflow-hidden flex-shrink-0 border border-border">
              {localPost.authorProfileImageUrl ? (
                <img 
                  src={localPost.authorProfileImageUrl} 
                  alt="profile" 
                  className="w-full h-full object-cover" 
                />
              ) : (
                <div className="w-full h-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                  {localPost.nickname?.charAt(0) || 'U'}
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-foreground truncate">
                  {localPost.nickname || '익명'}
                </p>
                <span className="text-xs text-muted-foreground">
                  @{localPost.username || 'unknown'}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                {formatTimeAgo(localPost.createdAt)}
              </p>
            </div>
          </div>

          {/* More menu and status/points on the right */}
          <div className="flex items-center gap-2">
            {localPost.resolved !== undefined && (
              <span className={`text-xs px-2 py-1 rounded-full font-semibold ${
                localPost.resolved
                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400'
                  : 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400'
              }`}>
                {localPost.resolved ? '해결됨' : '미해결'}
              </span>
            )}
            {localPost.points !== undefined && (
              <span className="text-xs font-semibold text-primary">
                +{localPost.points}P
              </span>
            )}
            {isMyPost && (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsDropdownOpen(!isDropdownOpen);
                  }}
                  className="p-2 rounded-full hover:bg-secondary transition-colors"
                  title="더보기"
                >
                  <FiMoreVertical className="w-5 h-5 text-muted-foreground" />
                </button>

                {/* Dropdown menu */}
                {isDropdownOpen && (
                  <div className="absolute right-0 mt-1 w-36 bg-surface border border-border shadow-lg rounded-xl overflow-hidden z-10">
                    {commentCount > 0 ? (
                      <div className="px-4 py-2.5 text-xs text-muted-foreground">
                        답변이 달린 질문은<br/>수정·삭제할 수 없습니다.
                      </div>
                    ) : (
                      <>
                        <button
                          onClick={handleEditClick}
                          className="w-full text-left px-4 py-2 text-sm text-foreground hover:bg-secondary transition-colors"
                        >
                          수정
                        </button>
                        <button
                          onClick={handleDeleteClick}
                          className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-500/10 transition-colors"
                        >
                          삭제
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Title and body */}
        <div className="flex flex-col gap-2">
          <h2 className="text-lg font-semibold text-foreground line-clamp-2">
            {localPost.title}
          </h2>
          <p className="text-sm text-muted-foreground line-clamp-3">
            {stripHtml(localPost.body || '') || '내용 없음'}
          </p>
        </div>

        {/* Tags */}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <span
                key={tag}
                className="text-xs px-2.5 py-1 bg-secondary text-foreground rounded-full font-semibold cursor-pointer hover:bg-foreground/20 transition-colors"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Bottom: Action buttons */}
      <div className="flex justify-between items-center pt-4 border-t border-border mt-2">
        <div className="flex gap-2">
          <button
            onClick={handleLikeClick}
            className={`relative group flex items-center justify-center gap-1.5 px-3 h-10 bg-background border border-border rounded-full hover:bg-secondary text-muted-foreground transition-colors shrink-0 ${isLiked ? 'text-rose-500 border-rose-500/20 bg-rose-500/10' : ''}`}
          >
            <FiHeart size={18} className={isLiked ? 'fill-current' : ''} />
            <span className="text-sm font-semibold">{likeCount}</span>
          </button>

          <button
            onClick={handleDislikeClick}
            className={`relative group flex items-center justify-center gap-1.5 px-3 h-10 bg-background border border-border rounded-full hover:bg-secondary text-muted-foreground transition-colors shrink-0 ${isDisliked ? 'text-purple-500 border-purple-500/20 bg-purple-500/10' : ''}`}
          >
            <FiThumbsDown size={18} className={isDisliked ? 'fill-current' : ''} />
            <span className="text-sm font-semibold">{dislikeCount}</span>
          </button>

          <button
            onClick={(e) => { e.stopPropagation(); onComment?.(); }}
            className="relative group flex items-center justify-center gap-1.5 px-3 h-10 bg-background border border-border rounded-full hover:bg-secondary text-muted-foreground transition-colors shrink-0"
          >
            <FiMessageCircle size={18} />
            <span className="text-sm font-semibold">{commentCount}</span>
          </button>

          <div className="relative group flex items-center justify-center gap-1.5 px-3 h-10 text-muted-foreground shrink-0">
            <FiEye size={18} />
            <span className="text-sm font-semibold">{viewCount}</span>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleShareClick}
            className="relative group flex items-center justify-center w-10 h-10 bg-background border border-border rounded-full hover:bg-secondary text-muted-foreground transition-colors shrink-0"
          >
            <FiShare2 size={18} />
          </button>

          <button
            onClick={handleBookmarkClick}
            className={`relative group flex items-center justify-center w-10 h-10 bg-background border rounded-full hover:bg-secondary transition-colors shrink-0 ${isBookmarked ? 'text-amber-500 border-amber-500/20 bg-amber-500/10' : 'text-muted-foreground border-border'}`}
          >
            <FiBookmark size={18} className={isBookmarked ? 'fill-current' : ''} />
          </button>
        </div>
      </div>
    </article>
  );
};

export default QnAPostCard;
