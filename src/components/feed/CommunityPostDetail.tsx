import React, { useState, useEffect, useRef } from 'react';
import { FiX, FiHeart, FiThumbsDown, FiMessageCircle, FiBookmark, FiShare2, FiEye, FiAlertTriangle, FiLink } from 'react-icons/fi';
import { Post } from './PostCard';
import CommentList from './CommentList';
import jwtAxios from '../../api/jwtAxios';
import { formatTimeAgo } from '../../utils/time';
import ReportModal from '../common/ReportModal';

interface CommunityPostDetailProps {
  post: Post;
  onClose: (updatedPost?: Post) => void;
  autoScrollToComment?: boolean;
}

const CommunityPostDetail: React.FC<CommunityPostDetailProps> = ({ post, onClose, autoScrollToComment = false }) => {
  const [localPost, setLocalPost] = useState<Post>(post);
  const [isLoadingDetails, setIsLoadingDetails] = useState(true); // 로딩 상태 추가
  const viewCountIncrementedRef = useRef<Set<number>>(new Set()); // useRef를 사용하여 특정 postId에 대한 조회수 증가 API가 호출되었는지 추적
  const commentSectionRef = useRef<HTMLDivElement>(null); // 스크롤 타겟용 Ref
  const backdropClickRef = useRef(false); // 배경 클릭 여부 추적용 Ref
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportTarget, setReportTarget] = useState<{ type: 'post' | 'comment' | 'user', id: number } | null>(null);

  const handleClose = () => {
    onClose(localPost);
  };

  // Escape 키를 눌렀을 때 모달 닫기
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        handleClose();
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => {
      window.removeEventListener('keydown', handleEscape);
    };
  }, [onClose, localPost]);

  // 모달이 열려있을 때 배경 스크롤 방지
  useEffect(() => {
    // 완벽한 스크롤 차단을 위해 body를 고정(fixed)하고 현재 스크롤 위치 유지
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
      // 원래 상태로 복구 및 스크롤 위치 되돌리기
      document.body.style.position = originalPosition;
      document.body.style.top = originalTop;
      document.body.style.width = originalWidth;
      document.body.style.overflow = originalOverflow;
      window.scrollTo(0, scrollY);
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
          setLocalPost(response.data); // 응답받은 최신 데이터로 상태를 업데이트합니다.
        } catch (error) {
          console.error("게시글 상세 정보 로딩 실패:", error);
          // 에러 발생 시 모달을 닫거나 사용자에게 알림
          // alert("게시글 상세 정보를 불러오는 데 실패했습니다.");
          onClose(post); // Pass the original post on error
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
        
        {/* 우측 상단 닫기 버튼 */}
        <button 
          onClick={handleClose}
          className="absolute top-5 right-5 p-2 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-full transition-colors"
          aria-label="닫기"
        >
          <FiX size={24} />
        </button>

        {/* 분리된 하위 컴포넌트 렌더링 */}
        <AuthorHeader post={localPost} onReport={() => openReportModal(localPost.contentType || 'post', localPost.postId)} />
        <PostContent post={localPost} />
        <ActionButtons 
          post={localPost} 
          onLike={handleLike}
          onDislike={handleDislike}
          onBookmark={handleBookmark}
          onShare={handleShare}
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
      </div>
    </div>
  );
};

// 1. 작성자 정보 영역 (Header)
const AuthorHeader = ({ post, onReport }: { post: Post, onReport: () => void }) => {
  const initial = post.authorNickname ? post.authorNickname.charAt(0).toUpperCase() : 'U';
  return (
    <div className="flex items-center gap-4 mb-6">
      <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg shrink-0 overflow-hidden">
        {post.authorProfileImageUrl ? (
          <img src={post.authorProfileImageUrl} alt="profile" className="w-full h-full object-cover" />
        ) : (
          initial
        )}
      </div>
      <div className="flex flex-col">
        <span className="font-bold text-foreground">{post.isAuthor ? post.authorNickname : (post.authorNickname || '익명')}</span>
        <span className="text-sm text-muted-foreground">@{post.authorUsername || 'unknown'}</span>
        <span className="text-xs text-muted-foreground mt-0.5">{formatTimeAgo(post.createdAt)}</span>
      </div>
      <div className="flex-grow" />
      {!post.isAuthor && (
        <button 
          onClick={onReport}
          className="p-2 text-muted-foreground hover:text-red-500 rounded-full hover:bg-red-500/10 transition-colors"
          aria-label="게시글 신고"
        >
          <FiAlertTriangle size={20} />
        </button>
      )}
    </div>
  );
};

// 2. 본문 영역 (Content)
const PostContent = ({ post }: { post: Post }) => (
  <div className="mb-6">
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
      className="text-foreground text-base md:text-lg leading-relaxed mb-6 [&>p]:mb-2 [&_img]:max-h-28 [&_img]:inline-block [&_img]:align-middle [&_img]:mx-1"
      dangerouslySetInnerHTML={{ __html: post.body || '' }}
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


// 3. 상호작용 버튼 영역 (Actions)
const ActionButtons = ({ post, onLike, onDislike, onBookmark, onShare }: { post: Post, onLike: () => void, onDislike: () => void, onBookmark: () => void, onShare: () => void }) => {
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
        <button className={buttonClass}>
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
        <button onClick={onBookmark} className={`${iconOnlyClass} ${isBookmarked ? 'text-amber-500 border-amber-500/20 bg-amber-500/10' : ''}`}>
          <FiBookmark size={18} className={isBookmarked ? 'fill-current' : ''} />
          <span className="absolute -top-10 left-1/2 -translate-x-1/2 px-2.5 py-1 bg-foreground text-background text-[11px] font-semibold rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50 shadow-sm">북마크</span>
        </button>
      </div>
    </div>
  );
};

export default CommunityPostDetail;