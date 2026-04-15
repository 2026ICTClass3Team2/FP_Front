import React, { useEffect, useState } from 'react';
import { FiX } from 'react-icons/fi';
import jwtAxios from '../../api/jwtAxios';

const QnaDetailModal = ({ postId, onClose }) => {
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDetail = async () => {
      if (!postId) return;
      setLoading(true);
      setError('');
      try {
        const response = await jwtAxios.get(`qna/${postId}`);
        setItem(response.data);
      } catch (err) {
        setError(err.response?.data?.message || '게시글 상세 정보를 불러오지 못했습니다.');
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [postId]);

  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" 
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-3xl bg-card rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-full transition-colors"
        >
          <FiX size={24} />
        </button>

        {loading && <div className="text-center py-20">로딩 중입니다...</div>}
        {error && <div className="text-center py-20 text-destructive">{error}</div>}
        
        {item && (
          <article className="space-y-6">
            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              <span className={`inline-flex items-center rounded-full px-3 py-1.5 
                ${item.resolved ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'}`}>
                {item.resolved ? '해결됨' : '미해결'}
              </span>
              <span className="font-semibold text-foreground">+{item.points ?? 0}P</span>
              <span>작성자 {item.nickname} ({item.username})</span>
              <span>{item.createdAt ? new Date(item.createdAt).toLocaleDateString('ko-KR') : '날짜 없음'}</span>
            </div>

            <h1 className="text-3xl font-bold text-foreground">{item.title}</h1>

            <div className="flex flex-wrap gap-2">
              {item.techStacks?.map((tech) => (
                <span key={tech} className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                  {tech}
                </span>
              ))}
            </div>

            <div 
              className="prose prose-sm dark:prose-invert max-w-none text-base leading-8 text-foreground/80"
              dangerouslySetInnerHTML={{ __html: item.body }} 
            />

            <div className="grid grid-cols-2 gap-4 pt-6 border-t border-border text-sm text-muted-foreground">
              <div className="space-y-2">
                <p>댓글 {item.commentsCount ?? 0}</p>
                <p>좋아요 {item.likes ?? 0}</p>
                <p>싫어요 {item.dislikes ?? 0}</p>
              </div>
              <div className="space-y-2">
                <p>공유 {item.shares ?? 0}</p>
                <p>조회 {item.views ?? 0}</p>
              </div>
            </div>
          </article>
        )}
      </div>
    </div>
  );
};

export default QnaDetailModal;