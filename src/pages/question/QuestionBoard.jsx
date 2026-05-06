import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import Modal from '../../components/common/Modal';
import QuestionCard from '../../components/question/QuestionCard';
import QnAPostCard from '../../components/question/QnAPostCard';
import QnADetailModal from '../../components/question/QnADetailModal';
import ConfirmationModal from '../../components/common/ConfirmationModal';
import jwtAxios from '../../api/jwtAxios';
import { useAuth } from '../../components/sidebar/AuthContext';

const STATUS_OPTIONS = [
  { value: 'all', label: '전체' },
  { value: 'resolved', label: '해결된 질문' },
  { value: 'unresolved', label: '미해결 질문' },
];

const SORT_OPTIONS_QNA = [
  { value: 'latest', label: '최신순' },
  { value: 'popular', label: '인기순' },
  { value: 'comments', label: '댓글 많은 순' },
];

// Q&A 게시판 메인 페이지
const QuestionBoard = () => {
  const { currentUser } = useAuth();
  const currentUserId = currentUser?.userId ?? currentUser?.user_id ?? currentUser?.id ?? null;

  // 검색 및 필터 상태
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState('latest');
  const [statusFilter, setStatusFilter] = useState('all');
  const [openDropdown, setOpenDropdown] = useState(null);
  const statusRef = useRef(null);
  const sortRef = useRef(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isWriteModalOpen, setIsWriteModalOpen] = useState(false);
  const [editingPost, setEditingPost] = useState(null);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [globalStats, setGlobalStats] = useState({ total: 0, solved: 0, unsolved: 0 });
  const [selectedPost, setSelectedPost] = useState(null);
  const [autoScrollToComment, setAutoScrollToComment] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [postToDelete, setPostToDelete] = useState(null);
  
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const PAGE_SIZE = 10;

  // Q&A 목록 가져오기 함수
  const fetchQnaList = useCallback(async (pageNum = 0) => {
    setLoading(true);
    setError('');

    try {
      const params = {
        q: query || undefined,
        sort,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        page: pageNum,
        size: PAGE_SIZE,
      };

      const [listResponse, statsResponse] = await Promise.all([
        jwtAxios.get('qna', { params }),
        jwtAxios.get('qna/stats')
      ]);
      const data = listResponse.data;
      setGlobalStats(statsResponse.data);
      
      // Handle different response formats
      if (data.content) {
        // Assuming paginated response with Spring Data
        setItems(data.content);
        setTotalPages(data.totalPages || 0);
        setHasNextPage(!data.last);
      } else if (data.items) {
        setItems(data.items);
        setHasNextPage(data.hasNextPage !== false);
      } else if (Array.isArray(data)) {
        setItems(data);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Q&A 목록을 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }, [query, sort, statusFilter]);

  // 페이지 변경 handler
  const handlePageChange = (newPage) => {
    if (newPage >= 0 && newPage < totalPages) {
      setPage(newPage);
      fetchQnaList(newPage);
      window.scrollTo(0, 0);
    }
  };

  // 실시간 검색 (300ms 디바운싱)
  useEffect(() => {
    const searchTimer = setTimeout(() => {
      setPage(0); // 검색 시 페이지 초기화
      fetchQnaList(0);
    }, 300);

    return () => clearTimeout(searchTimer);
  }, [query, sort, statusFilter, fetchQnaList]);

  // 계정 전환 시 목록 리셋 (차단 필터가 새 계정 기준으로 재적용되도록)
  const prevUserIdRef = useRef(currentUserId);
  useEffect(() => {
    if (prevUserIdRef.current !== currentUserId) {
      prevUserIdRef.current = currentUserId;
      setPage(0);
      fetchQnaList(0);
    }
  }, [currentUserId, fetchQnaList]);

  // 드롭다운 외부 클릭 감지
  useEffect(() => {
    if (!openDropdown) return;
    const handler = (e) => {
      const activeRef = openDropdown === 'status' ? statusRef : sortRef;
      if (activeRef.current && !activeRef.current.contains(e.target)) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener('mousedown', handler, true);
    return () => document.removeEventListener('mousedown', handler, true);
  }, [openDropdown]);

  // URL 파라미터로 모달 열기
  useEffect(() => {
    const writeMode = searchParams.get('write');
    if (writeMode === 'qna') {
      setSelectedPost(null); // 상세 모달이 열려 있으면 먼저 닫기
      setEditingPost(null);
      setIsWriteModalOpen(true);
      searchParams.delete('write');
      setSearchParams(searchParams, { replace: true });
    }

    const qnaIdParam = searchParams.get('qnaId');
    if (qnaIdParam && !selectedPost) {
      setSelectedPost({ qnaId: Number(qnaIdParam) });
      const commentIdParam = searchParams.get('commentId');
      if (commentIdParam) {
        setAutoScrollToComment(true);
      }
    }
  }, [searchParams, setSearchParams]);

  // 통계는 이제 백엔드에서 전역으로 가져옴
  const stats = globalStats;

  // 게시글 삭제 handler
  const handleDeletePost = (qnaId) => {
    setPostToDelete(qnaId);
    setIsConfirmModalOpen(true);
  };

  // 삭제 확인 handler
  const confirmDeletePost = async () => {
    if (!postToDelete) return;
    try {
      await jwtAxios.delete(`qna/${postToDelete}`);
      setItems(currentItems => currentItems.filter(item => item.qnaId !== postToDelete));
      alert('게시글이 삭제되었습니다.');
      if (selectedPost?.qnaId === postToDelete) {
        setSelectedPost(null);
      }
    } catch (err) {
      alert(err.response?.data?.message || '게시글 삭제 중 오류가 발생했습니다.');
    } finally {
      setPostToDelete(null);
      setIsConfirmModalOpen(false);
    }
  };

  // 모달 핸들러
  const handleCloseModal = () => setIsWriteModalOpen(false);

  // 작성/수정 완료 후 목록 새로고침
  const handlePostCreated = () => {
    handleCloseModal();
    setPage(0);
    fetchQnaList(0);
  };

  // Edit handler
  const handleEditClick = async (post) => {
    if (post.manualRewardPoints === undefined) {
      try {
        const response = await jwtAxios.get(`qna/${post.qnaId}`);
        setEditingPost({ ...post, ...response.data });
      } catch (err) {
        console.error('Failed to fetch post details for edit:', err);
        setEditingPost(post);
      }
    } else {
      setEditingPost(post);
    }
    setIsWriteModalOpen(true);
  };

  return (
    <div className="w-full bg-background min-h-screen pb-20">
      {/* Header */}
      <div className="max-w-2xl mx-auto w-full px-4 pt-8">
        <header className="rounded-[2rem] border border-border bg-card p-8 shadow-sm mb-8">
          <div>
            <p className="text-sm text-muted-foreground">Dead Bug</p>
            <h1 className="mt-1 text-3xl font-bold text-foreground">질문답변 게시판</h1>
            <p className="mt-3 text-sm text-muted-foreground">
              질문을 올리고 더 나은 답변을 받아보세요. 피드 형식의 포럼으로 좋아요, 댓글, 공유 기능을 지원합니다.
            </p>
          </div>

          <div className="mt-8 grid gap-4 lg:grid-cols-[1.8fr_auto]">
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="제목/내용/작성자 검색"
              className="flex-1 rounded-3xl border border-border 
              bg-background px-5 py-3 text-sm text-foreground focus:outline-none 
              focus:border-primary"
            />

            <div className="flex flex-wrap items-center gap-3">
              {/* 상태 필터 드롭다운 */}
              <div ref={statusRef} className="relative">
                <button
                  onClick={() => setOpenDropdown(p => p === 'status' ? null : 'status')}
                  className="flex items-center gap-2 rounded-3xl border border-border bg-background px-4 py-3 text-sm text-foreground hover:bg-gray-500/25 transition-colors cursor-pointer"
                >
                  <span>{STATUS_OPTIONS.find(o => o.value === statusFilter)?.label ?? '전체'}</span>
                  <span className="text-[10.5px] leading-none">{openDropdown === 'status' ? '▴' : '▾'}</span>
                </button>
                {openDropdown === 'status' && (
                  <div className="absolute top-full left-0 mt-1 bg-background border border-border rounded-xl shadow-lg z-20 overflow-hidden min-w-[140px]">
                    {STATUS_OPTIONS.map(o => (
                      <button
                        key={o.value}
                        onClick={() => { setStatusFilter(o.value); setOpenDropdown(null); }}
                        className={`w-full text-left px-4 py-2.5 text-sm transition-colors hover:bg-gray-500/25
                          ${statusFilter === o.value ? 'text-primary font-semibold bg-primary/5' : 'text-foreground'}`}
                      >
                        {o.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* 정렬 드롭다운 */}
              <div ref={sortRef} className="relative">
                <button
                  onClick={() => setOpenDropdown(p => p === 'sort' ? null : 'sort')}
                  className="flex items-center gap-2 rounded-3xl border border-border bg-background px-4 py-3 text-sm text-foreground hover:bg-gray-500/25 transition-colors cursor-pointer"
                >
                  <span>{SORT_OPTIONS_QNA.find(o => o.value === sort)?.label ?? '최신순'}</span>
                  <span className="text-[10.5px] leading-none">{openDropdown === 'sort' ? '▴' : '▾'}</span>
                </button>
                {openDropdown === 'sort' && (
                  <div className="absolute top-full left-0 mt-1 bg-background border border-border rounded-xl shadow-lg z-20 overflow-hidden min-w-[150px]">
                    {SORT_OPTIONS_QNA.map(o => (
                      <button
                        key={o.value}
                        onClick={() => { setSort(o.value); setOpenDropdown(null); }}
                        className={`w-full text-left px-4 py-2.5 text-sm transition-colors hover:bg-gray-500/25
                          ${sort === o.value ? 'text-primary font-semibold bg-primary/5' : 'text-foreground'}`}
                      >
                        {o.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Stats cards */}
        <div className="grid gap-4 md:grid-cols-3 mb-8">
          <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
            <p className="text-sm text-muted-foreground">전체 질문</p>
            <p className="mt-3 text-3xl font-bold text-foreground">{stats.total}</p>
          </div>
          <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
            <p className="text-sm text-muted-foreground">해결된 질문</p>
            <p className="mt-3 text-3xl font-bold text-foreground">{stats.solved}</p>
          </div>
          <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
            <p className="text-sm text-muted-foreground">미해결 질문</p>
            <p className="mt-3 text-3xl font-bold text-foreground">{stats.unsolved}</p>
          </div>
        </div>
      </div>

      {/* Main content area */}
      <div className="max-w-2xl mx-auto w-full px-4">
        {error && (
          <div className="rounded-3xl bg-destructive/10 p-6 text-center text-destructive mb-6">
            {error}
          </div>
        )}

        {loading && (
          <div className="rounded-3xl bg-card p-6 text-center text-muted-foreground">
            목록을 불러오는 중입니다...
          </div>
        )}

        {/* QnA posts list */}
        {!loading && (
          <>
            <div className="flex flex-col gap-5 mb-8">
              {items.length > 0 ? (
                items.map((item) => (
                  <QnAPostCard
                    key={item.qnaId}
                    post={{
                      qnaId: item.qnaId,
                      title: item.title,
                      body: item.body,
                      createdAt: item.createdAt,
                      techStacks: item.techStacks,
                      tags: item.tags,
                      authorProfileImageUrl: item.authorProfileImageUrl,
                      nickname: item.nickname,
                      username: item.username,
                      authorUserId: item.authorUserId ?? item.authorId ?? item.author_id ?? item.userId ?? item.user_id ?? null,
                      likeCount: item.likeCount,
                      likes: item.likes,
                      dislikeCount: item.dislikeCount,
                      dislikes: item.dislikes,
                      viewCount: item.viewCount,
                      views: item.views,
                      commentCount: item.commentCount,
                      commentsCount: item.commentsCount,
                      shareCount: item.shareCount,
                      shares: item.shares,
                      isLiked: item.isLiked,
                      liked: item.liked,
                      isDisliked: item.isDisliked,
                      disliked: item.disliked,
                      isBookmarked: item.isBookmarked,
                      bookmarked: item.bookmarked,
                      isAuthor: item.isAuthor,
                      author: item.author,
                      resolved: item.resolved,
                      points: item.points,
                      manualRewardPoints: item.manualRewardPoints,
                    }}
                    onEdit={handleEditClick}
                    onDelete={handleDeletePost}
                    onDetailClick={() => setSelectedPost(item)}
                    onComment={() => {
                      setSelectedPost(item);
                      setAutoScrollToComment(true);
                    }}
                  />
                ))
              ) : (
                <div className="rounded-3xl border border-border bg-card p-12 text-center text-muted-foreground">
                  검색 결과가 없습니다. 다른 검색어로 다시 시도해보세요.
                </div>
              )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mb-8 flex-wrap">
                <button
                  onClick={() => handlePageChange(page - 1)}
                  disabled={page === 0}
                  className="px-4 py-2 border border-border rounded-lg hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  이전
                </button>

                <div className="flex gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i).map((pageNum) => (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      className={`px-3 py-2 rounded-lg border transition-colors ${
                        page === pageNum
                          ? 'bg-primary text-white border-primary'
                          : 'border-border hover:bg-muted'
                      }`}
                    >
                      {pageNum + 1}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => handlePageChange(page + 1)}
                  disabled={page === totalPages - 1 || totalPages === 0}
                  className="px-4 py-2 border border-border rounded-lg hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  다음
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Write/Edit modal */}
      <Modal title={editingPost ? "질문 수정" : "질문 작성"} isOpen={isWriteModalOpen} onClose={handleCloseModal}>
        <QuestionCard 
          onClose={handleCloseModal} 
          onPostCreated={handlePostCreated}
          postToEdit={editingPost}
        />
      </Modal>

      {/* Detail modal */}
      {selectedPost && (
        <QnADetailModal
          post={selectedPost}
          autoScrollToComment={autoScrollToComment}
          onEditClick={handleEditClick}
          onDeleteClick={handleDeletePost}
          onClose={(updatedPost) => {
            if (updatedPost) {
              setItems(prevItems =>
                prevItems.map(item => (item.qnaId === updatedPost.qnaId ? updatedPost : item))
              );
            }
            setSelectedPost(null);
            setAutoScrollToComment(false);

            // 모달이 닫힐 때 URL 파라미터 제거
            if (searchParams.has('qnaId')) {
              searchParams.delete('qnaId');
              searchParams.delete('commentId');
              setSearchParams(searchParams, { replace: true });
            }
          }}
        />
      )}

      {/* Delete confirmation modal */}
      <ConfirmationModal
        isOpen={isConfirmModalOpen}
        title="게시글 삭제"
        message="정말로 이 게시글을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다."
        onConfirm={confirmDeletePost}
        onClose={() => {
          setPostToDelete(null);
          setIsConfirmModalOpen(false);
        }}
      />
    </div>
  );
};

export default QuestionBoard;
