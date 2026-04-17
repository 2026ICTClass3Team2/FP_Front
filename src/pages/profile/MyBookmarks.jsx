import React, { useState, useEffect } from 'react';
import jwtAxios from '../../api/jwtAxios';
import PostList from '../../components/profile/PostList';
import Pagination from '../../components/common/Pagination';

const MyBookmarks = () => {
  const [bookmarks, setBookmarks] = useState([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [sort, setSort] = useState('createdAt,desc'); // Default sort for bookmarks
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchMyBookmarks = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await jwtAxios.get('/posts/bookmarks', {
          params: {
            page: page,
            size: 10,
            sort: sort // Use the selected sort option
          }
        });
        setBookmarks(response.data.content);
        setTotalPages(response.data.totalPages);
      } catch (err) {
        // Log the error for debugging
        console.error("Failed to fetch bookmarks:", err);
        setError(err.response?.data?.message || '북마크를 불러오는 데 실패했습니다.');
        setBookmarks([]); // Clear bookmarks on error
      } finally {
        setLoading(false);
      }
    };

    fetchMyBookmarks();
  }, [page]);
  // Re-fetch when page or sort changes
  // Note: Bookmarks API spec only mentions createdAt for sorting.
  // If other sorts are supported by the backend, add them here.
  useEffect(() => {
    fetchMyBookmarks();
  }, [page, sort]);

  if (loading) return <div className="text-center py-10">로딩 중...</div>;
  if (error) return <div className="text-center py-10 text-red-500">{error}</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-2xl font-bold">북마크</h3>
        {/* Sort Dropdown for Bookmarks */}
        <select
          value={sort}
          onChange={(e) => { setSort(e.target.value); setPage(0); }}
          className="border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="createdAt,desc">최신순</option>
          <option value="createdAt,asc">오래된 순</option>
        </select>
      </div>
      <PostList posts={bookmarks} emptyMessage="북마크한 게시글이 없습니다." />
      {totalPages > 1 && (
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          onPageChange={setPage}
        />
      )}
    </div>
  );
};

export default MyBookmarks;