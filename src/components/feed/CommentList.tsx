import React, { useState, useEffect, useCallback } from 'react';
import jwtAxios from '../../api/jwtAxios';
import { CommentResponse } from './types';
import CommentItem from './CommentItem';
import CommentForm from './CommentForm';

interface CommentListProps {
  postId: number;
}

const CommentList: React.FC<CommentListProps> = ({ postId }) => {
  const [comments, setComments] = useState<CommentResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

  const fetchComments = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await jwtAxios.get(`posts/${postId}/comments`);
      setComments(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || '댓글을 불러오는 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  }, [postId]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const handleMainCommentSubmit = async (content: string) => {
    await jwtAxios.post(`posts/${postId}/comments`, { content });
    fetchComments(); // 작성 완료 후 댓글 리스트 갱신
  };

  return (
    <section className="w-full mt-10 pt-8 border-t border-gray-200 dark:border-gray-800">
      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">댓글</h3>
      
      {/* 메인 댓글 작성 폼 */}
      <CommentForm onSubmit={handleMainCommentSubmit} />

      {error && <div className="text-red-500 text-sm mb-4 p-4 bg-red-50 dark:bg-red-900/20 rounded-xl">{error}</div>}

      {isLoading && comments.length === 0 ? (
        <div className="flex justify-center py-10">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : comments.length > 0 ? (
        <div className="flex flex-col">
          {comments.map((comment) => (
            <CommentItem key={comment.id} comment={comment} postId={postId} currentUser={currentUser} onRefresh={fetchComments} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-slate-800/50 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700">작성된 댓글이 없습니다. 첫 번째 댓글을 남겨보세요!</div>
      )}
    </section>
  );
};

export default CommentList;