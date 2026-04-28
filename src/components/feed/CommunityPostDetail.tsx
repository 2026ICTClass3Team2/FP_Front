import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiX, FiHeart, FiThumbsDown, FiMessageCircle, FiBookmark, FiShare2, FiEye, FiAlertTriangle, FiLink, FiMoreVertical, FiEdit2, FiTrash2 } from 'react-icons/fi';
import { Post } from './PostCard';
import CommentList from './CommentList';
import jwtAxios from '../../api/jwtAxios';
import { formatTimeAgo } from '../../utils/time';
import ReportModal from '../common/ReportModal';
import UserProfileModal from '../common/UserProfileModal';

interface CommunityPostDetailProps {
  post: Post;
  onClose: (updatedPost?: Post) => void;
  autoScrollToComment?: boolean;
  onEditClick?: (post: Post) => void;
  onDeleteClick?: (postId: number) => void;
}

const CommunityPostDetail: React.FC<CommunityPostDetailProps> = ({ post, onClose, autoScrollToComment = false, onEditClick, onDeleteClick }) => {
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const currentUserId = currentUser?.userId ?? currentUser?.user_id ?? currentUser?.id ?? null;
  const [localPost, setLocalPost] = useState<Post>(post);
  const [isLoadingDetails, setIsLoadingDetails] = useState(true);
  const [channelSuspendedError, setChannelSuspendedError] = useState<string | null>(null);
  const viewCountIncrementedRef = useRef<Set<number>>(new Set());
  const commentSectionRef = useRef<HTMLDivElement>(null);
  const backdropClickRef = useRef(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportTarget, setReportTarget] = useState<{ type: 'post' | 'comment' | 'user', id: number } | null>(null);
  const [profileModalUserId, setProfileModalUserId] = useState<number | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const handleClose = () => {
    onClose(localPost);
  };

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

  // 모달이 열려있을 때 배경 스크롤 방지 (실제 스크롤 컨테이너는 <main>)
  useEffect(() => {
    const main = document.querySelector('main') as HTMLElement | null;
    if (!main) return;
    const prevOverflow = main.style.overflow;
    main.style.overflow = 'hidden';
    return () => {
      main.style.overflow = prevOverflow;
    };
  }, []);

  // 모달이 열릴 때 게시글 상세 정보를 다시 불러와 조회수를 업데이트합니다.
  useEffect(() => {
    // postId가 유효하고, 아직 API 호출을 하지 않았을 때만 실행
    if (post?.postId && !viewCountIncrementedRef.current.has(post.postId)) {
      const fetchDetailsAndUpdateViewCount = async () => {
        setIsLoadingDetails(true); // 로딩 시작
        try {
          // 이 API를 호출하면 백엔드에서 조회수가 1 증가합니다.
          const response = await jwtAxios.get(`posts/${post.postId}`);
          // interaction 상태(isLiked, isDisliked, isBookmarked)는 낙관적 업데이트가 선행했을 수 있으므로 현재 localPost 값 유지
          setLocalPost(prev => ({
            ...response.data,
            isLiked: prev.isLiked,
            isDisliked: prev.isDisliked,
            isBookmarked: prev.isBookmarked,
            bookmarked: prev.bookmarked,
            liked: prev.liked,
            disliked: prev.disliked,
          }));
        } catch (error: any) {
          console.error("게시글 상세 정보 로딩 실패:", error);
          const status = error?.response?.status;
          const message = error?.response?.data?.message;
          if (status === 410 || message === '삭제된 채널입니다') {
            setChannelSuspendedError('삭제된 채널입니다');
          } else {
            onClose(post); // Pass the original post on error
          }
        } finally {
          setIsLoadingDetails(false); // 로딩 종료
          // 해당 postId에 대한 조회수 증가 API 호출 완료를 기록
          viewCountIncrementedRef.current.add(post.postId);
        }
      };
      fetchDetailsAndUpdateViewCount();
    } else {
      // 이미 조회수를 올렸거나, post.id가 없는 경우
      // post 데이터가 이미 있다면 로딩을 바로 끝냅니다.
      setIsLoadingDetails(false);
    }
    // 클린업 함수: 컴포넌트 언마운트 또는 postId 변경 시 해당 postId 기록 삭제
    return () => {
      if (post?.postId) viewCountIncrementedRef.current.delete(post.postId);
    };
  }, [post?.postId, onClose]); // post.postId가 변경될 때만 실행, onClose도 의존성에 추가

  // 데이터 로딩 완료 후 댓글 영역으로 자동 스크롤
  useEffect(() => {
    if (!isLoadingDetails && autoScrollToComment && commentSectionRef.current) {
      // 하위 컴포넌트 렌더링 시간을 보장하기 위해 짧은 지연(setTimeout) 부여
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
    onClose(localPost);
    onEditClick?.(localPost);
  };

  const handleDelete = () => {
    setIsMenuOpen(false);
    onClose();
    onDeleteClick?.(localPost.postId);
  };

  const openReportModal = (type: 'post' | 'comment' | 'user', id: number) => {
    setReportTarget({ type, id });
    setIsReportModalOpen(true);
  };

  // 댓글에서 유저를 차단했을 때: 차단된 유저가 이 게시글 작성자이면 모달을 닫아 피드에서 제거
  const handleBlockUserFromComment = (blockedUserId: number) => {
    if (localPost.authorUserId != null && localPost.authorUserId === blockedUserId) {
      onClose();
    }
  };

  const handleReportSuccess = (reportData: any) => {
    // 게시글 자체를 신고했거나, 작성자를 차단했다면 모달을 닫고 부모에게 리프레시를 위임합니다.
    if (reportData.targetType.toUpperCase() === 'POST' || reportData.additionalAction) {
      // 부모 컴포넌트(FeedList 등)에서 이 게시글을 목록에서 제거하거나,
      // 전체 목록을 새로고침하도록 onClose를 호출합니다. (updatedPost 없이)
      onClose();
    } else {
      // 댓글만 신고된 경우, CommentList가 내부적으로 re-render 하므로 모달만 닫습니다.
      setIsReportModalOpen(false);
    }
  };

  // 낙관적 업데이트 - 좋아요
  const handleLike = async () => {
    const originalState = { ...localPost };
    setLocalPost(prev => {
      const newState = { ...prev };
      if (newState.isLiked || newState.liked) {
        // Currently liked, so unlike
        newState.likeCount--;
        newState.isLiked = false;
      } else {
        // Currently not liked, so like
        newState.likeCount++;
        newState.isLiked = true;
        if (newState.isDisliked || newState.disliked) {
          // If it was disliked, undislike it
          newState.dislikeCount--;
          newState.isDisliked = false;
        }
      }
      // sync liked property
      newState.liked = newState.isLiked;
      newState.disliked = newState.isDisliked;
      return newState;
    });

    try {
      await jwtAxios.post(`posts/${localPost.postId}/like`);
    } catch (error) {
      setLocalPost(originalState);
      alert('요청에 실패했습니다.');
    }
  };

  // 낙관적 업데이트 - 비추천
  const handleDislike = async () => {
    const originalState = { ...localPost };
    setLocalPost(prev => {
      const newState = { ...prev };
      if (newState.isDisliked || newState.disliked) {
        // Currently disliked, so undislike
        newState.dislikeCount--;
        newState.isDisliked = false;
      } else {
        // Currently not disliked, so dislike
        newState.dislikeCount++;
        newState.isDisliked = true;
        if (newState.isLiked || newState.liked) {
          // If it was liked, unlike it
          newState.likeCount--;
          newState.isLiked = false;
        }
      }
      // sync liked property
      newState.liked = newState.isLiked;
      newState.disliked = newState.isDisliked;
      return newState;
    });

    try {
      await jwtAxios.post(`posts/${localPost.postId}/dislike`);
    } catch (error) {
      setLocalPost(originalState);
      alert('요청에 실패했습니다.');
    }
  };

  // 낙관적 업데이트 - 북마크
  const handleBookmark = async () => {
    const originalBookmarked = localPost.isBookmarked || localPost.bookmarked || false;
    
    setLocalPost(prev => ({
      ...prev,
      isBookmarked: !originalBookmarked,
      bookmarked: !originalBookmarked,
    }));

    try {
      await jwtAxios.post(`posts/${localPost.postId}/bookmark`);
    } catch (error) {
      setLocalPost(prev => ({ ...prev, isBookmarked: originalBookmarked, bookmarked: originalBookmarked }));
      alert('요청에 실패했습니다.');
    }
  };

  // 공유 (클립보드 복사)
  const handleShare = async () => {
    const url = `${window.location.origin}${window.location.pathname}?postId=${localPost.postId}`;
    try {
      await navigator.clipboard.writeText(url);
      alert('클립보드에 복사되었습니다.');
    } catch (err) {
      alert('복사에 실패했습니다.');
    }
  };

  // 로딩 중일 때 스피너 표시
  if (isLoadingDetails) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
        <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // 정지된 채널의 게시글 접근 시 안내 모달
  if (channelSuspendedError) {
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
        onClick={handleClose}
      >
        <div
          className="bg-background rounded-3xl shadow-2xl p-8 max-w-sm w-full text-center"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="text-4xl mb-4">🚫</div>
          <h2 className="text-lg font-bold text-foreground mb-2">삭제된 채널입니다</h2>
          <p className="text-sm text-muted-foreground mb-6">해당 채널이 정지되어 게시글을 열람할 수 없습니다.</p>
          <button
            onClick={handleClose}
            className="px-6 py-2 bg-primary text-primary-foreground rounded-xl font-medium hover:opacity-90 transition-opacity"
          >
            확인
          </button>
        </div>
      </div>
    );
  }

  // localPost가 null이 될 가능성은 없지만, 타입스크립트 에러 방지용
  if (!localPost) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" 
      onMouseDown={(e) => {
        // 마우스를 누른 곳이 정확히 배경(backdrop)일 때만 true로 설정
        if (e.target === e.currentTarget) {
          backdropClickRef.current = true;
        }
      }}
      onMouseUp={(e) => {
        // 마우스를 뗀 곳도 배경이고, 누른 곳도 배경이었을 때만 모달 닫기
        if (e.target === e.currentTarget && backdropClickRef.current) {
          handleClose();
        }
        backdropClickRef.current = false; // 상태 초기화
      }}
    >
      <div className="relative w-full max-w-2xl bg-background rounded-3xl shadow-2xl p-6 md:p-8 max-h-[90vh] overflow-y-auto
       [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]" onClick={(e) => e.stopPropagation()}>
        
        {/* 우측 상단: 작성자면 수정/삭제 메뉴, 타인이면 신고 버튼 */}
        <div className="absolute top-5 right-5 flex items-center gap-1">
          {(localPost.isAuthor || (currentUserId !== null && localPost.authorUserId !== null && currentUserId === localPost.authorUserId)) ? (
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setIsMenuOpen(prev => !prev)}
                className="p-2 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-full transition-colors"
                aria-label="게시글 메뉴"
              >
                <FiMoreVertical size={20} />
              </button>
              {isMenuOpen && (
                <div className="absolute right-0 top-10 w-32 bg-background border border-border rounded-xl shadow-lg z-10 overflow-hidden">
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
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={() => openReportModal(localPost.contentType || 'post', localPost.postId)}
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

        {/* 분리된 하위 컴포넌트 렌더링 */}
        <AuthorHeader post={localPost} onProfileClick={(uid) => setProfileModalUserId(uid)} />
        <PostContent post={localPost} onClose={handleClose} />
        <ActionButtons 
          post={localPost} 
          onLike={handleLike}
          onDislike={handleDislike}
          onBookmark={handleBookmark}
          onShare={handleShare}
          onCommentClick={() => commentSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
        />
        
        {/* 댓글 리스트 컴포넌트 (여기로 스크롤 이동) */}
        <div ref={commentSectionRef}>
          <CommentList
            postId={localPost.postId}
            commentCount={localPost.commentCount || 0}
            onCommentCountChange={(delta) =>
              setLocalPost(prev => ({ ...prev, commentCount: Math.max(0, (prev.commentCount || 0) + delta) }))
            }
            onReportRequest={openReportModal}
            onBlockUser={handleBlockUserFromComment}
          />
        </div>
        
        {isReportModalOpen && reportTarget && (
          <ReportModal
            isOpen={isReportModalOpen}
            onClose={() => setIsReportModalOpen(false)}
            targetType={reportTarget.type}
            targetId={reportTarget.id}
            onSuccess={handleReportSuccess}
          />
        )}

        <UserProfileModal
          isOpen={profileModalUserId !== null}
          onClose={() => setProfileModalUserId(null)}
          userId={profileModalUserId}
        />
      </div>
    </div>
  );
};

// 1. 작성자 정보 영역 (Header)
const AuthorHeader = ({ post, onProfileClick }: { post: Post; onProfileClick?: (userId: number) => void }) => {
  const initial = post.authorNickname ? post.authorNickname.charAt(0).toUpperCase() : 'U';
  const handleClick = () => { if (post.authorUserId && onProfileClick) onProfileClick(post.authorUserId); };
  return (
    <div className="flex items-center gap-4 mb-6 pr-28">
      <div
        className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg shrink-0 overflow-hidden cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all"
        onClick={handleClick}
      >
        {post.authorProfileImageUrl ? (
          <img src={post.authorProfileImageUrl} alt="profile" className="w-full h-full object-cover" />
        ) : (
          initial
        )}
      </div>
      <div className="flex flex-col">
        <span className="font-bold text-foreground cursor-pointer hover:underline" onClick={handleClick}>{post.isAuthor ? post.authorNickname : (post.authorNickname || '익명')}</span>
        <span className="text-sm text-muted-foreground">@{post.authorUsername || 'unknown'}</span>
        <span className="text-xs text-muted-foreground mt-0.5">{formatTimeAgo(post.createdAt)}</span>
      </div>
    </div>
  );
};

// 2. 본문 영역 (Content)
const PostContent = ({ post, onClose }: { post: Post; onClose: () => void }) => {
  const navigate = useNavigate();

  return (
  <div className="mb-6">
    {/* 채널 정보 */}
    {post.channelName && post.channelId && (
      <div className="flex items-center gap-1.5 mb-3">
        <span
          className="flex items-center gap-1 text-xs font-semibold px-2 py-0.5 bg-primary/10 text-primary rounded-md cursor-pointer hover:bg-primary/20 transition-colors"
          onClick={() => { onClose(); navigate(`/channels/${post.channelId}`); }}
        >
          {post.channelImageUrl ? (
            <img src={post.channelImageUrl} alt={post.channelName} className="w-3.5 h-3.5 rounded-sm object-cover flex-shrink-0" />
          ) : (
            <span className="w-3.5 h-3.5 rounded-sm bg-primary/30 flex items-center justify-center flex-shrink-0 text-[8px] font-bold">
              {post.channelName.charAt(0).toUpperCase()}
            </span>
          )}
          {post.channelName}
        </span>
      </div>
    )}
    {/* 썸네일 이미지 */}
    {post.thumbnailUrl && (
      <div className="w-full rounded-2xl overflow-hidden border border-border mb-4">
        <img src={post.thumbnailUrl} alt="썸네일" className="w-full max-h-80 object-cover" />
      </div>
    )}
    <div className="flex items-start justify-between gap-4 my-4">
      <h1 className="text-2xl md:text-3xl font-extrabold text-foreground break-words flex-1">{post.title}</h1>
      {/* 첨부 링크 영역 */}
      {post.attachedUrls && Array.isArray(post.attachedUrls) && post.attachedUrls.length > 0 && post.attachedUrls[0].trim() !== '' && (
        <a
          href={post.attachedUrls[0].startsWith('http') ? post.attachedUrls[0] : `https://${post.attachedUrls[0]}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 px-3 py-2 bg-muted/50 rounded-lg border border-border/50 hover:bg-muted transition-colors shrink-0 mt-1"
        >
          <FiLink size={16} className="text-muted-foreground shrink-0" />
          <span className="text-sm text-primary font-medium whitespace-nowrap">첨부 링크</span>
        </a>
      )}
    </div>
    <div 
      className="text-foreground text-base md:text-lg leading-relaxed mb-6 [&>p]:mb-2 [&_img]:max-w-full [&_img]:h-auto [&_img]:rounded-md [&_img]:inline-block [&_img]:align-middle [&_img]:mx-1 [&_img[src*='flaticon']]:w-24 [&_img[src*='flaticon']]:h-24 [&_pre]:bg-[#f0f0f0] dark:[&_pre]:bg-surface [&_pre]:text-foreground [&_pre]:px-3 [&_pre]:py-2 [&_pre]:rounded-md [&_pre]:overflow-x-auto [&_pre]:font-mono [&_pre]:text-sm [&_pre]:my-4 [&_pre]:whitespace-pre [&_blockquote]:border-l-4 [&_blockquote]:border-gray-300 dark:[&_blockquote]:border-gray-600 [&_blockquote]:pl-4 [&_blockquote]:my-2 [&_blockquote]:text-muted-foreground"
      dangerouslySetInnerHTML={{ __html: post.body || '<p>내용 없음</p>' }}
    />
    <div className="flex flex-wrap gap-2">
      {post.tags && post.tags.map(tag => (
        <span key={tag} className="px-4 py-1.5 bg-background border border-border rounded-full text-sm text-muted-foreground font-medium">
          #{tag}
        </span>
      ))}
    </div>
  </div>
  );
};


// 3. 상호작용 버튼 영역 (Actions)
const ActionButtons = ({ post, onLike, onDislike, onBookmark, onShare, onCommentClick }: { post: Post, onLike: () => void, onDislike: () => void, onBookmark: () => void, onShare: () => void, onCommentClick?: () => void }) => {
  const buttonClass = "relative group flex items-center justify-center gap-1.5 px-3 h-10 bg-background border border-border rounded-full hover:bg-secondary text-muted-foreground transition-colors shrink-0";
  const iconOnlyClass = "relative group flex items-center justify-center w-10 h-10 bg-background border border-border rounded-full hover:bg-secondary text-muted-foreground transition-colors shrink-0";
  const isLiked = post.isLiked || post.liked;
  const isDisliked = post.isDisliked || post.disliked;
  const isBookmarked = post.isBookmarked || post.bookmarked;

  return (
    <div className="flex justify-between items-center mb-8 px-2">
      <div className="flex gap-2">
        <button onClick={onLike} className={`${buttonClass} ${isLiked ? 'text-rose-500 border-rose-500/20 bg-rose-500/10' : ''}`}>
          <FiHeart size={18} className={isLiked ? 'fill-current' : ''} />
          <span className="text-sm font-semibold">{post.likeCount || 0}</span>
          <span className="absolute -top-10 left-1/2 -translate-x-1/2 px-2.5 py-1 bg-foreground text-background text-[11px] font-semibold rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50 shadow-sm">좋아요</span>
        </button>
        <button onClick={onDislike} className={`${buttonClass} ${isDisliked ? 'text-purple-500 border-purple-500/20 bg-purple-500/10' : ''}`}>
          <FiThumbsDown size={18} className={isDisliked ? 'fill-current' : ''} />
          <span className="text-sm font-semibold">{post.dislikeCount || 0}</span>
          <span className="absolute -top-10 left-1/2 -translate-x-1/2 px-2.5 py-1 bg-foreground text-background text-[11px] font-semibold rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50 shadow-sm">비추천</span>
        </button>
        <button onClick={onCommentClick} className={buttonClass}>
          <FiMessageCircle size={18} />
          <span className="text-sm font-semibold">{post.commentCount || 0}</span>
          <span className="absolute -top-10 left-1/2 -translate-x-1/2 px-2.5 py-1 bg-foreground text-background text-[11px] font-semibold rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50 shadow-sm">댓글</span>
        </button>
        <div className="relative group flex items-center justify-center gap-1.5 px-3 h-10 text-muted-foreground shrink-0">
          <FiEye size={18} />
          <span className="text-sm font-semibold">{post.viewCount || 0}</span>
          <span className="absolute -top-10 left-1/2 -translate-x-1/2 px-2.5 py-1 bg-foreground text-background text-[11px] font-semibold rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50 shadow-sm">조회수</span>
        </div>
      </div>
      <div className="flex gap-2">
        <button onClick={onShare} className={iconOnlyClass}>
          <FiShare2 size={18} />
          <span className="absolute -top-10 left-1/2 -translate-x-1/2 px-2.5 py-1 bg-foreground text-background text-[11px] font-semibold rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50 shadow-sm">공유</span>
        </button>
        <button onClick={onBookmark} className={`relative group flex items-center justify-center w-10 h-10 bg-background border rounded-full hover:bg-secondary transition-colors shrink-0 ${isBookmarked ? 'text-amber-500 border-amber-500/20 bg-amber-500/10' : 'text-muted-foreground border-border'}`}>
          <FiBookmark size={18} className={isBookmarked ? 'fill-current' : ''} />
          <span className="absolute -top-10 left-1/2 -translate-x-1/2 px-2.5 py-1 bg-foreground text-background text-[11px] font-semibold rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50 shadow-sm">북마크</span>
        </button>
      </div>
    </div>
  );
};

export default CommunityPostDetail;