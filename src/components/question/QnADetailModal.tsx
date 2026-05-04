import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useChatStore } from '../../stores/chatStore';
import { FiX, FiHeart, FiThumbsDown, FiMessageCircle, FiBookmark, FiShare2, FiEye, FiAlertTriangle, FiMoreVertical, FiEdit2, FiTrash2 } from 'react-icons/fi';
import { QnAPost } from './QnAPostCard';
import CommentList from '../feed/CommentList';
import ReportModal from '../common/ReportModal';
import UserProfileModal from '../common/UserProfileModal';
import jwtAxios from '../../api/jwtAxios';
import { formatTimeAgo } from '../../utils/time';

//QnA 상세 모달 컴포넌트
interface QnADetailModalProps {
  post: QnAPost;
  onClose: (updatedPost?: QnAPost) => void;
  autoScrollToComment?: boolean;
  onEditClick?: (post: QnAPost) => void;
  onDeleteClick?: (qnaId: number) => void;
}

const QnADetailModal: React.FC<QnADetailModalProps> = ({
  post,
  onClose,
  autoScrollToComment = false,
  onEditClick,
  onDeleteClick,
}) => {
  const { openChatWith } = useChatStore();
  const [localPost, setLocalPost] = useState<QnAPost>(post);
  const [isLoadingDetails, setIsLoadingDetails] = useState(true);
  // Bug 4: 작성자 외 타인 댓글 존재 여부 (true면 수정/삭제 비활성화)
  // 댓글 목록이 로드되기 전까지 false로 초기화 (수정/삭제 가능 상태 유지)
  const [hasNonAuthorComments, setHasNonAuthorComments] = useState<boolean>(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [profileModalUserId, setProfileModalUserId] = useState<number | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const viewCountIncrementedRef = useRef<Set<number>>(new Set());
  const commentSectionRef = useRef<HTMLDivElement>(null);
  const backdropClickRef = useRef(false);

  const handleClose = () => {
    onClose(localPost);
  };

  const handleStartChat = useCallback((partner: any) => {
    openChatWith(partner);
    handleClose();
  }, [localPost]);

  // ESC 키: 신고 모달이 열려 있으면 무시(ReportModal이 직접 처리), 입력란 focus 중이면 blur, 아니면 닫기
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (isReportModalOpen) return;
        const active = document.activeElement;
        if (active && (active.tagName === 'TEXTAREA' || active.tagName === 'INPUT' || active.tagName === 'SELECT')) {
          (active as HTMLElement).blur();
        } else {
          handleClose();
        }
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => {
      window.removeEventListener('keydown', handleEscape);
    };
  }, [onClose, localPost, isReportModalOpen]);

  // Prevent background scroll (actual scroll container is <main>)
  useEffect(() => {
    const main = document.querySelector('main') as HTMLElement | null;
    if (!main) return;
    const prevOverflow = main.style.overflow;
    main.style.overflow = 'hidden';
    return () => {
      main.style.overflow = prevOverflow;
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
            const detailData = response.data || {};
            setLocalPost({
              ...post,
              ...detailData,
              authorUserId: detailData.authorUserId ?? detailData.authorId ?? detailData.author_id ?? detailData.userId ?? detailData.user_id ?? post.authorUserId ?? post.authorId ?? post.author_id ?? post.userId ?? post.user_id ?? null,
              techStacks: detailData.techStacks ?? detailData.tags ?? post.techStacks ?? post.tags ?? [],
              tags: detailData.tags ?? detailData.techStacks ?? post.tags ?? post.techStacks ?? [],
            });
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

  // 메뉴 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    if (isMenuOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMenuOpen]);

  const handleEdit = () => {
    setIsMenuOpen(false);
    handleClose();
    onEditClick?.(localPost);
  };

  const handleDelete = () => {
    setIsMenuOpen(false);
    onClose();
    onDeleteClick?.(localPost.qnaId);
  };

  // Optimistic update - Like
  const handleLike = async () => {
    const originalState = { ...localPost };
    setLocalPost(prev => {
      const newState = { ...prev };
      if (newState.isLiked === true) {
        newState.likeCount = (newState.likeCount ?? 0) - 1;
        newState.isLiked = false;
      } else {
        newState.likeCount = (newState.likeCount ?? 0) + 1;
        newState.isLiked = true;
        if (newState.isDisliked === true) {
          newState.dislikeCount = (newState.dislikeCount ?? 0) - 1;
          newState.isDisliked = false;
        }
      }
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
      if (newState.isDisliked === true) {
        newState.dislikeCount = (newState.dislikeCount ?? 0) - 1;
        newState.isDisliked = false;
      } else {
        newState.dislikeCount = (newState.dislikeCount ?? 0) + 1;
        newState.isDisliked = true;
        if (newState.isLiked === true) {
          newState.likeCount = (newState.likeCount ?? 0) - 1;
          newState.isLiked = false;
        }
      }
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

  const handleAcceptAnswer = async (commentId: number) => {
    // Expected backend endpoint for accepting an answer comment in QnA.
    await jwtAxios.post(`qna/${localPost.qnaId}/comments/${commentId}/accept`);

    setLocalPost(prev => ({
      ...prev,
      resolved: true,
    }));
  };

  if (isLoadingDetails) {
    return (
      <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
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
      className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" 
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) {
          backdropClickRef.current = true;
        }
      }}
      onMouseUp={(e) => {
        if (e.target === e.currentTarget && backdropClickRef.current) {
          handleClose();
        }
        backdropClickRef.current = false;
      }}
    >
      <div 
        className="relative w-full max-w-2xl bg-background rounded-3xl shadow-2xl p-6 md:p-8 max-h-[90vh] overflow-y-auto overflow-x-auto scrollbar-hide" 
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
      >
        
        {/* 우측 상단: 작성자면 수정/삭제 메뉴, 타인이면 신고 + 닫기 버튼 */}
        <div className="absolute top-5 right-5 flex items-center gap-1">
          {(localPost.isAuthor || (localPost as any).author === true) ? (
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setIsMenuOpen(prev => !prev)}
                className="p-2 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-full transition-colors"
                aria-label="게시글 메뉴"
              >
                <FiMoreVertical size={20} />
              </button>
              {isMenuOpen && (
                <div className="absolute right-0 top-10 w-40 bg-background border border-border rounded-xl shadow-lg z-10 overflow-hidden">
                  {hasNonAuthorComments ? (
                    <div className="px-4 py-2.5 text-xs text-muted-foreground">
                      답변이 달린 질문은<br/>수정·삭제할 수 없습니다.
                    </div>
                  ) : (
                    <>
                      <button
                        onClick={handleEdit}
                        className="w-full flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-secondary transition-colors"
                      >
                        <FiEdit2 size={14} />
                        수정
                      </button>
                      <button
                        onClick={handleDelete}
                        className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-500 hover:bg-red-500/10 transition-colors"
                      >
                        <FiTrash2 size={14} />
                        삭제
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={() => setIsReportModalOpen(true)}
              className="p-2 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded-full transition-colors"
              aria-label="게시글 신고"
            >
              <FiAlertTriangle size={20} />
            </button>
          )}
          <button
            onClick={handleClose}
            className="p-2 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-full transition-colors"
            aria-label="닫기"
          >
            <FiX size={24} />
          </button>
        </div>

        {/* Author header */}
        <div className="flex items-center gap-4 mb-3 pr-28">
          <div
            className="w-12 h-12 rounded-full bg-background text-foreground flex items-center justify-center font-bold text-lg shrink-0 overflow-hidden border border-border cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all"
            onClick={() => { const uid = localPost.authorUserId ?? (localPost as any).authorId; if (uid) setProfileModalUserId(uid); }}
          >
            {localPost.authorProfileImageUrl ? (
              <img src={localPost.authorProfileImageUrl} alt="profile" className="w-full h-full object-cover" />
            ) : (
              localPost.nickname?.charAt(0) || 'U'
            )}
          </div>
          <div className="flex flex-col">
            <span
              className="font-bold text-foreground cursor-pointer hover:underline"
              onClick={() => { const uid = localPost.authorUserId ?? (localPost as any).authorId; if (uid) setProfileModalUserId(uid); }}
            >{localPost.nickname || '익명'}</span>
            <span className="text-sm text-muted-foreground">@{localPost.username || 'unknown'}</span>
            <span className="text-xs text-muted-foreground mt-0.5">{formatTimeAgo(localPost.createdAt)}</span>
          </div>
        </div>

        {/* Status badge */}
        {localPost.resolved !== undefined && (
          <div className="mb-6 mt-1">
            <span className={`text-xs px-3 py-1.5 rounded-full font-semibold ${
              localPost.resolved
                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400'
                : 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400'
            }`}>
              {localPost.resolved ? '해결됨' : '미해결'}
            </span>
          </div>
        )}

        {/* Content */}
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-extrabold text-foreground my-4">{localPost.title}</h1>
          <div 
            className="text-foreground text-base md:text-lg leading-relaxed mb-6 [&>p]:mb-2 [&_img]:max-w-full [&_img]:h-auto [&_img]:rounded-md [&_img]:inline-block [&_img[src*='flaticon']]:w-24 [&_img[src*='flaticon']]:h-24 [&_pre]:bg-muted [&_pre]:text-foreground [&_pre]:px-3 [&_pre]:py-2 [&_pre]:rounded-md [&_pre]:overflow-x-auto [&_pre]:font-mono [&_pre]:text-sm [&_pre]:my-4 [&_pre]:whitespace-pre [&_blockquote]:border-l-4 [&_blockquote]:border-border [&_blockquote]:pl-4 [&_blockquote]:my-2 [&_blockquote]:text-muted-foreground"
            dangerouslySetInnerHTML={{ __html: localPost.body || '<p>내용 없음</p>' }}
          />
          
          {/* Tags */}
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {tags.map(tag => (
                <span key={tag} className="px-4 py-1.5 bg-secondary text-secondary-foreground border border-border rounded-full text-sm font-medium">
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Points info */}
          {localPost.points !== undefined && (
            <div className="mt-4 flex items-center gap-2">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500/10 border border-amber-500/30 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
                  fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M13.744 17.736a6 6 0 1 1-7.48-7.48"/><path d="M15 6h1v4"/>
                  <path d="m6.134 14.768.866-.5 2 3.464"/><circle cx="16" cy="8" r="6"/>
                </svg>
                <span className="text-sm font-bold text-amber-600 dark:text-amber-400">
                  채택 시 +{localPost.points}P 지급
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex justify-between items-center mb-8 px-2">
          <div className="flex gap-2">
            <button
              onClick={handleLike}
              className={`relative group flex items-center justify-center gap-1.5 px-3 h-10 bg-background border border-border rounded-full hover:bg-secondary text-muted-foreground transition-colors shrink-0 ${isLiked ? 'text-rose-500 border-rose-500/20 bg-rose-500/10' : ''}`}
            >
              <FiHeart size={18} className={isLiked ? 'fill-current' : ''} />
              <span className="text-sm font-semibold">{likeCount}</span>
            </button>

            <button
              onClick={handleDislike}
              className={`relative group flex items-center justify-center gap-1.5 px-3 h-10 bg-background border border-border rounded-full hover:bg-secondary text-muted-foreground transition-colors shrink-0 ${isDisliked ? 'text-purple-500 border-purple-500/20 bg-purple-500/10' : ''}`}
            >
              <FiThumbsDown size={18} className={isDisliked ? 'fill-current' : ''} />
              <span className="text-sm font-semibold">{dislikeCount}</span>
            </button>

            <button className="relative group flex items-center justify-center gap-1.5 px-3 h-10 bg-background border border-border rounded-full hover:bg-secondary text-muted-foreground transition-colors shrink-0">
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
              onClick={handleShare}
              className="relative group flex items-center justify-center w-10 h-10 bg-background border border-border rounded-full hover:bg-secondary text-muted-foreground transition-colors shrink-0"
            >
              <FiShare2 size={18} />
            </button>

            <button
              onClick={handleBookmark}
              className={`relative group flex items-center justify-center w-10 h-10 bg-background border rounded-full hover:bg-secondary transition-colors shrink-0 ${isBookmarked ? 'text-amber-500 border-amber-500/20 bg-amber-500/10' : 'text-muted-foreground border-border'}`}
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
            postAuthorUserId={localPost.authorUserId ?? localPost.authorId ?? localPost.author_id ?? localPost.userId ?? localPost.user_id ?? null}
            postResolved={localPost.resolved === true}
            onAcceptAnswer={handleAcceptAnswer}
            onCommentCountChange={(delta) => setLocalPost(prev => ({
              ...prev,
              commentCount: Math.max(0, (prev.commentCount ?? 0) + delta),
              commentsCount: Math.max(0, (prev.commentsCount ?? 0) + delta)
            }))}
            onHasNonAuthorCommentsChange={setHasNonAuthorComments}
            onResolvedChanged={(isResolved) => setLocalPost(prev => ({ ...prev, resolved: isResolved }))}
            onStartChat={handleStartChat}
          />
        </div>

        {isReportModalOpen && (
          <ReportModal
            isOpen={isReportModalOpen}
            onClose={() => setIsReportModalOpen(false)}
            targetType="qna"
            targetId={localPost.qnaId}
            onSuccess={() => {
              setIsReportModalOpen(false);
              onClose();
            }}
          />
        )}

        <UserProfileModal
          isOpen={profileModalUserId !== null}
          onClose={() => setProfileModalUserId(null)}
          userId={profileModalUserId}
          onStartChat={handleStartChat}
        />
      </div>
    </div>
  );
};

export default QnADetailModal;
