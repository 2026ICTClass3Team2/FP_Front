import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiMoreVertical, FiHeart, FiThumbsDown, FiMessageCircle, FiShare2, FiEye, FiBookmark, FiAlertTriangle, FiLink } from 'react-icons/fi';
import jwtAxios from '../../api/jwtAxios';
import { formatTimeAgo } from '../../utils/time';
import ReportModal from '../common/ReportModal';
import UserProfileModal from '../common/UserProfileModal';

export interface Post {
  postId: number;
  title: string;
  body?: string; // 수정을 위해 body 필드 추가
  createdAt: string;
  contentType?: string;
  tags: string[];
  
  authorUserId?: number | null;
  authorProfileImageUrl?: string | null;
  authorNickname: string;
  authorUsername: string;
  channelId?: number | null;
  channelName?: string | null;
  channelImageUrl?: string | null;
  
  likeCount: number;
  dislikeCount: number;
  viewCount: number;
  commentCount: number;
  bookmarkCount: number;
  shareCount: number;
  
  isLiked: boolean;
  liked?: boolean;
  isDisliked: boolean;
  disliked?: boolean;
  isBookmarked: boolean;
  bookmarked?: boolean; 
  isAuthor: boolean;
  author?: boolean; 
  attachedUrls?: string[];
  thumbnailUrl?: string;
}

interface PostCardProps {
  post: Post;
  onLike?: (id: string) => void;
  onComment?: (id: string) => void;
  onShare?: (id: string) => void;
  onBookmark?: (id: string) => void;
  onEdit?: (post: Post) => void;
  onDelete?: (postId: number) => void;
  onNotInterested?: (postId: number) => void;
  onDetailClick?: () => void;
  onReportSuccess?: (reportData: any) => void;
}

