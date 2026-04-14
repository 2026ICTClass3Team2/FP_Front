import React, { useState, useEffect, useRef } from 'react';
import { FiX, FiHeart, FiThumbsDown, FiMessageCircle, FiBookmark, FiShare2 } from 'react-icons/fi';
import { Post } from './PostCard';
import CommentList from './CommentList';
import jwtAxios from '../../api/jwtAxios';
import { formatTimeAgo } from '../../utils/time';

interface CommunityPostDetailProps {
  post: Post;
  onClose: (updatedPost?: Post) => void;
}

const CommunityPostDetail: React.FC<CommunityPostDetailProps> = ({ post, onClose }) => {
  const [localPost, setLocalPost] = useState<Post>(post);
  const [isLoadingDetails, setIsLoadingDetails] = useState(true); // 로딩 상태 추가
  const viewCountIncrementedRef = useRef<Set<number>>(new Set()); // useRef를 사용하여 특정 postId에 대한 조회수 증가 API가 호출되었는지 추적

  // Escape 키를 눌렀을 때 모달 닫기
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose(localPost); // Pass the local (updated) post state
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => {
      window.removeEventListener('keydown', handleEscape);
    };
  }, [onClose, localPost]); // localPost가 변경될 때마다 최신 값을 참조하도록 의존성 배열에 추가

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
          alert("게시글 상세 정보를 불러오는 데 실패했습니다.");
          onClose(post); // Pass the original post on error
        } finally {
          setIsLoadingDetails(false); // 로딩 종료
          // 해당 postId에 대한 조회수 증가 API 호출 완료를 기록
          viewCountIncrementedRef.current.add(post.postId);
        }
      };
      fetchDetailsAndUpdateViewCount();
    }
    // 클린업 함수: 컴포넌트 언마운트 또는 postId 변경 시 해당 postId 기록 삭제
    return () => {
      if (post?.postId) viewCountIncrementedRef.current.delete(post.postId);
    };
  }, [post?.postId, onClose]); // post.postId가 변경될 때만 실행, onClose도 의존성에 추가

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={() => onClose(localPost)}>
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl p-6 md:p-8 max-h-[90vh] overflow-y-auto
       [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]" onClick={(e) => e.stopPropagation()}>
        
        {/* 우측 상단 닫기 버튼 */}
        <button 
          onClick={() => onClose(localPost)}
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
        <span className="text-xs text-gray-400 mt-0.5">{formatTimeAgo(post.createdAt)}</span>
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