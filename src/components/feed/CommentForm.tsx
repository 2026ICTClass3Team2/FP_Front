import React, { useState } from 'react';
import RichTextEditor from '../editor/RichTextEditor';

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
    
    // Quill은 빈 내용이라도 <p><br></p> 등을 포함할 수 있어 체크가 필요합니다.
    const isContentEmpty = content.replace(/<(.|\n)*?>/g, '').trim().length === 0;
    if (isContentEmpty) return;

    setIsLoading(true);
    try {
      await onSubmit(content);
      setContent(''); 
      if (onCancel) onCancel();
    } catch (error) {
      console.error('댓글 작업 실패:', error);
      alert('작업을 완료하지 못했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={`flex flex-col gap-3 ${isReply ? 'mt-3' : 'mb-8'}`}>
      <div className="rounded-xl transition-shadow">
        <RichTextEditor
          value={content}
          onChange={setContent}
          placeholder={placeholder}
          readOnly={isLoading}
        />
      </div>

      <div className="flex justify-end gap-2">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors disabled:opacity-50"
          >
            취소
          </button>
        )}
        <button
          type="submit"
          disabled={isLoading || content.replace(/<(.|\n)*?>/g, '').trim().length === 0}
          className="px-4 py-2 text-sm font-bold text-white bg-blue-500 rounded-xl hover:bg-blue-600 transition-colors disabled:opacity-50 shadow-md"
        >
          {isLoading ? '저장 중...' : (initialValue ? '수정 완료' : '댓글 작성')}
        </button>
      </div>
    </form>
  );
};

export default CommentForm;