const PostCard: React.FC<PostCardProps> = ({ post, onLike, onComment, onShare, onBookmark, onEdit, onDelete, onNotInterested, onDetailClick, onReportSuccess }) => {
  const navigate = useNavigate();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [localPost, setLocalPost] = useState<Post>(post);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [profileModalUserId, setProfileModalUserId] = useState<number | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 부모 컴포넌트의 데이터가 변경되면 동기화
  useEffect(() => {
    setLocalPost(post);
  }, [post]);

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

  // 안전한 렌더링을 위한 기본값 및 필드 매핑
  const authorNickname = localPost.authorNickname || '익명';
  const authorUsername = localPost.authorUsername || 'unknown';
  const tags = localPost.tags || [];
  
  const isMyPost = localPost.isAuthor || localPost.author === true;
  const isLiked = localPost.isLiked || localPost.liked === true;
  const isDisliked = localPost.isDisliked || localPost.disliked === true;
  const isBookmarked = localPost.isBookmarked || localPost.bookmarked === true;

  // 낙관적 업데이트 - 좋아요
  const handleLikeClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
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
  const handleDislikeClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
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
  const handleBookmarkClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const originalBookmarked = isBookmarked;
    
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

  // 공유 (클립보드 복사 + 알고리즘 추적)
  const handleShareClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const url = `${window.location.origin}${window.location.pathname}?postId=${localPost.postId}`;
    try {
      await navigator.clipboard.writeText(url);
      alert('클립보드에 복사되었습니다.');
      // 알고리즘 관심도 반영 (실패해도 UX 영향 없음)
      jwtAxios.post(`posts/${localPost.postId}/share`).catch(() => {});
    } catch (err) {
      alert('복사에 실패했습니다.');
    }
  };

  // 관심없음
  const handleNotInterested = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDropdownOpen(false);
    try {
      await jwtAxios.post(`posts/${localPost.postId}/not-interested`);
      onNotInterested?.(localPost.postId);
    } catch (err: any) {
      alert(err.response?.data?.message || '요청에 실패했습니다.');
    }
  };

  return (
    <article className="bg-surface border border-border rounded-2xl p-5 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all flex flex-col gap-4 cursor-pointer">
      {/* 메인 컨텐츠 영역 (클릭 시 상세 모달 열림) */}
      <div onClick={onDetailClick} className="cursor-pointer flex flex-col gap-4">
        {/* 상단: 프로필 및 정보 영역 */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            {/* 원형 프로필 이미지 */}
            <div
              className="w-10 h-10 rounded-full bg-muted overflow-hidden flex-shrink-0 cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all"
              onClick={(e) => { e.stopPropagation(); if (post.authorUserId) setProfileModalUserId(post.authorUserId); }}
            >
              {post.authorProfileImageUrl ? (
                <img src={post.authorProfileImageUrl} alt="profile" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                  {authorNickname.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span
                  className="font-bold text-foreground cursor-pointer hover:underline"
                  onClick={(e) => { e.stopPropagation(); if (post.authorUserId) setProfileModalUserId(post.authorUserId); }}
                >{authorNickname}</span>
                <span className="text-sm text-muted-foreground">@{authorUsername}</span>
                {post.channelName && post.channelId && (
                  <span
                    className="flex items-center gap-1 text-xs font-semibold px-2 py-0.5 bg-primary/10 text-primary rounded-md cursor-pointer hover:bg-primary/20 transition-colors"
                    onClick={(e) => { e.stopPropagation(); navigate(`/channels/${post.channelId}`); }}
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
                )}
              </div>
              {/* 작성일자 (백엔드에서 포맷팅 된 문자열을 그대로 사용) */}
              {localPost.createdAt && <span className="text-xs text-muted-foreground mt-0.5">{formatTimeAgo(localPost.createdAt)}</span>}
            </div>
          </div>

          {/* 우측 상단 옵션 */}
          <div className="relative" ref={dropdownRef}>
            <button onClick={(e) => { e.stopPropagation(); setIsDropdownOpen(!isDropdownOpen); }} className="p-2 text-muted-foreground hover:text-foreground rounded-full hover:bg-secondary transition-colors">
              <FiMoreVertical size={20} />
            </button>
            {isDropdownOpen && (
              <div className="absolute right-0 mt-1 w-28 bg-surface border border-border shadow-lg rounded-xl overflow-hidden z-10">
                {isMyPost ? (<>
                  <button onClick={(e) => { e.stopPropagation(); onEdit?.(post); setIsDropdownOpen(false); }} className="w-full text-left px-4 py-2 text-sm text-foreground hover:bg-secondary transition-colors">수정</button>
                  <button onClick={(e) => { e.stopPropagation(); onDelete?.(post.postId); setIsDropdownOpen(false); }} className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-500/10 transition-colors">삭제</button>
                </>) : (<>
                  <button onClick={handleNotInterested} className="w-full text-left px-4 py-2 text-sm text-muted-foreground hover:bg-secondary transition-colors">관심없음</button>
                  <button onClick={(e) => { e.stopPropagation(); setIsReportModalOpen(true); setIsDropdownOpen(false); }} className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-500/10 transition-colors flex items-center gap-2"><FiAlertTriangle size={14} /> 신고</button>
                </>)}
              </div>
            )}
          </div>
        </div>

        {/* 본문 영역: 제목과 우측 첨부 링크 */}
        <div className="flex items-start justify-between gap-4">
          <h2 className="text-xl font-extrabold text-foreground leading-snug break-words flex-1">{post.title}</h2>
          
          {/* 첨부 링크 영역 */}
          {localPost.attachedUrls && Array.isArray(localPost.attachedUrls) && localPost.attachedUrls.length > 0 && localPost.attachedUrls[0].trim() !== '' && (
            <a
              href={localPost.attachedUrls[0].startsWith('http') ? localPost.attachedUrls[0] : `https://${localPost.attachedUrls[0]}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-muted/50 rounded-lg border border-border/50 hover:bg-muted transition-colors shrink-0 mt-0.5"
            >
              <FiLink size={14} className="text-muted-foreground shrink-0" />
              <span className="text-xs text-primary font-medium whitespace-nowrap">첨부 링크</span>
            </a>
          )}
        </div>

        {/* 썸네일 이미지 */}
        {localPost.thumbnailUrl && (
          <div className="w-full rounded-xl overflow-hidden border border-border">
            <img src={localPost.thumbnailUrl} alt="썸네일" className="w-full max-h-60 object-cover" />
          </div>
        )}

        {/* 태그 영역 */}
        <div className="flex flex-wrap gap-2 mt-1">
          {tags.map((tag, idx) => (
            <span key={idx} className="px-3 py-1 bg-muted text-foreground text-xs font-medium rounded-full cursor-pointer hover:bg-foreground/20 transition-colors">
              #{tag}
            </span>
          ))}
        </div>
      </div> {/* 메인 컨텐츠 영역 끝 */}

      {/* 하단 액션 바 */}
      <div className="flex items-center justify-between pt-4 border-t border-border mt-2 text-muted-foreground">
        <div className="flex gap-4">
          <button onClick={handleLikeClick} className={`relative group flex items-center gap-1.5 p-1.5 rounded-full hover:bg-secondary hover:text-rose-500 transition-colors ${isLiked ? 'text-rose-500' : ''}`}>
            <FiHeart size={20} className={isLiked ? 'fill-current' : ''} />
            <span className="text-sm font-medium">{localPost.likeCount || 0}</span>
            <span className="absolute -top-8 left-1/2 -translate-x-1/2 px-2.5 py-1 bg-foreground text-background text-[11px] font-semibold rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50 shadow-sm">좋아요</span>
          </button>
          <button onClick={handleDislikeClick} className={`relative group flex items-center gap-1.5 p-1.5 rounded-full hover:bg-secondary hover:text-purple-500 transition-colors ${isDisliked ? 'text-purple-500' : ''}`}>
            <FiThumbsDown size={20} className={isDisliked ? 'fill-current' : ''} />
            <span className="text-sm font-medium">{localPost.dislikeCount || 0}</span>
            <span className="absolute -top-8 left-1/2 -translate-x-1/2 px-2.5 py-1 bg-foreground text-background text-[11px] font-semibold rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50 shadow-sm">비추천</span>
          </button>
          <button onClick={(e) => { e.stopPropagation(); onComment?.(String(localPost.postId)); }} className="relative group flex items-center gap-1.5 p-1.5 rounded-full hover:bg-secondary hover:text-blue-500 transition-colors">
            <FiMessageCircle size={20} />
            <span className="text-sm font-medium">{localPost.commentCount || 0}</span>
            <span className="absolute -top-8 left-1/2 -translate-x-1/2 px-2.5 py-1 bg-foreground text-background text-[11px] font-semibold rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50 shadow-sm">댓글</span>
          </button>
          <div className="relative group flex items-center gap-1.5 p-1.5 text-muted-foreground">
            <FiEye size={20} />
            <span className="text-sm font-medium">{localPost.viewCount || 0}</span>
            <span className="absolute -top-8 left-1/2 -translate-x-1/2 px-2.5 py-1 bg-foreground text-background text-[11px] font-semibold rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50 shadow-sm">조회수</span>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={handleShareClick} className="relative group p-1.5 rounded-full hover:bg-secondary hover:text-green-500 transition-colors">
            <FiShare2 size={20} />
            <span className="absolute -top-8 left-1/2 -translate-x-1/2 px-2.5 py-1 bg-foreground text-background text-[11px] font-semibold rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50 shadow-sm">공유</span>
          </button>
          <button onClick={handleBookmarkClick} className={`relative group p-1.5 rounded-full hover:bg-secondary hover:text-amber-500 transition-colors ${isBookmarked ? 'text-amber-500' : ''}`}>
            <FiBookmark size={20} className={isBookmarked ? 'fill-current' : ''} />
            <span className="absolute -top-8 left-1/2 -translate-x-1/2 px-2.5 py-1 bg-foreground text-background text-[11px] font-semibold rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50 shadow-sm">북마크</span>
          </button>
        </div>
      </div>

      <ReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        targetType="post"
        targetId={localPost.postId}
        onSuccess={(reportData: any) => {
          onReportSuccess?.(reportData);
        }}
      />

      <UserProfileModal
        isOpen={profileModalUserId !== null}
        onClose={() => setProfileModalUserId(null)}
        userId={profileModalUserId}
      />
    </article>
  );
};

export default PostCard;