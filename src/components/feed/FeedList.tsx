import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { useSearchParams } from 'react-router-dom';

import PostCard, { Post } from './PostCard';
import jwtAxios from '../../api/jwtAxios';
import ConfirmationModal from '../common/ConfirmationModal';
import CommunityPostDetail from './CommunityPostDetail';

type FeedTab = 'LATEST' | 'POPULAR' | 'ALGORITHM' | 'SUBSCRIBED';

interface PagedResponse {
  content: Post[];
  last: boolean;
}

interface FeedListProps {
  onEditClick: (post: Post) => void;
}

const TABS: { key: FeedTab; label: string }[] = [
  { key: 'ALGORITHM', label: '맞춤' },
  { key: 'POPULAR',   label: '인기' },
  { key: 'LATEST',    label: '최신' },
  { key: 'SUBSCRIBED',label: '구독' },
];

const FeedList = forwardRef<any, FeedListProps>(({ onEditClick }, ref) => {
  const [activeTab, setActiveTab] = useState<FeedTab>('ALGORITHM');
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasNextPage, setHasNextPage] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [autoScrollToComment, setAutoScrollToComment] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [postToDelete, setPostToDelete] = useState<number | null>(null);

  const observerTarget = useRef<HTMLDivElement | null>(null);
  // LATEST 탭용 커서
  const lastPostIdRef = useRef<string | null>(null);
  // POPULAR / ALGORITHM / SUBSCRIBED 탭용 오프셋
  const pageRef = useRef<number>(0);
  const isLoadingRef = useRef(false);
  const [searchParams, setSearchParams] = useSearchParams();

  // ─── 삭제 ────────────────────────────────────────────────────────────────────

  const handleDeletePost = (postId: number) => {
    setPostToDelete(postId);
    setIsConfirmModalOpen(true);
  };

  const confirmDeletePost = async () => {
    if (!postToDelete) return;
    try {
      await jwtAxios.delete(`posts/${postToDelete}`);
      setPosts(prev => prev.filter(p => p.postId !== postToDelete));
      alert('게시글이 삭제되었습니다.');
    } catch (err: any) {
      alert(err.response?.data?.message || '게시글 삭제 중 오류가 발생했습니다.');
    } finally {
      setPostToDelete(null);
    }
  };

  // ─── 관심없음 ────────────────────────────────────────────────────────────────

  const handleNotInterested = (postId: number) => {
    setPosts(prev => prev.filter(p => p.postId !== postId));
  };

  // ─── 신고 ────────────────────────────────────────────────────────────────────

  const handleReportSuccess = (reportData: any) => {
    if (reportData.targetType.toUpperCase() === 'POST') {
      setPosts(prev => prev.filter(p => p.postId !== reportData.targetId));
      if (reportData.additionalAction) {
        resetAndFetch();
      }
    }
  };

  // ─── 데이터 페칭 ──────────────────────────────────────────────────────────────

  const fetchPosts = async (tab: FeedTab, isRefresh = false) => {
    if (isLoadingRef.current || !hasNextPage) return;
    setIsLoading(true);
    isLoadingRef.current = true;
    setError(null);

    try {
      let url: string;

      if (tab === 'LATEST') {
        // 커서 기반 — Slice 응답
        url = `posts?tab=LATEST&size=10`;
        if (lastPostIdRef.current) url += `&lastPostId=${lastPostIdRef.current}`;
      } else {
        // 오프셋 기반 — Page 응답
        url = `posts?tab=${tab}&page=${pageRef.current}&size=10`;
      }

      const response = await jwtAxios.get(url);
      const data: PagedResponse = response.data;

      if (data.content && data.content.length > 0) {
        if (isRefresh) {
          setPosts(data.content);
        } else {
          setPosts(prev => [...prev, ...data.content]);
        }

        if (tab === 'LATEST') {
          const lastPost = data.content[data.content.length - 1];
          lastPostIdRef.current = String(lastPost.postId);
        } else {
          pageRef.current += 1;
        }
      }

      setHasNextPage(data.last !== undefined ? !data.last : false);
    } catch (err: any) {
      if (err.response?.status === 404) {
        setHasNextPage(false);
      } else {
        setError(err.response?.data?.message || err.message || '피드 데이터를 불러오는 데 실패했습니다.');
      }
    } finally {
      setIsLoading(false);
      isLoadingRef.current = false;
    }
  };

  // 탭 전환 / 새로고침 시 상태 초기화 후 재조회
  const resetAndFetch = (tab: FeedTab = activeTab) => {
    setPosts([]);
    setHasNextPage(true);
    setError(null);
    lastPostIdRef.current = null;
    pageRef.current = 0;
    isLoadingRef.current = false;
    // 다음 렌더에서 fetchPosts가 새 상태로 실행되도록 setTimeout
    setTimeout(() => fetchPosts(tab, true), 0);
  };

  const handleTabChange = (tab: FeedTab) => {
    if (tab === activeTab) return;
    setActiveTab(tab);
    resetAndFetch(tab);
  };

  // ─── imperative handle ───────────────────────────────────────────────────────

  useImperativeHandle(ref, () => ({
    refresh: () => resetAndFetch(activeTab),
  }));

  // ─── 초기 로드 ───────────────────────────────────────────────────────────────

  useEffect(() => {
    fetchPosts(activeTab);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── 무한 스크롤 ─────────────────────────────────────────────────────────────

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isLoadingRef.current) {
          fetchPosts(activeTab);
        }
      },
      { threshold: 0.5 }
    );
    if (observerTarget.current) observer.observe(observerTarget.current);
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasNextPage, activeTab]);

  // ─── URL 파라미터로 모달 오픈 ────────────────────────────────────────────────

  useEffect(() => {
    const postIdParam = searchParams.get('postId');
    if (postIdParam && !selectedPost) {
      setSelectedPost({ postId: Number(postIdParam) } as Post);
      if (searchParams.get('commentId')) setAutoScrollToComment(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // ─── 렌더 ────────────────────────────────────────────────────────────────────

  return (
    <div className="relative max-w-2xl mx-auto w-full pb-20 pt-4 px-4">

      {/* 탭 바 */}
      <div className="flex gap-1 mb-5 bg-muted/40 rounded-xl p-1">
        {TABS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => handleTabChange(key)}
            className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${
              activeTab === key
                ? 'bg-surface text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {error && (
        <div className="text-center text-red-500 bg-red-500/10 p-4 rounded-xl mb-4">{error}</div>
      )}

      {/* 초기 로드 스피너 */}
      {isLoading && posts.length === 0 && (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      <div className="flex flex-col gap-5">
        {posts.map((post) => (
          <PostCard
            key={post.postId}
            post={post}
            onEdit={onEditClick}
            onDelete={handleDeletePost}
            onNotInterested={handleNotInterested}
            onDetailClick={() => setSelectedPost(post)}
            onComment={() => {
              setSelectedPost(post);
              setAutoScrollToComment(true);
            }}
            onReportSuccess={handleReportSuccess}
          />
        ))}
      </div>

      {posts.length === 0 && !isLoading && !error && (
        <div className="text-center py-10 text-muted-foreground">
          {activeTab === 'SUBSCRIBED'
            ? '구독한 채널이 없거나 게시글이 없습니다.'
            : '게시글이 없습니다.'}
        </div>
      )}

      {/* 무한 스크롤 감지 타겟 */}
      <div ref={observerTarget} className="h-14 flex items-center justify-center mt-4">
        {isLoading && posts.length > 0 && (
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        )}
      </div>

      {/* 게시글 상세 모달 */}
      {selectedPost && (
        <CommunityPostDetail
          post={selectedPost}
          autoScrollToComment={autoScrollToComment}
          onEditClick={onEditClick}
          onDeleteClick={handleDeletePost}
          onClose={(updatedPost?: Post, wasBlocked: boolean = false) => {
            if (updatedPost) {
              setPosts(prev =>
                prev.map(p => (p.postId === updatedPost.postId ? updatedPost : p))
              );
            } else if (wasBlocked || !updatedPost) {
              resetAndFetch();
            }
            setSelectedPost(null);
            setAutoScrollToComment(false);
            if (searchParams.has('postId')) {
              searchParams.delete('postId');
              searchParams.delete('commentId');
              setSearchParams(searchParams, { replace: true });
            }
          }}
        />
      )}

      {/* 삭제 확인 모달 */}
      <ConfirmationModal
        isOpen={isConfirmModalOpen}
        onClose={() => {
          setIsConfirmModalOpen(false);
          setPostToDelete(null);
        }}
        onConfirm={confirmDeletePost}
        title="게시글 삭제"
        message="정말로 이 게시글을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다."
      />
    </div>
  );
});

export default FeedList;
