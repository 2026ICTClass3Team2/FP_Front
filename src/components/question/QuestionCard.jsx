import React, { useState, useEffect } from 'react';
import jwtAxios from '../../api/jwtAxios';
import TechStackModal from '../auth/TechStackModal';
import RichTextEditor from '../editor/RichTextEditor';

// 질문 작성/수정 폼 컴포넌트
const QuestionCard = ({ onClose, onPostCreated, postToEdit }) => {
  // 폼 상태 관리
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [tags, setTags] = useState('');
  const [rewardPoints, setRewardPoints] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isTechStackModalOpen, setIsTechStackModalOpen] = useState(false);

  // 수정 모드일 경우 초기값 세팅
  useEffect(() => {
    if (postToEdit) {
      setTitle(postToEdit.title || '');
      setBody(postToEdit.body || '');
      setTags(postToEdit.techStacks?.join(', ') || postToEdit.tags?.join(', ') || '');
      setRewardPoints(postToEdit.points || 0);
    }
  }, [postToEdit]);

  // 폼 제출 핸들러
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) {
      setError('제목과 본문을 입력해주세요.');
      return;
    }
    
    setLoading(true);
    setError('');

    // 태그 문자열을 배열로 변환
    const tagArray = tags.split(',').map(tag => tag.trim()).filter(tag => tag);

    // 전송 데이터 구성
    const questionData = {
      title,
      body,
      contentType: 'qna',
      tags: tagArray,
      rewardPoints: parseInt(rewardPoints, 10) || 0
    };

    try {
      if (postToEdit) {
        // 수정 모드
        await jwtAxios.put(`qna/${postToEdit.qnaId}`, questionData);
        alert('질문이 성공적으로 수정되었습니다.');
      } else {
        // 새 작성 모드
        console.log('백엔드로 전송하는 데이터:', questionData);
        await jwtAxios.post('qna', questionData);
        alert('질문이 성공적으로 등록되었습니다.');
      }
      onClose();
      if (onPostCreated) onPostCreated();
    } catch (err) {
      setError(err.response?.data?.message || '질문 처리 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleTechStackToggle = (tech) => {
    const currentTags = tags.split(',').map(t => t.trim()).filter(t => t);
    if (currentTags.includes(tech)) {
      setTags(currentTags.filter(t => t !== tech).join(', '));
    } else {
      if (currentTags.length >= 5) {
        alert('기술 스택은 최대 5개까지만 선택 가능합니다.');
        return;
      }
      setTags([...currentTags, tech].join(', '));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      {error && <div className="text-red-500 text-sm font-medium">{error}</div>}
      
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-semibold text-foreground">제목</label>
        <input 
          type="text" 
          value={title} 
          onChange={(e) => setTitle(e.target.value)} 
          placeholder="궁금한 내용을 요약해서 적어주세요." 
          className="px-4 py-2 border border-border rounded-xl 
          bg-background text-foreground focus:outline-none 
          focus:border-primary transition-colors"
          required 
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-semibold text-foreground">본문</label>
        <RichTextEditor
          value={body}
          onChange={setBody}
          placeholder="문제 상황, 시도해본 방법, 에러 메시지 등을 상세히 적어주시면 더 좋은 답변을 받을 수 있습니다."
          readOnly={loading}
          className="rounded-xl transition-shadow"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-semibold text-foreground">기술스택(최대5개)</label>
        <button
          type="button"
          onClick={() => setIsTechStackModalOpen(true)}
          className="flex items-center justify-between w-full min-h-[46px] 
          p-3 border border-border rounded-xl bg-background text-left 
          focus:outline-none focus:border-primary transition-colors 
          hover:bg-muted/30"
        >
          <div className="flex flex-wrap gap-1.5">
            {tags.split(',').map(t => t.trim()).filter(t => t).length > 0 ? (
              tags.split(',').map(t => t.trim()).filter(t => t).map(tag => (
                <span key={tag} className="px-2.5 py-1 
                bg-primary/10 text-primary text-xs font-semibold rounded-lg shadow-sm">
                  {tag}
                </span>
              ))
            ) : (
              <span className="text-muted-foreground text-sm">관련된 기술 스택을 선택해 주세요.</span>
            )}
          </div>
          <svg className="w-5 h-5 text-muted-foreground flex-shrink-0 ml-2" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24" 
          xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" 
            strokeWidth="2" d="M19 9l-7 7-7-7"></path>
          </svg>
        </button>
      </div>

      <TechStackModal
        isOpen={isTechStackModalOpen}
        onClose={() => setIsTechStackModalOpen(false)}
        selectedTechStack={tags.split(',').map(t => t.trim()).filter(t => t)}
        onToggle={handleTechStackToggle}
      />

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-semibold text-foreground">채택 포인트 (선택)</label>
        <input 
          type="number" 
          min="0" 
          value={rewardPoints} 
          onChange={(e) => setRewardPoints(e.target.value)} 
          placeholder="답변자에게 걸 포인트를 입력하세요." 
          className="px-4 py-2 border border-border rounded-xl bg-background 
          text-foreground focus:outline-none focus:border-primary transition-colors"
        />
        <span className="text-xs text-muted-foreground">
          포인트를 걸면 더 빠르고 양질의 답변을 받을 확률이 높아집니다!
        </span>
      </div>

      <div className="flex justify-end gap-2 mt-4">
        <button 
          type="button" 
          onClick={onClose} 
          className="px-4 py-2 bg-muted hover:bg-muted/80 
          text-foreground rounded-xl text-sm font-medium transition-colors"
        >
          취소
        </button>
        <button 
          type="submit" 
          disabled={loading} 
          className="px-4 py-2 bg-primary text-primary-foreground 
          rounded-xl text-sm font-bold hover:bg-primary/90 disabled:opacity-50 
          transition-colors shadow-md hover:shadow-lg"
        >
          {loading ? '등록 중...' : '질문 등록'}
        </button>
      </div>
    </form>
  );
};

export default QuestionCard;