import React, { useState } from 'react';
import { FiMoreVertical, FiHeart, FiMessageCircle, FiShare2, FiEye, FiBookmark } from 'react-icons/fi';

export interface Post {
  postId: number;
  title: string;
  createdAt: string;
  tags: string[];
  
  authorProfileImageUrl?: string | null;
  authorNickname: string;
  authorUsername: string;
  channelName?: string | null;
  
  likeCount: number;
  viewCount: number;
  commentCount: number;
  shareCount: number;
  
  isLiked: boolean;
  liked?: boolean; // Jackson 직렬화 시 isLiked가 liked로 올 수 있음 대응
  isBookmarked: boolean;
  bookmarked?: boolean; 
  isAuthor: boolean;
  author?: boolean;
}

interface PostCardProps {
  post: Post;
  onLike?: (id: string) => void;
  onComment?: (id: string) => void;
  onShare?: (id: string) => void;
  onBookmark?: (id: string) => void;
}

const PostCard: React.FC<PostCardProps> = ({ post, onLike, onComment, onShare, onBookmark }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // 안전한 렌더링을 위한 기본값 및 필드 매핑
  const authorNickname = post.authorNickname || '익명';
  const authorUsername = post.authorUsername || 'unknown';
  const tags = post.tags || [];
  
  const isMyPost = post.isAuthor || post.author === true;
  const isLiked = post.isLiked || post.liked === true;
  const isBookmarked = post.isBookmarked || post.bookmarked === true;

  return (
    <article className="bg-card bg-white dark:bg-slate-900 border border-border border-gray-200 dark:border-gray-800 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col gap-4">
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
              <span className="font-bold text-gray-900 dark:text-white">{authorNickname}</span>
              <span className="text-sm text-gray-500">@{authorUsername}</span>
              {post.channelName && (
                <span className="text-xs font-semibold px-2 py-0.5 bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400 rounded-md">
                  {post.channelName}
                </span>
              )}
            </div>
            {/* 작성일자 (백엔드에서 포맷팅 된 문자열을 그대로 사용) */}
            {post.createdAt && <span className="text-xs text-gray-400 mt-0.5">{post.createdAt}</span>}
          </div>
        </div>

        {/* 우측 상단 옵션 (isAuthor가 true일 때만 렌더링) */}
        {isMyPost && (
          <div className="relative">
            <button onClick={() => setIsDropdownOpen(!isDropdownOpen)} className="p-2 text-gray-400 hover:text-gray-700 rounded-full hover:bg-gray-100 transition-colors">
              <FiMoreVertical size={20} />
            </button>
            {isDropdownOpen && (
              <div className="absolute right-0 mt-1 w-24 bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-700 shadow-lg rounded-xl overflow-hidden z-10">
                <button className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors">수정</button>
                <button className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">삭제</button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 본문 영역: 오직 제목만 굵게 표시 */}
      <h2 className="text-xl font-extrabold text-gray-900 dark:text-white leading-snug">{post.title}</h2>

      {/* 태그 영역 */}
      <div className="flex flex-wrap gap-2 mt-1">
        {tags.map((tag, idx) => (
          <span key={idx} className="px-3 py-1 bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-300 text-xs font-medium rounded-full cursor-pointer hover:bg-gray-200 transition-colors">
            #{tag}
          </span>
        ))}
      </div>

      {/* 하단 액션 바 */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-800 mt-2 text-gray-500">
        <div className="flex gap-6">
          <button onClick={() => onLike?.(String(post.postId))} className={`flex items-center gap-1.5 hover:text-rose-500 transition-colors ${isLiked ? 'text-rose-500' : ''}`}>
            <FiHeart size={18} className={isLiked ? 'fill-current' : ''} /> <span className="text-sm font-medium">{post.likeCount}</span>
          </button>
          <button onClick={() => onComment?.(String(post.postId))} className="flex items-center gap-1.5 hover:text-blue-500 transition-colors">
            <FiMessageCircle size={18} /> <span className="text-sm font-medium">{post.commentCount}</span>
          </button>
          <button onClick={() => onShare?.(String(post.postId))} className="flex items-center gap-1.5 hover:text-green-500 transition-colors">
            <FiShare2 size={18} /> <span className="text-sm font-medium">{post.shareCount}</span>
          </button>
          <div className="flex items-center gap-1.5">
            <FiEye size={18} /> <span className="text-sm font-medium">{post.viewCount}</span>
          </div>
        </div>
        <button onClick={() => onBookmark?.(String(post.postId))} className={`hover:text-amber-500 transition-colors ${isBookmarked ? 'text-amber-500' : ''}`}>
          <FiBookmark size={20} className={isBookmarked ? 'fill-current' : ''} />
        </button>
      </div>
    </article>
  );
};

export default PostCard;