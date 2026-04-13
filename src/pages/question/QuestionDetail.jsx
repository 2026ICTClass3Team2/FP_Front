import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import jwtAxios from '../../api/jwtAxios';

const QuestionDetail = () => {
  const { qnaId } = useParams();
  const navigate = useNavigate();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDetail = async () => {
      setLoading(true);
      setError('');

      try {
        const response = await jwtAxios.get(`qna/${qnaId}`);
        setItem(response.data);
      } catch (err) {
        setError(err.response?.data?.message || '게시글 상세 정보를 불러오지 못했습니다.');
      } finally {
        setLoading(false);
      }
    };

    if (qnaId) fetchDetail();
  }, [qnaId]);

  return (
    <section className="max-w-6xl mx-auto space-y-6">
      <button
        type="button"
        onClick={() => navigate('/qna')}
        className="inline-flex items-center rounded-full border 
        border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted/50 transition-colors"
      >
        뒤로가기
      </button>

      {loading && <div className="rounded-3xl bg-card p-8 text-center text-muted">로딩 중입니다...</div>}
      {error && <div className="rounded-3xl bg-destructive/10 p-6 text-destructive text-center">{error}</div>}

      {item && (
        <article className="rounded-[2rem] border border-border bg-card overflow-hidden shadow-sm">
          {item.imageUrl && (
            <img src={item.imageUrl} alt={item.title} className="h-72 w-full object-cover" />
          )}

          <div className="p-8 space-y-6">
            <div className="flex flex-wrap items-center gap-3 text-xs text-muted">
              <span className={`inline-flex items-center rounded-full px-3 py-1.5 
                ${item.resolved ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'}`}>
                {item.resolved ? '해결됨' : '미해결'}
              </span>
              <span className="font-semibold text-foreground">+{item.points ?? 0}P</span>
              <span>작성자 {item.author ?? '익명'}</span>
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

            <div className="space-y-4 text-base leading-8 text-foreground/80">
              <p>{item.body}</p>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm text-muted">
              <div className="space-y-2">
                <p>댓글 {item.commentsCount ?? 0}</p>
                <p>좋아요 {item.likes ?? 0}</p>
                <p>싫어요 {item.dislikes ?? 0}</p>
              </div>
              <div className="space-y-2">
                <p>공유 {item.shares ?? 0}</p>
                <p>조회 {item.views ?? 0}</p>
                <p>카테고리 {item.category ?? '미지정'}</p>
              </div>
            </div>
          </div>
        </article>
      )}
    </section>
  );
};

export default QuestionDetail;
