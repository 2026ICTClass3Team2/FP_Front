import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { useSearchParams } from 'react-router-dom';
import { FiPlus } from 'react-icons/fi';
import PostCard, { Post } from './PostCard';
import jwtAxios from '../../api/jwtAxios';
import ConfirmationModal from '../common/ConfirmationModal';
import CommunityPostDetail from './CommunityPostDetail';

const testURI = 'http://localhost:8090/api/';

// 백엔드 Spring Data JPA Slice 응답 인터페이스
interface SliceResponse {
  content: Post[];
  last: boolean;
}

interface FeedListProps {
  onEditClick: (post: Post) => void;
}

const FeedList = forwardRef<any, FeedListProps>(({ onEditClick }, ref) => {
  // 상태 관리
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasNextPage, setHasNextPage] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [postToDelete, setPostToDelete] = useState<number | null>(null);

  const observerTarget = useRef<HTMLDivElement | null>(null);
  const lastPostIdRef = useRef<string | null>(null);
  const isLoadingRef = useRef(false); // 무한 스크롤 옵저버 내에서 최신 로딩 상태를 확인하기 위한 Ref
  const [searchParams, setSearchParams] = useSearchParams();

  // 게시글 삭제 핸들러
  const handleDeletePost = (postId: number) => {
    setPostToDelete(postId);
    setIsConfirmModalOpen(true);
  };

  // 모달에서 확인 시 실제 삭제를 실행하는 함수
  const confirmDeletePost = async () => {
    if (!postToDelete) return;
    try {
      await jwtAxios.delete(`posts/${postToDelete}`);
      setPosts(currentPosts => currentPosts.filter(p => p.postId !== postToDelete));
      alert('게시글이 삭제되었습니다.');
    } catch (err: any) {
      alert(err.response?.data?.message || '게시글 삭제 중 오류가 발생했습니다.');
    } finally {
      setPostToDelete(null);
    }
  };

  // API 요청 함수
  const fetchPosts = async (isRefresh = false) => {
    if (isLoadingRef.current || !hasNextPage) return;

    setIsLoading(true);
    isLoadingRef.current = true; 
    setError(null);

    try {
      // URL 및 파라미터 조합
      let url = `${testURI}posts?size=10`;
      if (lastPostIdRef.current) {
        url += `&lastPostId=${lastPostIdRef.current}`;
      }

      const response = await jwtAxios.get(url);
      const data: SliceResponse = response.data;

      // 데이터 추가 및 커서(마지막 ID) 갱신
      if (data.content && data.content.length > 0) {
        if (isRefresh) {
          setPosts(data.content);
        } else {
          setPosts((prev) => [...prev, ...data.content]);
        }
        const lastPost = data.content[data.content.length - 1];
        lastPostIdRef.current = String(lastPost.postId); 
      }
      
      // 마지막 페이지 여부에 따라 추가 로딩 가능 상태 변경
      setHasNextPage(data.last !== undefined ? !data.last : false);
    } catch (err: any) {
      // 백엔드에서 데이터가 없을 때 404 에러를 던진다면, 에러창 대신 조용히 빈 화면으로 처리합니다.
      if (err.response && err.response.status === 404) {
        setHasNextPage(false);
      } else {
        setError(err.response?.data?.message || err.message || '피드 데이터를 불러오는 데 실패했습니다.');
      }
    } finally {
      setIsLoading(false);
      isLoadingRef.current = false;
    }
  };

  // 부모 컴포넌트에서 호출할 수 있도록 함수 노출
  useImperativeHandle(ref, () => ({
    refresh: () => {
      setPosts([]);
      setHasNextPage(true);
      lastPostIdRef.current = null;
      // fetchPosts를 isRefresh 플래그와 함께 호출하여 목록을 새로고침
      fetchPosts(true);
    }
  }));

  // 컴포넌트 마운트 시 초기 데이터 로드 (1번 페이지)
  useEffect(() => {
    fetchPosts();
    // eslint-disable-next-line react-hooks/exhaustive-deps 
  }, []);

  // Intersection Observer를 활용한 무한 스크롤 감지 로직
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        // 스크롤이 타겟에 도달했고, 다음 페이지가 있으며, 로딩 중이 아닐 때만 API 호출
        if (entries[0].isIntersecting && hasNextPage && !isLoadingRef.current) {
          fetchPosts();
        }
      },
      { threshold: 0.5 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => observer.disconnect();
  }, [hasNextPage]); // hasNextPage가 변경될 때마다 옵저버 재등록

  // URL 파라미터 감지하여 모달 자동 오픈
  useEffect(() => {
    const postIdParam = searchParams.get('postId');
    if (postIdParam && !selectedPost) {
      setSelectedPost({ postId: Number(postIdParam) } as Post);
    }
  }, [searchParams]);

  return (
    <div className="relative max-w-2xl mx-auto w-full pb-20 pt-4 px-4">
      {error && <div className="text-center text-red-500 bg-red-50 p-4 rounded-xl mb-4">{error}</div>}

      <div className="flex flex-col gap-5">
        {posts.map((post) => (
          <PostCard 
            key={post.postId} 
            post={post} 
            onEdit={onEditClick} 
            onDelete={handleDeletePost} 
            onDetailClick={() => setSelectedPost(post)} 
          />
        ))}
      </div>

      {posts.length === 0 && !isLoading && !error && (
        <div className="text-center py-10 text-gray-500">작성된 게시글이 없습니다.</div>
      )}

      {/* 무한 스크롤 감지용 타겟 요소 */}
      <div ref={observerTarget} className="h-14 flex items-center justify-center mt-4">
        {isLoading && <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>}
      </div>

      {/* 상세 보기 모달 렌더링 */}
      {selectedPost && (
        <CommunityPostDetail
          post={selectedPost}
          onClose={(updatedPost) => {
            if (updatedPost) {
              setPosts(prevPosts =>
                prevPosts.map(p => (p.postId === updatedPost.postId ? updatedPost : p))
              );
            }
            setSelectedPost(null);

            // 모달이 닫힐 때 URL 파라미터 제거
            if (searchParams.has('postId')) {
              searchParams.delete('postId');
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