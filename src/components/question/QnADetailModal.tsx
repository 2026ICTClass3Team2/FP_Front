import React, { useState, useEffect, useRef } from 'react';
import { FiX, FiHeart, FiThumbsDown, FiMessageCircle, FiBookmark, FiShare2, FiEye } from 'react-icons/fi';
import { QnAPost } from './QnAPostCard';
import CommentList from '../feed/CommentList';
import jwtAxios from '../../api/jwtAxios';
import { formatTimeAgo } from '../../utils/time';

//QnA 상세 모달 컴포넌트
interface QnADetailModalProps {
  post: QnAPost;
  onClose: (updatedPost?: QnAPost) => void;
  autoScrollToComment?: boolean;
}

const QnADetailModal: React.FC<QnADetailModalProps> = ({ 
  post, 
  onClose, 
  autoScrollToComment = false 
}) => {
  const [localPost, setLocalPost] = useState<QnAPost>(post);
  const [isLoadingDetails, setIsLoadingDetails] = useState(true);
  const viewCountIncrementedRef = useRef<Set<number>>(new Set());
  const commentSectionRef = useRef<HTMLDivElement>(null);
  const backdropClickRef = useRef(false);

  // Escape key handler
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose(localPost);
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => {
      window.removeEventListener('keydown', handleEscape);
    };
  }, [onClose, localPost]);

  // Prevent background scroll
  useEffect(() => {
    const scrollY = window.scrollY;
    const originalPosition = document.body.style.position;
    const originalTop = document.body.style.top;
    const originalWidth = document.body.style.width;
    const originalOverflow = document.body.style.overflow;

    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = '100%';
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.position = originalPosition;
      document.body.style.top = originalTop;
      document.body.style.width = originalWidth;
      document.body.style.overflow = originalOverflow;
      window.scrollTo(0, scrollY);
    };
  }, []);

  // Load post details and increment view count
  useEffect(() => {
    let isCancelled = false;

    if (post?.qnaId && !viewCountIncrementedRef.current.has(post.qnaId)) {
      const fetchDetailsAndUpdateViewCount = async () => {
        setIsLoadingDetails(true);
        try {
          const response = await jwtAxios.get(`qna/${post.qnaId}`);
          if (!isCancelled) {
            setLocalPost(response.data);
          }
        } catch (error) {
          if (!isCancelled) {
            console.error("게시글 상세 정보 로딩 실패:", error);
            alert("게시글 상세 정보를 불러오는 데 실패했습니다.");
            onClose(post);
          }
        } finally {
          if (!isCancelled) {
            setIsLoadingDetails(false);
            viewCountIncrementedRef.current.add(post.qnaId);
          }
        }
      };
      fetchDetailsAndUpdateViewCount();
    }
    
    return () => {
      isCancelled = true;
      if (post?.qnaId) viewCountIncrementedRef.current.delete(post.qnaId);
    };
  }, [post?.qnaId]);

  // Auto scroll to comment section
  useEffect(() => {
    if (!isLoadingDetails && autoScrollToComment && commentSectionRef.current) {
      setTimeout(() => {
        commentSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }, [isLoadingDetails, autoScrollToComment]);

  // Optimistic update - Like
  const handleLike = async () => {
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
  const handleDislike = async () => {
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
  const handleBookmark = async () => {
    const originalBookmarked = localPost.isBookmarked || localPost.bookmarked;
    
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
  const handleShare = async () => {
    const url = `${window.location.origin}/qna?qnaId=${localPost.qnaId}`;
    try {
      await navigator.clipboard.writeText(url);
      alert('클립보드에 복사되었습니다.');
    } catch (err) {
      alert('복사에 실패했습니다.');
    }
  };

  if (isLoadingDetails) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
        <div className="w-16 h-16 border-4 border-foreground/40 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!localPost) return null;

  const tags = localPost.techStacks || localPost.tags || [];
  const likeCount = localPost.likeCount ?? localPost.likes ?? 0;
  const dislikeCount = localPost.dislikeCount ?? localPost.dislikes ?? 0;
  const viewCount = localPost.viewCount ?? localPost.views ?? 0;
  const commentCount = localPost.commentCount ?? localPost.commentsCount ?? 0;
  const isLiked = localPost.isLiked || localPost.liked === true;
  const isDisliked = localPost.isDisliked || localPost.disliked === true;
  const isBookmarked = localPost.isBookmarked || localPost.bookmarked === true;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" 
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) {
          backdropClickRef.current = true;
        }
      }}
      onMouseUp={(e) => {
        if (e.target === e.currentTarget && backdropClickRef.current) {
          onClose(localPost);
        }
        backdropClickRef.current = false;
      }}
    >
      <div className="relative w-full max-w-2xl bg-surface rounded-3xl shadow-2xl p-6 md:p-8 max-h-[90vh] overflow-y-auto
       [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]" onClick={(e) => e.stopPropagation()}>
        
        {/* Close button */}
        <button 
          onClick={() => onClose(localPost)}
          className="absolute top-5 right-5 p-2 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-full transition-colors"
          aria-label="닫기"
        >
          <FiX size={24} />
        </button>

        {/* Author header */}
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 rounded-full bg-background text-foreground flex items-center justify-center font-bold text-lg shrink-0 overflow-hidden border border-border">
            {localPost.authorProfileImageUrl ? (
              <img src={localPost.authorProfileImageUrl} alt="profile" className="w-full h-full object-cover" />
            ) : (
              localPost.nickname?.charAt(0) || 'U'
            )}
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-foreground">{localPost.nickname || '익명'}</span>
            <span className="text-sm text-muted-foreground">@{localPost.username || 'unknown'}</span>
            <span className="text-xs text-muted-foreground mt-0.5">{formatTimeAgo(localPost.createdAt)}</span>
          </div>
          
          {/* Status badge */}
          {localPost.resolved !== undefined && (
            <div className="ml-auto">
              <span className={`text-xs px-3 py-1.5 rounded-full font-semibold ${
                localPost.resolved 
                  ? 'bg-secondary text-foreground' 
                  : 'bg-background text-muted-foreground border border-border'
              }`}>
                {localPost.resolved ? '해결됨' : '미해결'}
              </span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-extrabold text-foreground my-4">{localPost.title}</h1>
          <div 
            className="text-foreground/80 text-base md:text-lg leading-relaxed mb-6 [&>p]:mb-2 [&_img]:max-h-96 [&_img]:inline-block"
            dangerouslySetInnerHTML={{ __html: localPost.body || '<p>내용 없음</p>' }}
          />
          
          {/* Tags */}
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {tags.map(tag => (
                <span key={tag} className="px-4 py-1.5 bg-secondary text-muted-foreground border border-border rounded-full text-sm font-medium">
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Points info */}
          {localPost.points !== undefined && (
            <div className="mt-4 p-3 bg-secondary border border-border rounded-lg">
              <p className="text-sm text-foreground">
                <span className="font-semibold">채택 포인트: +{localPost.points}P</span>
              </p>
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex justify-between items-center mb-8 px-2 border-t border-b border-gray-200 dark:border-gray-700 py-4">
          <div className="flex gap-2">
            <button 
              onClick={handleLike} 
              className={`relative group flex items-center justify-center gap-1.5 px-3 h-10 bg-white dark:bg-slate-700 border border-gray-200 dark:border-gray-600 rounded-full hover:bg-gray-50 dark:hover:bg-slate-600 transition-colors shrink-0 ${isLiked ? 'text-rose-500 border-rose-200 dark:border-rose-700 bg-rose-50 dark:bg-rose-900/20' : 'text-gray-500 dark:text-gray-400'}`}
            >
              <FiHeart size={18} className={isLiked ? 'fill-current' : ''} />
              <span className="text-sm font-semibold">{likeCount}</span>
            </button>
            
            <button 
              onClick={handleDislike} 
              className={`relative group flex items-center justify-center gap-1.5 px-3 h-10 bg-white dark:bg-slate-700 border border-gray-200 dark:border-gray-600 rounded-full hover:bg-gray-50 dark:hover:bg-slate-600 transition-colors shrink-0 ${isDisliked ? 'text-purple-500 border-purple-200 dark:border-purple-700 bg-purple-50 dark:bg-purple-900/20' : 'text-gray-500 dark:text-gray-400'}`}
            >
              <FiThumbsDown size={18} className={isDisliked ? 'fill-current' : ''} />
              <span className="text-sm font-semibold">{dislikeCount}</span>
            </button>
            
            <button className="relative group flex items-center justify-center gap-1.5 px-3 h-10 bg-white dark:bg-slate-700 border border-gray-200 dark:border-gray-600 rounded-full hover:bg-gray-50 dark:hover:bg-slate-600 text-gray-500 dark:text-gray-400 transition-colors shrink-0">
              <FiMessageCircle size={18} />
              <span className="text-sm font-semibold">{commentCount}</span>
            </button>
            
            <div className="relative group flex items-center justify-center gap-1.5 px-3 h-10 text-gray-400 dark:text-gray-500 shrink-0">
              <FiEye size={18} />
              <span className="text-sm font-semibold">{viewCount}</span>
            </div>
          </div>
          
          <div className="flex gap-2">
            <button 
              onClick={handleShare} 
              className="relative group flex items-center justify-center w-10 h-10 bg-white dark:bg-slate-700 border border-gray-200 dark:border-gray-600 rounded-full hover:bg-gray-50 dark:hover:bg-slate-600 text-gray-500 dark:text-gray-400 transition-colors shrink-0"
            >
              <FiShare2 size={18} />
            </button>
            
            <button 
              onClick={handleBookmark} 
              className={`relative group flex items-center justify-center w-10 h-10 bg-white dark:bg-slate-700 border border-gray-200 dark:border-gray-600 rounded-full hover:bg-gray-50 dark:hover:bg-slate-600 transition-colors shrink-0 ${isBookmarked ? 'text-amber-500 border-amber-200 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20' : 'text-gray-500 dark:text-gray-400'}`}
            >
              <FiBookmark size={18} className={isBookmarked ? 'fill-current' : ''} />
            </button>
          </div>
        </div>

        {/* Comment section */}
        <div ref={commentSectionRef}>
          <CommentList 
            postId={localPost.qnaId} 
            resourcePath="qna"
            commentCount={commentCount}
            onCommentCountChange={(delta) => setLocalPost(prev => ({ 
              ...prev, 
              commentCount: Math.max(0, (prev.commentCount ?? 0) + delta),
              commentsCount: Math.max(0, (prev.commentsCount ?? 0) + delta)
            }))}
          />
        </div>
      </div>
    </div>
  );
};

export default QnADetailModal;
