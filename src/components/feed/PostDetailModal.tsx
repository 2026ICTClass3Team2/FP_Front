import React, { useEffect } from 'react';
import { FiX, FiMoreHorizontal, FiHeart, FiMessageCircle, FiShare2, FiBookmark } from 'react-icons/fi';
import CommentList from './CommentList';
import { Post } from './PostCard'; // FeedList에서 사용하는 Post 타입 임포트

interface PostDetailModalProps {
  post: Post | null;
  isOpen: boolean;
  onClose: () => void;
}

const PostDetailModal: React.FC<PostDetailModalProps> = ({ post, isOpen, onClose }) => {
  // 모달이 열려있을 때 배경 스크롤 방지
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen || !post) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity"
      onClick={onClose}
    >
      {/* 모달 컨테이너 (SNS 스타일: 좌측 미디어, 우측 텍스트/댓글) */}
      <div 
        className="relative w-full max-w-5xl max-h-[90vh] h-[800px] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row"
        onClick={(e) => e.stopPropagation()} // 내부 클릭 시 모달 안 닫히게 방지
      >
        {/* 닫기 버튼 (모바일에서는 안쪽에, 데스크탑에서는 우측 상단에 배치) */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2 bg-black/10 hover:bg-black/20 dark:bg-white/10 dark:hover:bg-white/20 rounded-full text-gray-800 dark:text-white transition-colors backdrop-blur-md"
        >
          <FiX size={24} />
        </button>

        {/* 좌측 영역: 미디어(이미지/비디오) 표시 */}
        <div className="w-full md:w-3/5 bg-gray-100 dark:bg-black flex items-center justify-center min-h-[300px] md:min-h-full border-b md:border-b-0 md:border-r border-gray-200 dark:border-gray-800">
          {post.thumbnailUrl ? (
            <img src={post.thumbnailUrl} alt={post.title} className="w-full h-full object-contain" />
          ) : (
            <div className="text-gray-400 dark:text-gray-600 flex flex-col items-center gap-3">
               <span className="text-5xl">📷</span>
               <p className="text-sm font-medium">첨부된 이미지가 없습니다.</p>
            </div>
          )}
        </div>

        {/* 우측 영역: 작성자 정보, 본문, 그리고 댓글 리스트 */}
        <div className="w-full md:w-2/5 flex flex-col h-full bg-white dark:bg-slate-900 border-l border-gray-100 dark:border-gray-800">
          
          {/* 1. 상단 고정 헤더: 작성자 정보 */}
          <div className="h-16 px-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-yellow-400 to-fuchsia-600 p-[2px]">
                <div className="w-full h-full rounded-full border-2 border-white dark:border-slate-900 bg-gray-200 overflow-hidden flex items-center justify-center text-gray-500 font-bold text-xs">
                  {post.authorNickname ? post.authorNickname.charAt(0).toUpperCase() : 'U'}
                </div>
              </div>
              <h3 className="font-bold text-sm text-gray-900 dark:text-white">{post.authorNickname || '익명 사용자'}</h3>
            </div>
            <button className="text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors">
              <FiMoreHorizontal size={20} />
            </button>
          </div>

          {/* 2. 중앙 스크롤 영역: 본문 및 댓글 */}
          <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
            {/* 게시글 본문 (작성자 프로필과 함께 표시) */}
            <div className="flex items-start gap-3 mb-4">
              <div className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden shrink-0 mt-1 flex items-center justify-center text-gray-500 font-bold text-xs">
                {post.authorNickname ? post.authorNickname.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className="flex flex-col">
                <h2 className="font-bold text-sm text-gray-900 dark:text-white">{post.title}</h2>
                <div className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap leading-relaxed mt-1">
                  {post.body}
                </div>
              </div>
            </div>

            {/* 앞서 작성된 댓글 컴포넌트 마운트 */}
            <CommentList postId={post.postId} />
          </div>

          {/* 3. 하단 고정 액션 바: 좋아요, 댓글, 공유 등 */}
          <div className="p-4 border-t border-gray-100 dark:border-gray-800 shrink-0 bg-white dark:bg-slate-900">
            <div className="flex justify-between items-center mb-3 text-gray-800 dark:text-white">
              <div className="flex items-center gap-4">
                <button className="hover:text-gray-500 transition-colors">
                  <FiHeart size={24} className={post.isLiked || post.liked ? 'fill-rose-500 text-rose-500' : ''} />
                </button>
                <button className="hover:text-gray-500 transition-colors"><FiMessageCircle size={24} /></button>
                <button className="hover:text-gray-500 transition-colors"><FiShare2 size={24} /></button>
              </div>
              <button className="hover:text-gray-500 transition-colors">
                <FiBookmark size={24} className={post.isBookmarked || post.bookmarked ? 'fill-amber-500 text-amber-500' : ''} />
              </button>
            </div>
            <div className="font-bold text-sm text-gray-900 dark:text-white mb-1">
              좋아요 {post.likeCount}개
            </div>
            <div className="text-[10px] text-gray-400 uppercase tracking-wide">
              {post.createdAt}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostDetailModal;