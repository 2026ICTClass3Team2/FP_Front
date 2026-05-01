import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import jwtAxios from '../../api/jwtAxios';
import TechStackModal from '../auth/TechStackModal';
import RichTextEditor from '../editor/RichTextEditor';

// 질문 작성/수정 폼 컴포넌트
const QuestionCard = ({ onClose, onPostCreated, postToEdit }) => {
  // 폼 상태 관리
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [selectedTechStacks, setSelectedTechStacks] = useState([]);
  const [isTechStackModalOpen, setIsTechStackModalOpen] = useState(false);
  const [rewardPoints, setRewardPoints] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // 수정 모드일 경우 초기값 세팅
  useEffect(() => {
    if (postToEdit) {
      setTitle(postToEdit.title || '');
      setBody(postToEdit.body || '');
      setSelectedTechStacks(postToEdit.techStacks || postToEdit.tags || []);
    }
  }, [postToEdit]);

  // 폼 제출 핸들러
  const handleSubmit = async (e) => {
    e.preventDefault();
    const isBodyEmpty = body.replace(/<(.|\n)*?>/g, '').trim().length === 0 && !body.includes('<img');
    if (!title.trim() || isBodyEmpty) {
      setError('제목과 본문을 입력해주세요.');
      return;
    }
    
    setLoading(true);
    setError('');

    const tagArray = selectedTechStacks;

    // 전송 데이터 구성
    const questionData = {
      title,
      body,
      contentType: 'qna',
      tags: tagArray,
      rewardPoints: postToEdit ? 0 : (parseInt(rewardPoints, 10) || 0),
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

  const uploadToS3 = useCallback(async (file) => {
    const presignedRes = await jwtAxios.get('s3/presigned-url', { params: { filename: file.name } });
    const { presignedUrl, publicUrl } = presignedRes.data;
    await axios.put(presignedUrl, file, { headers: { 'Content-Type': file.type } });
    return publicUrl;
  }, []);

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
        <label className="text-sm font-semibold text-foreground">내용</label>
        <RichTextEditor
          value={body}
          onChange={setBody}
          placeholder="문제 상황, 시도해본 방법, 에러 메시지 등을 상세히 적어주시면 더 좋은 답변을 받을 수 있습니다."
          readOnly={loading}
          onImageUpload={uploadToS3}
          className="rounded-xl transition-shadow"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm font-semibold text-foreground">기술스택 (최대 5개)</label>
        <button
          type="button"
          onClick={() => setIsTechStackModalOpen(true)}
          className="flex flex-wrap items-center gap-1.5 w-full min-h-[46px] px-3 py-2 border border-border rounded-xl bg-background text-left hover:bg-muted/30 hover:border-foreground/50 transition-all"
        >
          {selectedTechStacks.length > 0 ? (
            <>
              {selectedTechStacks.map(tag => (
                <span key={tag} className="px-2.5 py-1 bg-primary/10 text-primary text-xs font-semibold rounded-lg">{tag}</span>
              ))}
              <span className="text-xs text-muted-foreground ml-1">클릭하여 수정</span>
            </>
          ) : (
            <span className="text-sm text-muted-foreground/60">관련된 기술 스택을 선택해 주세요.</span>
          )}
        </button>
        <TechStackModal
          isOpen={isTechStackModalOpen}
          onClose={() => setIsTechStackModalOpen(false)}
          selectedTechStack={selectedTechStacks}
          onConfirm={(tags) => setSelectedTechStacks(tags)}
        />
      </div>

      {!postToEdit && (
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-foreground">채택 포인트 (선택)</label>
          <div className="inline-flex items-center gap-3 px-4 py-2.5 border border-amber-500/30 bg-amber-500/5 rounded-xl w-fit">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
              fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
              <path d="M13.744 17.736a6 6 0 1 1-7.48-7.48"/><path d="M15 6h1v4"/>
              <path d="m6.134 14.768.866-.5 2 3.464"/><circle cx="16" cy="8" r="6"/>
            </svg>
            <input
              type="number"
              min="0"
              value={rewardPoints}
              onChange={(e) => setRewardPoints(e.target.value)}
              placeholder="0"
              className="w-24 bg-transparent text-foreground text-sm font-bold focus:outline-none placeholder:text-muted-foreground"
            />
            <span className="text-sm font-semibold text-amber-600 dark:text-amber-400 shrink-0">P</span>
          </div>
          <span className="text-xs text-muted-foreground">
            총 채택 포인트 = 직접 설정한 포인트 + AI 난이도 점수(1~10P)
          </span>
        </div>
      )}

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
          {loading ? (postToEdit ? '수정 중...' : '등록 중...') : (postToEdit ? '질문 수정' : '질문 등록')}
        </button>
      </div>
    </form>
  );
};

export default QuestionCard;