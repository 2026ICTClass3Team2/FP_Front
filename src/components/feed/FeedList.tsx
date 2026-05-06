import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { useSearchParams } from 'react-router-dom';

import PostCard, { Post } from './PostCard';
import jwtAxios from '../../api/jwtAxios';
import { useAuth } from '../sidebar/AuthContext';
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
  const { currentUser } = useAuth() as any;
  const currentUserId = currentUser?.userId ?? currentUser?.user_id ?? currentUser?.id ?? null;

  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasNextPage, setHasNextPage] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [autoScrollToComment, setAutoScrollToComment] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [postToDelete, setPostToDelete] = useState<number | null>(null);

  const observerTarget = useRef<HTMLDivElement | null>(null);
  // 커서 기반 탭(LATEST, SUBSCRIBED)용
  const lastPostIdRef = useRef<string | null>(null);
  // 오프셋 기반 탭(POPULAR, ALGORITHM)용
  const pageRef = useRef<number>(0);
  const isLoadingRef = useRef(false);
  const hasNextPageRef = useRef(true);
  const [searchParams, setSearchParams] = useSearchParams();

  const activeTab = (searchParams.get('tab') as FeedTab) || 'ALGORITHM';

  const isOffsetTab = (tab: FeedTab) => tab === 'POPULAR' || tab === 'ALGORITHM';

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
    if (isLoadingRef.current || !hasNextPageRef.current) return;
    setIsLoading(true);
    isLoadingRef.current = true;
    setError(null);

    try {
      let url = `posts?tab=${tab}&size=10`;
      if (isOffsetTab(tab)) {
        url += `&page=${pageRef.current}`;
      } else if (lastPostIdRef.current) {
        url += `&lastPostId=${lastPostIdRef.current}`;
      }

      const response = await jwtAxios.get(url);
      const data: PagedResponse = response.data;

      if (data.content && data.content.length > 0) {
        if (isRefresh) {
          setPosts(data.content);
        } else {
          setPosts(prev => [...prev, ...data.content]);
        }

        if (isOffsetTab(tab)) {
          pageRef.current += 1;
        } else {
          const lastPost = data.content[data.content.length - 1];
          lastPostIdRef.current = String(lastPost.postId);
        }
      }

      const next = data.last !== undefined ? !data.last : false;
      hasNextPageRef.current = next;
      setHasNextPage(next);
    } catch (err: any) {
      if (err.response?.status === 404) {
        hasNextPageRef.current = false;
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
    // isLoadingRef를 먼저 true로 설정해 Observer의 경쟁 호출 차단
    isLoadingRef.current = true;
    setPosts([]);
    hasNextPageRef.current = true;
    setHasNextPage(true);
    setError(null);
    lastPostIdRef.current = null;
    pageRef.current = 0;
    setTimeout(() => {
      isLoadingRef.current = false;
      fetchPosts(tab, true);
    }, 0);
  };

  // ─── imperative handle ───────────────────────────────────────────────────────

  useImperativeHandle(ref, () => ({
    refresh: () => resetAndFetch(activeTab),
    closeDetailModal: () => { setSelectedPost(null); setAutoScrollToComment(false); },
  }));

  // ─── 탭 변경에 따른 데이터 재조회 ──────────────────────────────────────────────────

  useEffect(() => {
    resetAndFetch(activeTab);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  // 계정 전환 시 피드 리셋 (차단 필터가 새 계정 기준으로 재적용되도록)
  const prevUserIdRef = useRef(currentUserId);
  useEffect(() => {
    if (prevUserIdRef.current !== currentUserId) {
      prevUserIdRef.current = currentUserId;
      resetAndFetch(activeTab);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUserId]);

  // ─── 무한 스크롤 ─────────────────────────────────────────────────────────────

  useEffect(() => {
    const scrollContainer = document.querySelector('main');

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPageRef.current && !isLoadingRef.current) {
          fetchPosts(activeTab);
        }
      },
      {
        root: scrollContainer || null,
        threshold: 0,
        rootMargin: '0px 0px 200px 0px',
      }
    );
    if (observerTarget.current) observer.observe(observerTarget.current);
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

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
