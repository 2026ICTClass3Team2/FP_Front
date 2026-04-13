import React, { useState } from 'react';

interface CommentFormProps {
  initialValue?: string;
  onSubmit: (content: string) => Promise<void>;
  onCancel?: () => void;
  placeholder?: string;
  isReply?: boolean;
}

const CommentForm: React.FC<CommentFormProps> = ({
  initialValue = '',
  onSubmit,
  onCancel,
  placeholder = '댓글을 남겨보세요.',
  isReply = false,
}) => {
  const [content, setContent] = useState(initialValue);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    setIsLoading(true);
    try {
      await onSubmit(content);
      setContent(''); // 작성 성공 시 폼 초기화
      if (onCancel) onCancel(); // 수정/답글 폼인 경우 닫기
    } catch (error) {
      console.error('댓글 작성/수정 실패:', error);
      alert('작업을 완료하지 못했습니다. 다시 시도해 주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={`flex flex-col gap-3 ${isReply ? 'mt-3' : 'mb-8'}`}>
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={placeholder}
        disabled={isLoading}
        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-xl bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors resize-none min-h-[100px]"
        required
      />
      <div className="flex justify-end gap-2">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 dark:text-gray-300 dark:bg-gray-800 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
          >
            취소
          </button>
        )}
        <button
          type="submit"
          disabled={isLoading || !content.trim()}
          className="px-4 py-2 text-sm font-bold text-white bg-blue-500 rounded-xl hover:bg-blue-600 transition-colors disabled:opacity-50 shadow-md"
        >
          {isLoading ? '저장 중...' : (initialValue ? '수정 완료' : '댓글 작성')}
        </button>
      </div>
    </form>
  );
};

export default CommentForm;