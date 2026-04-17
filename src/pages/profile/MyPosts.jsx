import React, { useState, useEffect } from 'react';
import jwtAxios from '../../api/jwtAxios';
import PostList from '../../components/profile/PostList';
import Pagination from '../../components/common/Pagination';
import CommunityPostDetail from '../../components/feed/CommunityPostDetail';
import QnaDetailModal from '../../components/question/QnaDetailModal';

const MyPosts = () => {
  const [posts, setPosts] = useState([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [selectedPost, setSelectedPost] = useState(null);
  const [contentType, setContentType] = useState('all'); // 'all', 'feed', 'qna'
  const [sort, setSort] = useState('createdAt,desc'); // Default sort
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchMyPosts = async () => {
      setLoading(true);
      setError('');
      try {
        // NOTE: API 명세에 없어 /mypage/posts 로 가정하여 구현합니다.
        const response = await jwtAxios.get('/mypage/posts', {
          params: {
            page: page,
            size: 10, // You can adjust this size
            sort: sort,
            ...(contentType !== 'all' && { contentType: contentType }) // Add contentType if not 'all'
          }
        });
        setPosts(response.data.content);
        setTotalPages(response.data.totalPages);
      } catch (err) {
        // Log the error for debugging
        console.error("Failed to fetch my posts:", err);
        setError(err.response?.data?.message || '게시글을 불러오는 데 실패했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchMyPosts();
  }, [page, contentType, sort]); // Re-fetch when page, contentType, or sort changes

  if (loading) return <div className="text-center py-10">로딩 중...</div>;
  if (error) return <div className="text-center py-10 text-red-500">{error}</div>;

  const handlePostClick = (post) => {
    setSelectedPost(post);
  };

  const handleCloseModal = (updatedPost) => {
    // 모달에서 데이터가 변경되었을 경우 (예: 좋아요 수) 목록에 반영
    if (updatedPost) {
      setPosts(currentPosts =>
        currentPosts.map(p => (p.id === updatedPost.postId ? { ...p, ...updatedPost, id: p.id } : p))
      );
    }
    setSelectedPost(null);
  };

  // CommunityPostDetail 모달이 요구하는 Post 타입과 API 응답 DTO 간의 필드 이름(id vs postId)을 맞춰주기 위한 변환
  const feedPostForModal = selectedPost && selectedPost.contentType === 'feed'
    ? { ...selectedPost, postId: selectedPost.id }
    : null;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-2xl font-bold">내 게시글</h3>
        <div className="flex items-center gap-4">
          {/* Content Type Filter Tabs */}
          <div className="flex border rounded-md overflow-hidden">
            <button
              onClick={() => { setContentType('all'); setPage(0); }}
              className={`px-4 py-2 text-sm font-medium ${contentType === 'all' ? 'bg-primary text-primary-foreground' : 'bg-background hover:bg-accent'}`}
            >
              전체
            </button>
            <button
              onClick={() => { setContentType('feed'); setPage(0); }}
              className={`px-4 py-2 text-sm font-medium ${contentType === 'feed' ? 'bg-primary text-primary-foreground' : 'bg-background hover:bg-accent'}`}
            >
              피드
            </button>
            <button
              onClick={() => { setContentType('qna'); setPage(0); }}
              className={`px-4 py-2 text-sm font-medium ${contentType === 'qna' ? 'bg-primary text-primary-foreground' : 'bg-background hover:bg-accent'}`}
            >
              Q&A
            </button>
          </div>

          {/* Sort Dropdown */}
          <select
            value={sort}
            onChange={(e) => { setSort(e.target.value); setPage(0); }}
            className="border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="createdAt,desc">최신순</option>
            <option value="createdAt,asc">오래된 순</option>
            <option value="likeCount,desc">좋아요 순</option>
            {/* Assuming viewCount and commentCount are available for sorting */}
            <option value="viewCount,desc">조회수 순</option>
            <option value="commentCount,desc">댓글 많은 순</option>
          </select>
        </div>
      </div>
      <PostList posts={posts} emptyMessage="작성한 게시글이 없습니다." onPostClick={handlePostClick} />
      {totalPages > 1 && (
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          onPageChange={setPage}
        />
      )}

      {/* 피드 상세 모달 */}
      {feedPostForModal && (
        <CommunityPostDetail
          post={feedPostForModal}
          onClose={handleCloseModal}
        />
      )}

      {/* Q&A 상세 모달 */}
      {selectedPost && selectedPost.contentType === 'qna' && (
        <QnaDetailModal postId={selectedPost.id} onClose={handleCloseModal} />
      )}
    </div>
  );
};

export default MyPosts;