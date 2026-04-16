import React, { useState, useEffect, useCallback } from 'react';
import jwtAxios from '../../api/jwtAxios';
import MyPostCard from './MyPostCard';
import CommunityPostDetail from '../feed/CommunityPostDetail';
import QnADetailModal from '../question/QnADetailModal';

const MyBookmarkList = () => {
  const [posts, setPosts] = useState<any[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  
  // 1. 필터 상태 관리
  const [category, setCategory] = useState('all');
  const [sort, setSort] = useState('latest');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedPost, setSelectedPost] = useState<any | null>(null);

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await jwtAxios.get('mypage/bookmarks', { // API Endpoint 변경
        params: { category, sort, page, size: 10 }
      });
      const data = response.data;
      setPosts(data.content || []);
      setTotalPages(data.totalPages || 0);
    } catch (err: any) {
      setError(err.response?.data?.message || '북마크한 게시글을 불러오는데 실패했습니다.'); // 에러 메시지 변경
    } finally {
      setLoading(false);
    }
  }, [category, sort, page]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const handleCategoryChange = (newCategory: string) => {
    setCategory(newCategory);
    setPage(0);
  };

  const handleSortChange = (newSort: string) => {
    setSort(newSort);
    setPage(0);
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 0 && newPage < totalPages) {
      setPage(newPage);
      window.scrollTo(0, 0);
    }
  };

  // 3. 북마크 목록 카드 클릭 시 모달창 열기 핸들러
  const handleCardClick = (post: any) => {
    const formattedPost = {
      ...post,
      postId: post.contentType === 'feed' ? post.id : undefined,
      qnaId: post.contentType === 'qna' ? post.id : undefined
    };
    setSelectedPost(formattedPost);
  };

  // 4. 모달이 닫힐 때 호출될 함수. 모달에서 변경된 데이터(조회수, 좋아요 등)를 리스트에 직접 반영합니다.
  const handleModalClose = (updatedPost?: any) => {
    if (updatedPost) {
      setPosts(prevPosts =>
        prevPosts.map(p => {
          if (p.id === (updatedPost.postId || updatedPost.qnaId)) {
            return {
              ...p,
              likeCount: updatedPost.likeCount ?? p.likeCount,
              commentCount: updatedPost.commentCount ?? p.commentCount,
              viewCount: updatedPost.viewCount ?? p.viewCount,
            };
          }
          return p;
        })
      );
    }
    setSelectedPost(null);
  };

  return (
    <div>
      {/* 1. 필터 UI */}
      <div className="flex flex-col sm:flex-row justify-between gap-4 mb-6">
        <div className="flex gap-2">
          {[
            { id: 'all', label: '전체' },
            { id: 'feed', label: '피드' },
            { id: 'qna', label: '질문' }
          ].map(c => (
            <button
              key={c.id}
              onClick={() => handleCategoryChange(c.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                category === c.id 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
        <select
          value={sort}
          onChange={(e) => handleSortChange(e.target.value)}
          className="rounded-xl border border-border bg-background px-4 py-2 text-sm focus:outline-none focus:border-primary cursor-pointer"
        >
          <option value="latest">최신순</option>
          <option value="oldest">오래된 순</option>
          <option value="likes">좋아요 순</option>
          <option value="views">조회 순</option>
          <option value="comments">댓글 순</option>
        </select>
      </div>

      {/* 2. 북마크 리스트 렌더링 */}
      {error && <div className="text-destructive text-center py-4 bg-destructive/10 rounded-2xl mb-4">{error}</div>}
      
      {loading ? (
        <div className="text-center py-10 text-muted-foreground">목록을 불러오는 중입니다...</div>
      ) : posts.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground bg-card border border-border rounded-3xl">
          북마크한 게시글이 없습니다.
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {posts.map(post => (
            <MyPostCard key={post.id} post={post} onClick={() => handleCardClick(post)} />
          ))}
        </div>
      )}

      {/* 5. 페이지네이션 */}
      {!loading && totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-8">
          <button onClick={() => handlePageChange(page - 1)} disabled={page === 0} className="px-4 py-2 border border-border rounded-lg hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed text-sm">이전</button>
          <div className="flex gap-1">
            {Array.from({ length: totalPages }, (_, i) => i).map((pageNum) => (
              <button
                key={pageNum}
                onClick={() => handlePageChange(pageNum)}
                className={`w-9 h-9 rounded-lg border text-sm transition-colors flex items-center justify-center ${
                  page === pageNum ? 'bg-primary text-primary-foreground border-primary' : 'border-border hover:bg-muted'
                }`}
              >
                {pageNum + 1}
              </button>
            ))}
          </div>
          <button onClick={() => handlePageChange(page + 1)} disabled={page === totalPages - 1} className="px-4 py-2 border border-border rounded-lg hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed text-sm">다음</button>
        </div>
      )}

      {/* 3. 상세 모달창 */}
      {selectedPost && selectedPost.contentType === 'feed' && (
        <CommunityPostDetail post={selectedPost} onClose={handleModalClose} />
      )}
      {selectedPost && selectedPost.contentType === 'qna' && (
        <QnADetailModal post={selectedPost} onClose={handleModalClose} />
      )}
    </div>
  );
};

export default MyBookmarkList;