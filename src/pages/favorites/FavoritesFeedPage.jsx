import React, { useState, useEffect, useRef, useCallback } from 'react';
import jwtAxios from '../../api/jwtAxios';
import PostCard from '../../components/feed/PostCard';
import CommunityPostDetail from '../../components/feed/CommunityPostDetail';
import ConfirmationModal from '../../components/common/ConfirmationModal';

const FavoritesFeedPage = () => {
  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasNextPage, setHasNextPage] = useState(true);
  const [selectedPost, setSelectedPost] = useState(null);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [postToDelete, setPostToDelete] = useState(null);

  const lastPostIdRef = useRef(null);
  const isLoadingRef = useRef(false);
  const hasNextPageRef = useRef(true);
  const observerTarget = useRef(null);

  const fetchPosts = useCallback(async () => {
    if (isLoadingRef.current || !hasNextPageRef.current) return;
    isLoadingRef.current = true;
    setIsLoading(true);
    try {
      const params = { size: 10 };
      if (lastPostIdRef.current) params.lastPostId = lastPostIdRef.current;
      const res = await jwtAxios.get('/favorites/feed', { params });
      const { content, last } = res.data;
      setPosts(prev => [...prev, ...content]);
      if (content.length > 0) {
        lastPostIdRef.current = content[content.length - 1].postId;
      }
      hasNextPageRef.current = !last;
      setHasNextPage(!last);
    } catch {
      hasNextPageRef.current = false;
      setHasNextPage(false);
    } finally {
      isLoadingRef.current = false;
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  useEffect(() => {
    if (!observerTarget.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) fetchPosts(); },
      { threshold: 0.1 }
    );
    observer.observe(observerTarget.current);
    return () => observer.disconnect();
  }, [fetchPosts]);

  const handleDeletePost = (postId) => {
    setPostToDelete(postId);
    setIsConfirmModalOpen(true);
  };

  const confirmDeletePost = async () => {
    if (!postToDelete) return;
    try {
      await jwtAxios.delete(`posts/${postToDelete}`);
      setPosts(prev => prev.filter(p => p.postId !== postToDelete));
    } catch (err) {
      alert(err.response?.data?.message || '게시글 삭제 중 오류가 발생했습니다.');
    } finally {
      setPostToDelete(null);
      setIsConfirmModalOpen(false);
    }
  };

  const handleNotInterested = (postId) => {
    setPosts(prev => prev.filter(p => p.postId !== postId));
  };

  const handleReportSuccess = (reportData) => {
    if (reportData?.targetType?.toUpperCase() === 'POST') {
      setPosts(prev => prev.filter(p => p.postId !== reportData.targetId));
    }
  };

  return (
    <div className="w-full bg-background min-h-screen">
      <div className="max-w-2xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold text-foreground mb-6">팔로우 피드</h1>

        {posts.length === 0 && !isLoading && (
          <div className="text-center py-20 text-muted-foreground">
            <p className="text-lg mb-2">팔로우한 유저가 없거나 게시글이 없습니다.</p>
            <p className="text-sm">유저 프로필에서 팔로우 버튼을 눌러 팔로우를 추가해보세요.</p>
          </div>
        )}

        <div className="flex flex-col gap-4">
          {posts.map(post => (
            <PostCard
              key={post.postId}
              post={post}
              onDetailClick={() => setSelectedPost(post)}
              onComment={() => setSelectedPost(post)}
              onDelete={handleDeletePost}
              onNotInterested={handleNotInterested}
              onReportSuccess={handleReportSuccess}
            />
          ))}
        </div>

        {isLoading && (
          <div className="flex justify-center py-8">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        <div ref={observerTarget} className="h-4" />
      </div>

      {selectedPost && (
        <CommunityPostDetail
          post={selectedPost}
          onClose={(updatedPost) => {
            if (updatedPost) {
              setPosts(prev => prev.map(p => p.postId === updatedPost.postId ? updatedPost : p));
            }
            setSelectedPost(null);
          }}
        />
      )}

      <ConfirmationModal
        isOpen={isConfirmModalOpen}
        onClose={() => { setIsConfirmModalOpen(false); setPostToDelete(null); }}
        onConfirm={confirmDeletePost}
        title="게시글 삭제"
        message="이 게시글을 삭제하시겠습니까? 삭제 후에는 복구할 수 없습니다."
      />
    </div>
  );
};

export default FavoritesFeedPage;
