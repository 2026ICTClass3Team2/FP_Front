import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Modal from '../../components/common/Modal';
import QuestionCard from '../../components/question/QuestionCard';
import QnaCard from '../../components/question/QnaCard';
import jwtAxios from '../../api/jwtAxios';

const QuestionBoard = () => {
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState('latest');
  const [statusFilter, setStatusFilter] = useState('all');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isWriteModalOpen, setIsWriteModalOpen] = useState(false);
  const [bookmarkedIds, setBookmarkedIds] = useState(new Set());
  const [page, setPage] = useState(0);

  const fetchQnaList = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const params = {
        q: query || undefined,
        sort,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        page: page,
        size: 12,
      };

      const response = await jwtAxios.get('qna', { params });
      const data = response.data;
      const content = data.content || data.items || data;

      setItems(Array.isArray(content) ? content : []);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Q&A 목록을 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }, [query, sort, statusFilter]);

  useEffect(() => {
    fetchQnaList();
  }, [fetchQnaList]);

  const stats = useMemo(() => {
    const total = items.length;
    const solved = items.filter((item) => item.resolved).length;
    const unsolved = total - solved;
    return { total, solved, unsolved };
  }, [items]);

  const handleBookmarkToggle = (id) => {
    setBookmarkedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    page=0;
    fetchQnaList();
  };

  const handleWriteClick = () => setIsWriteModalOpen(true);
  const handleCloseModal = () => setIsWriteModalOpen(false);

  return (
    <section className="space-y-8">
      <header className="rounded-[2rem] border border-border bg-card p-8 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm text-muted">Dead Bug</p>
            <h1 className="mt-1 text-3xl font-bold text-foreground">질문답변 게시판</h1>
            <p className="mt-3 text-sm text-muted">
              제목, 내용, 작성자 검색이 가능합니다. 질문에 이미지, 포인트, 태그, 조회수, 댓글, 좋아요, 공유 정보를 함께 보여줍니다.
            </p>
          </div>

          <button
            type="button"
            onClick={handleWriteClick}
            className="inline-flex items-center justify-center rounded-3xl 
            bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground 
            shadow-sm hover:bg-primary/90 transition-colors"
          >
            + 질문 작성
          </button>
        </div>

        <div className="mt-8 grid gap-4 lg:grid-cols-[1.8fr_auto]">
          <form onSubmit={handleSearchSubmit} className="flex gap-3">
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="제목/내용/작성자 검색"
              className="flex-1 rounded-3xl border border-border 
              bg-background px-5 py-3 text-sm text-foreground focus:outline-none 
              focus:border-primary"
            />
            <button
              type="submit"
              className="rounded-3xl bg-primary px-5 py-3 
              text-sm font-semibold text-primary-foreground 
              hover:bg-primary/90 transition-colors"
            >
              검색
            </button>
          </form>

          <div className="flex flex-wrap items-center gap-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-3xl border border-border bg-background 
              px-4 py-3 text-sm text-foreground focus:outline-none focus:border-primary"
            >
              <option value="all">전체</option>
              <option value="resolved">해결된 질문</option>
              <option value="unresolved">미해결 질문</option>
            </select>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="rounded-3xl border border-border bg-background 
              px-4 py-3 text-sm text-foreground 
              focus:outline-none focus:border-primary"
            >
              <option value="latest">최신순</option>
              <option value="popular">인기순</option>
              <option value="comments">댓글 많은 순</option>
            </select>
          </div>
        </div>
      </header>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
          <p className="text-sm text-muted">전체 질문</p>
          <p className="mt-3 text-3xl font-bold text-foreground">{stats.total}</p>
        </div>
        <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
          <p className="text-sm text-muted">해결된 질문</p>
          <p className="mt-3 text-3xl font-bold text-foreground">{stats.solved}</p>
        </div>
        <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
          <p className="text-sm text-muted">미해결 질문</p>
          <p className="mt-3 text-3xl font-bold text-foreground">{stats.unsolved}</p>
        </div>
      </div>

      {error && <div className="rounded-3xl bg-destructive/10 p-6 
      text-center text-destructive">{error}</div>}
      {!error && loading && <div className="rounded-3xl 
      bg-card p-6 text-center text-muted">목록을 불러오는 중입니다...</div>}

      <div className="grid gap-5 xl:grid-cols-2">
        {items.length > 0 ? (
          items.map((item) => (
            <QnaCard
              key={item.qnaId || item.id}
              item={item}
              isBookmarked={bookmarkedIds.has(item.qnaId || item.id)}
              onBookmarkToggle={handleBookmarkToggle}
            />
          ))
        ) : (
          !loading && (
            <div className="rounded-3xl border border-border 
            bg-card p-12 text-center text-muted">
              검색 결과가 없습니다. 다른 검색어로 다시 시도해보세요.
            </div>
          )
        )}
      </div>

      <Modal title="질문 작성" isOpen={isWriteModalOpen} onClose={handleCloseModal}>
        <QuestionCard onClose={handleCloseModal} />
      </Modal>
    </section>
  );
};

export default QuestionBoard;
