import React from 'react';
import { useNavigate } from 'react-router-dom';

// 북마크 아이콘 컴포넌트
const BookmarkIcon = () => (
  <svg className="w-5 h-5" 
  viewBox="0 0 24 24" 
  fill="none" 
  stroke="currentColor" 
  strokeWidth="2" 
  strokeLinecap="round" 
  strokeLinejoin="round">
    <path d="M6 4h12v18l-6-4-6 4V4z" />
  </svg>
);

// 댓글 아이콘 컴포넌트
const CommentIcon = () => (
  <svg className="w-4 h-4" 
  viewBox="0 0 24 24" 
  fill="none" s
  troke="currentColor" 
  strokeWidth="2" 
  strokeLinecap="round" 
  strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);

// 좋아요 아이콘 컴포넌트
const LikeIcon = () => (
  <svg className="w-4 h-4" 
  viewBox="0 0 24 24" 
  fill="none" 
  stroke="currentColor" 
  strokeWidth="2" 
  strokeLinecap="round" 
  strokeLinejoin="round">
    <path d="M14 9V5a3 3 0 0 0-6 0v4" />
    <path d="M5 12h4l1 9 7-8h4" />
  </svg>
);

// 싫어요 아이콘 컴포넌트
const DislikeIcon = () => (
  <svg className="w-4 h-4" 
  viewBox="0 0 24 24" 
  fill="none" 
  stroke="currentColor" 
  strokeWidth="2" 
  strokeLinecap="round" 
  strokeLinejoin="round">
    <path d="M10 15v4a3 3 0 0 0 6 0v-4" />
    <path d="M19 12h-4l-1-9-7 8H4" />
  </svg>
);

// 공유 아이콘 컴포넌트
const ShareIcon = () => (
  <svg className="w-4 h-4" 
  viewBox="0 0 24 24" 
  fill="none" 
  stroke="currentColor" 
  strokeWidth="2" 
  strokeLinecap="round" 
  strokeLinejoin="round">
    <circle cx="18" cy="5" r="3" />
    <circle cx="6" cy="12" r="3" />
    <circle cx="18" cy="19" r="3" />
    <path d="M8.7 10.7l6.6-4.4" />
    <path d="M8.7 13.3l6.6 4.4" />
  </svg>
);

// Q&A 카드 컴포넌트 - 게시글 목록에서 각 게시글 표시
const QnaCard = ({ item, onBookmarkToggle, isBookmarked }) => {
  const navigate = useNavigate();
  const postId = item.qnaId || item.id;

  return (
    <article className="group bg-card border border-border rounded-3xl 
    overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      {/* 게시글 이미지 영역 */}
      <div className="relative h-44 overflow-hidden bg-slate-100 dark:bg-slate-800">
        {item.imageUrl ? (
          <img
            className="h-full w-full object-cover"
            src={item.imageUrl}
            alt={item.title}
            loading="lazy"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-slate-500 dark:text-slate-400">
            이미지가 없습니다.
          </div>
        )}

        {/* 북마크 버튼 */}
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onBookmarkToggle(postId);
          }}
          className="absolute right-4 top-4 rounded-full 
          bg-background/90 p-2 text-foreground shadow-sm hover:bg-background transition-colors"
        >
        </button>
      </div>

      <div className="p-5 space-y-4">
        {/* 상태 및 포인트 표시 */}
        <div className="flex items-center justify-between gap-3 text-xs text-muted">
          <span className={`inline-flex items-center rounded-full px-3 py-1.5 
            ${item.resolved ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'}`}>
            {item.resolved ? '해결됨' : '미해결'}
          </span>
          <span className="text-foreground/80 font-semibold">+{item.points ?? 0}P</span>
        </div>

        {/* 제목 및 내용 클릭 영역 */}
        <button
          type="button"
          onClick={() => navigate(`/qna/${postId}`)}
          className="text-left w-full"
        >
          <h2 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
            {item.title}
          </h2>
          <p className="mt-3 text-sm leading-6 text-muted overflow-hidden max-h-16">
            {item.body}
          </p>
        </button>

        {/* 기술 스택 태그 */}
        <div className="flex flex-wrap gap-2">
          {item.techStacks?.map((tech) => (
            <span key={tech} className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              {tech}
            </span>
          ))}
        </div>

        {/* 작성자 및 날짜 */}
        <div className="grid grid-cols-2 gap-3 text-xs text-muted">
          <span>작성자: {item.author ?? '익명'}</span>
          <span>{item.createdAt ? new Date(item.createdAt).toLocaleDateString('ko-KR') : '날짜 없음'}</span>
        </div>

        {/* 통계 정보 */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-muted">
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-1">
              <CommentIcon />
              {item.commentsCount ?? 0}
            </span>
            <span className="inline-flex items-center gap-1">
              <LikeIcon />
              {item.likes ?? 0}
            </span>
            <span className="inline-flex items-center gap-1">
              <DislikeIcon />
              {item.dislikes ?? 0}
            </span>
            <span className="inline-flex items-center gap-1">
              <ShareIcon />
              {item.shares ?? 0}
            </span>
          </div>
          <span>조회 {item.views ?? 0}</span>
        </div>
      </div>
    </article>
  );
};

export default QnaCard;
