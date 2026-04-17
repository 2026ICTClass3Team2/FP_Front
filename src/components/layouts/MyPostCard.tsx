import React from 'react';
import { FiHeart, FiMessageCircle, FiClock, FiEye } from 'react-icons/fi';

interface MyPostCardProps {
  post: any;
  onClick: () => void;
}

const MyPostCard: React.FC<MyPostCardProps> = ({ post, onClick }) => {
  return (
    <div 
      onClick={onClick}
      className="cursor-pointer p-6 bg-card border border-border rounded-3xl hover:shadow-md hover:border-primary/50 transition-all duration-200"
    >
      {/* 4. 게시글의 타입 배지 및 작성 시간 */}
      <div className="flex justify-between items-start mb-3">
        <span className={`text-xs font-bold px-3 py-1.5 rounded-full ${
          post.contentType === 'qna' 
            ? 'bg-indigo-100 text-indigo-700' 
            : 'bg-emerald-100 text-emerald-700'
        }`}>
          {post.contentType === 'qna' ? '질문' : '피드'}
        </span>
        <div className="flex items-center text-sm text-muted-foreground gap-1.5">
          <FiClock size={14} />
          <span>{post.createdAt ? new Date(post.createdAt).toLocaleDateString('ko-KR') : ''}</span>
        </div>
      </div>
      
      {/* 4. 제목, 좋아요 수, 댓글 수 */}
      <h3 className="text-xl font-bold text-foreground mb-4 line-clamp-2">{post.title}</h3>
      <div className="flex gap-5 text-sm font-medium text-muted-foreground">
        <div className="flex items-center gap-1.5"><FiHeart size={18} /> <span>{post.likeCount || 0}</span></div>
        <div className="flex items-center gap-1.5"><FiMessageCircle size={18} /> <span>{post.commentCount || 0}</span></div>
        <div className="flex items-center gap-1.5"><FiEye size={18} /> <span>{post.viewCount || 0}</span></div>
      </div>
    </div>
  );
};

export default MyPostCard;