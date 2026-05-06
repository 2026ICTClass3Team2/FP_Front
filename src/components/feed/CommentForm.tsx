import React, { useState, useEffect, useRef } from 'react';
import RichTextEditor from '../editor/RichTextEditor';

interface CommentFormProps {
  initialValue?: string;
  onSubmit: (content: string) => Promise<void>;
  onCancel?: () => void;
  placeholder?: string;
  isReply?: boolean;
  isEdit?: boolean;
}

const CommentForm: React.FC<CommentFormProps> = ({
  initialValue = '',
  onSubmit,
  onCancel,
  placeholder = '댓글을 남겨보세요.',
  isReply = false,
  isEdit = false,
}) => {
  const [content, setContent] = useState(initialValue);
  const [isLoading, setIsLoading] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  // ESC 키를 눌렀을 때 댓글 작성을 취소하는 로직
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // 이 폼 내부에 포커스가 있을 때만 동작
      if (event.key === 'Escape' && formRef.current?.contains(document.activeElement)) {
        // 모달 전체가 닫히는 것을 막기 위해 이벤트 전파 중단
        event.stopPropagation();

        if (onCancel) {
          // 답글/수정 취소 시 폼을 닫음
          onCancel();
        } else {
          // 메인 댓글 작성란 초기화 및 포커스 아웃
          setContent('');
          if (document.activeElement instanceof HTMLElement) {
            document.activeElement.blur();
          }
        }
      }
    };

    // 이벤트 캡처링(capturing)을 사용하여 다른 ESC 리스너보다 먼저 실행되도록 합니다.
    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [onCancel]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Quill은 빈 내용이라도 <p><br></p> 등을 포함할 수 있어 체크가 필요합니다.
    const isContentEmpty = content.replace(/<(.|\n)*?>/g, '').trim().length === 0 && !content.includes('<img');
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
    <form ref={formRef} onSubmit={handleSubmit} className={`flex flex-col gap-3 ${isReply ? 'mt-3' : 'mb-8'}`}>
      <div className="rounded-xl transition-shadow">
        <RichTextEditor
          value={content}
          onChange={setContent}
          placeholder={placeholder}
          readOnly={isLoading}
          compact
          maxChars={10000}
        />
      </div>

      <div className="flex justify-end gap-2">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-foreground bg-secondary rounded-xl hover:bg-secondary/80 transition-colors disabled:opacity-50"
          >
            취소
          </button>
        )}
        <button
          type="submit"
          disabled={isLoading || (content.replace(/<(.|\n)*?>/g, '').trim().length === 0 && !content.includes('<img'))}
          className="px-4 py-2 text-sm font-bold text-primary-foreground bg-primary rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50 shadow-md"
        >
          {isLoading ? '저장 중...' : (isEdit ? '수정 완료' : '댓글 작성')}
        </button>
      </div>
    </form>
  );
};

export default CommentForm;