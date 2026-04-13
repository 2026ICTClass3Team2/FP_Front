import React, { useState, useEffect } from 'react';
import { FiX, FiHeart, FiThumbsDown, FiMessageCircle, FiBookmark, FiShare2 } from 'react-icons/fi';
import { Post } from './PostCard';
import CommentList from './CommentList';
import jwtAxios from '../../api/jwtAxios';

interface CommunityPostDetailProps {
  post: Post;
  onClose: () => void;
}

const CommunityPostDetail: React.FC<CommunityPostDetailProps> = ({ post, onClose }) => {
  const [localPost, setLocalPost] = useState<Post>(post);

  useEffect(() => {
    setLocalPost(post);
  }, [post]);

  // 낙관적 업데이트 - 좋아요
  const handleLike = async () => {
    const originalLiked = localPost.isLiked || localPost.liked;
    const originalCount = localPost.likeCount;
    
    setLocalPost(prev => ({
      ...prev,
      isLiked: !originalLiked,
      liked: !originalLiked,
      likeCount: originalLiked ? prev.likeCount - 1 : prev.likeCount + 1,
    }));

    try {
      await jwtAxios.post(`posts/${localPost.postId}/like`);
    } catch (error) {
      setLocalPost(prev => ({ ...prev, isLiked: originalLiked, liked: originalLiked, likeCount: originalCount }));
      alert('요청에 실패했습니다.');
    }
  };

  // 낙관적 업데이트 - 비추천
  const handleDislike = async () => {
    const originalDisliked = localPost.isDisliked || localPost.disliked;
    const originalCount = localPost.dislikeCount;
    
    setLocalPost(prev => ({
      ...prev,
      isDisliked: !originalDisliked,
      disliked: !originalDisliked,
      dislikeCount: originalDisliked ? prev.dislikeCount - 1 : prev.dislikeCount + 1,
    }));

    try {
      await jwtAxios.post(`posts/${localPost.postId}/dislike`);
    } catch (error) {
      setLocalPost(prev => ({ ...prev, isDisliked: originalDisliked, disliked: originalDisliked, dislikeCount: originalCount }));
      alert('요청에 실패했습니다.');
    }
  };

  // 낙관적 업데이트 - 북마크
  const handleBookmark = async () => {
    const originalBookmarked = localPost.isBookmarked || localPost.bookmarked;
    
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
    const url = `${window.location.origin}/posts/${localPost.postId}`;
    try {
      await navigator.clipboard.writeText(url);
      alert('클립보드에 복사되었습니다.');
    } catch (err) {
      alert('복사에 실패했습니다.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl p-6 md:p-8 max-h-[90vh] overflow-y-auto custom-scrollbar" onClick={(e) => e.stopPropagation()}>
        
        {/* 우측 상단 닫기 버튼 */}
        <button 
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-gray-400 hover:text-gray-800 hover:bg-gray-100 rounded-full transition-colors"
          aria-label="닫기"
        >
          <FiX size={24} />
        </button>

        {/* 분리된 하위 컴포넌트 렌더링 */}
        <AuthorHeader post={localPost} />
        <PostContent post={localPost} />
        <ActionButtons 
          post={localPost} 
          onLike={handleLike}
          onDislike={handleDislike}
          onBookmark={handleBookmark}
          onShare={handleShare}
        />
        
        {/* 실제 동작하는 댓글 리스트 컴포넌트 연결 */}
        <div className="pt-4 border-t border-gray-200">
          <CommentList postId={localPost.postId} />
        </div>
        
      </div>
    </div>
  );
};

// 1. 작성자 정보 영역 (Header)
const AuthorHeader = ({ post }: { post: Post }) => {
  const initial = post.authorNickname ? post.authorNickname.charAt(0).toUpperCase() : 'U';
  return (
    <div className="flex items-center gap-4 mb-6">
      <div className="w-12 h-12 rounded-full bg-slate-800 text-white flex items-center justify-center font-bold text-lg shrink-0 overflow-hidden">
        {post.authorProfileImageUrl ? (
          <img src={post.authorProfileImageUrl} alt="profile" className="w-full h-full object-cover" />
        ) : (
          initial
        )}
      </div>
      <div className="flex flex-col">
        <span className="font-bold text-gray-900">{post.authorNickname || '익명'}</span>
        <span className="text-sm text-gray-400">@{post.authorUsername || 'unknown'}</span>
        <span className="text-xs text-gray-400 mt-0.5">{post.createdAt}</span>
      </div>
    </div>
  );
};

// 2. 본문 영역 (Content)
const PostContent = ({ post }: { post: Post }) => (
  <div className="mb-6">
    <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 my-4">{post.title}</h1>
    <p className="text-gray-800 text-base md:text-lg whitespace-pre-wrap leading-relaxed mb-6">
      {post.body}
    </p>
    <div className="flex flex-wrap gap-2">
      {post.tags && post.tags.map(tag => (
        <span key={tag} className="px-4 py-1.5 bg-white border border-gray-200 rounded-full text-sm text-gray-600 font-medium">
          #{tag}
        </span>
      ))}
    </div>
  </div>
);

// 3. 상호작용 버튼 영역 (Actions)
const ActionButtons = ({ post, onLike, onDislike, onBookmark, onShare }: { post: Post, onLike: () => void, onDislike: () => void, onBookmark: () => void, onShare: () => void }) => {
  const buttonClass = "flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 text-sm font-semibold text-gray-700 transition-colors shrink-0";
  const isLiked = post.isLiked || post.liked;
  const isDisliked = post.isDisliked || post.disliked;
  const isBookmarked = post.isBookmarked || post.bookmarked;

  return (
    <div className="flex flex-col gap-3 mb-8">
      <div className="flex flex-wrap gap-3">
        <button onClick={onLike} className={`${buttonClass} ${isLiked ? 'text-rose-500 border-rose-200 bg-rose-50' : ''}`}>
          <FiHeart size={18} className={isLiked ? 'fill-current' : ''} /> 좋아요 {post.likeCount}
        </button>
        <button onClick={onDislike} className={`${buttonClass} ${isDisliked ? 'text-purple-500 border-purple-200 bg-purple-50' : ''}`}>
          <FiThumbsDown size={18} className={isDisliked ? 'fill-current' : ''} /> 비추천 {post.dislikeCount}
        </button>
        <button className={buttonClass}><FiMessageCircle size={18} /> 댓글 {post.commentCount}</button>
        <button onClick={onBookmark} className={`${buttonClass} ${isBookmarked ? 'text-amber-500 border-amber-200 bg-amber-50' : ''}`}>
          <FiBookmark size={18} className={isBookmarked ? 'fill-current' : ''} /> 북마크
        </button>
      </div>
      <div className="flex">
        <button onClick={onShare} className={buttonClass}><FiShare2 size={18} /> 공유</button>
      </div>
    </div>
  );
};

export default CommunityPostDetail;