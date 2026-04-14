import React, { useState, useEffect, useRef } from 'react';
import { FiMoreVertical, FiHeart, FiThumbsDown, FiMessageCircle, FiShare2, FiEye, FiBookmark } from 'react-icons/fi';
import jwtAxios from '../../api/jwtAxios';
import { formatTimeAgo } from '../../utils/time';

export interface Post {
  postId: number;
  title: string;
  body?: string; // 수정을 위해 body 필드 추가
  createdAt: string;
  tags: string[];
  
  authorProfileImageUrl?: string | null;
  authorNickname: string;
  authorUsername: string;
  channelName?: string | null;
  
  likeCount: number;
  dislikeCount: number;
  viewCount: number;
  commentCount: number;
  shareCount: number;
  
  isLiked: boolean;
  liked?: boolean; // Jackson 직렬화 시 isLiked가 liked로 올 수 있음 대응
  isDisliked: boolean;
  disliked?: boolean;
  isBookmarked: boolean;
  bookmarked?: boolean; 
  isAuthor: boolean;
  author?: boolean;
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
  onDetailClick?: () => void;
}

const PostCard: React.FC<PostCardProps> = ({ post, onLike, onComment, onShare, onBookmark, onEdit, onDelete, onDetailClick }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [localPost, setLocalPost] = useState<Post>(post);
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

  // 공유 (클립보드 복사)
  const handleShareClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const url = `${window.location.origin}${window.location.pathname}?postId=${localPost.postId}`;
    try {
      await navigator.clipboard.writeText(url);
      alert('클립보드에 복사되었습니다.');
    } catch (err) {
      alert('복사에 실패했습니다.');
    }
  };

  return (
    <article className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col gap-4">
      {/* 메인 컨텐츠 영역 (클릭 시 상세 모달 열림) */}
      <div onClick={onDetailClick} className="cursor-pointer flex flex-col gap-4">
        {/* 상단: 프로필 및 정보 영역 */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            {/* 원형 프로필 이미지 */}
            <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
              {post.authorProfileImageUrl ? (
                <img src={post.authorProfileImageUrl} alt="profile" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-blue-100 flex items-center justify-center text-blue-500 font-bold">
                  {authorNickname.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="font-bold text-gray-900">{authorNickname}</span>
                <span className="text-sm text-gray-500">@{authorUsername}</span>
                {post.channelName && (
                  <span className="text-xs font-semibold px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-md">
                    {post.channelName}
                  </span>
                )}
              </div>
              {/* 작성일자 (백엔드에서 포맷팅 된 문자열을 그대로 사용) */}
              {localPost.createdAt && <span className="text-xs text-gray-400 mt-0.5">{formatTimeAgo(localPost.createdAt)}</span>}
            </div>
          </div>

          {/* 우측 상단 옵션 (isAuthor가 true일 때만 렌더링) */}
          {isMyPost && (
            <div className="relative" ref={dropdownRef}>
              <button onClick={(e) => { e.stopPropagation(); setIsDropdownOpen(!isDropdownOpen); }} className="p-2 text-gray-400 hover:text-gray-700 rounded-full hover:bg-gray-100 transition-colors">
                <FiMoreVertical size={20} />
              </button>
              {isDropdownOpen && (
                <div className="absolute right-0 mt-1 w-24 bg-white border border-gray-200 shadow-lg rounded-xl overflow-hidden z-10">
                  <button onClick={(e) => { e.stopPropagation(); onEdit?.(post); setIsDropdownOpen(false); }} className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors">수정</button>
                  <button onClick={(e) => { e.stopPropagation(); onDelete?.(post.postId); setIsDropdownOpen(false); }} className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-50 transition-colors">삭제</button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 본문 영역: 오직 제목만 굵게 표시 */}
        <h2 className="text-xl font-extrabold text-gray-900 leading-snug">{post.title}</h2>

        {/* 태그 영역 */}
        <div className="flex flex-wrap gap-2 mt-1">
          {tags.map((tag, idx) => (
            <span key={idx} className="px-3 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-full cursor-pointer hover:bg-gray-200 transition-colors">
              #{tag}
            </span>
          ))}
        </div>
      </div> {/* 메인 컨텐츠 영역 끝 */}

      {/* 하단 액션 바 */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-100 mt-2 text-gray-500">
        <div className="flex gap-4">
          <button onClick={handleLikeClick} className={`relative group flex items-center gap-1.5 p-1.5 rounded-full hover:bg-gray-50 hover:text-rose-500 transition-colors ${isLiked ? 'text-rose-500' : ''}`}>
            <FiHeart size={20} className={isLiked ? 'fill-current' : ''} />
            <span className="text-sm font-medium">{localPost.likeCount || 0}</span>
            <span className="absolute -top-8 left-1/2 -translate-x-1/2 px-2.5 py-1 bg-gray-800 text-white text-[11px] font-semibold rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50 shadow-sm">좋아요</span>
          </button>
          <button onClick={handleDislikeClick} className={`relative group flex items-center gap-1.5 p-1.5 rounded-full hover:bg-gray-50 hover:text-purple-500 transition-colors ${isDisliked ? 'text-purple-500' : ''}`}>
            <FiThumbsDown size={20} className={isDisliked ? 'fill-current' : ''} />
            <span className="text-sm font-medium">{localPost.dislikeCount || 0}</span>
            <span className="absolute -top-8 left-1/2 -translate-x-1/2 px-2.5 py-1 bg-gray-800 text-white text-[11px] font-semibold rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50 shadow-sm">비추천</span>
          </button>
          <button onClick={(e) => { e.stopPropagation(); onComment?.(String(localPost.postId)); }} className="relative group flex items-center gap-1.5 p-1.5 rounded-full hover:bg-gray-50 hover:text-blue-500 transition-colors">
            <FiMessageCircle size={20} />
            <span className="text-sm font-medium">{localPost.commentCount || 0}</span>
            <span className="absolute -top-8 left-1/2 -translate-x-1/2 px-2.5 py-1 bg-gray-800 text-white text-[11px] font-semibold rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50 shadow-sm">댓글</span>
          </button>
          <div className="relative group flex items-center gap-1.5 p-1.5 text-gray-400">
            <FiEye size={20} />
            <span className="text-sm font-medium">{localPost.viewCount || 0}</span>
            <span className="absolute -top-8 left-1/2 -translate-x-1/2 px-2.5 py-1 bg-gray-800 text-white text-[11px] font-semibold rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50 shadow-sm">조회수</span>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={handleShareClick} className="relative group p-1.5 rounded-full hover:bg-gray-50 hover:text-green-500 transition-colors">
            <FiShare2 size={20} />
            <span className="absolute -top-8 left-1/2 -translate-x-1/2 px-2.5 py-1 bg-gray-800 text-white text-[11px] font-semibold rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50 shadow-sm">공유</span>
          </button>
          <button onClick={handleBookmarkClick} className={`relative group p-1.5 rounded-full hover:bg-gray-50 hover:text-amber-500 transition-colors ${isBookmarked ? 'text-amber-500' : ''}`}>
            <FiBookmark size={20} className={isBookmarked ? 'fill-current' : ''} />
            <span className="absolute -top-8 left-1/2 -translate-x-1/2 px-2.5 py-1 bg-gray-800 text-white text-[11px] font-semibold rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50 shadow-sm">북마크</span>
          </button>
        </div>
      </div>
    </article>
  );
};

export default PostCard;