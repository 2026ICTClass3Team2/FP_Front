import React, { useState, useEffect, useCallback, useRef } from 'react'; // useCallback은 uploadToS3에서 사용
import axios from 'axios';
import jwtAxios from '../../api/jwtAxios';
import TechStackModal from '../auth/TechStackModal';
import RichTextEditor from '../editor/RichTextEditor';
import DraftListModal from '../common/DraftListModal';
import SaveToast from '../common/SaveToast';

// 질문 작성/수정 폼 컴포넌트
const QuestionCard = ({ onClose, onPostCreated, postToEdit }) => {
  // 폼 상태 관리
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [selectedTechStacks, setSelectedTechStacks] = useState([]);
  const [isTechStackModalOpen, setIsTechStackModalOpen] = useState(false);
  const [rewardPoints, setRewardPoints] = useState(0);
  const [myPoint, setMyPoint] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // 임시저장 — ref로 관리해서 stale closure 방지
  const currentDraftIdRef = useRef(null);
  const [isDraftModalOpen, setIsDraftModalOpen] = useState(false);
  const [saveToastVisible, setSaveToastVisible] = useState(false);
  const toastTimerRef = useRef(null);
  const draftTimerRef = useRef(null);

  // 보유 포인트 조회
  useEffect(() => {
    jwtAxios.get('mypage/profile').then(res => {
      setMyPoint(res.data.currentPoint ?? 0);
    }).catch(() => {});
  }, []);

  // 수정 모드일 경우 초기값 세팅
  useEffect(() => {
    if (postToEdit) {
      setTitle(postToEdit.title || '');
      setBody(postToEdit.body || '');
      setSelectedTechStacks(postToEdit.techStacks || postToEdit.tags || []);
      setRewardPoints(postToEdit.manualRewardPoints ?? 0);
    }
  }, [postToEdit]);

  // 최신 상태를 ref로 유지해서 타이머 콜백에서 안전하게 참조
  const latestValuesRef = useRef({ title, body, selectedTechStacks });
  useEffect(() => {
    latestValuesRef.current = { title, body, selectedTechStacks };
  });

  // 자동 임시저장 — currentDraftIdRef로 항상 최신값 참조
  const autoSaveDraft = async (t, b, stacks) => {
    if (postToEdit) return;
    const isBlank = !t.trim() && b.replace(/<(.|\n)*?>/g, '').trim().length === 0;
    if (isBlank) return;
    try {
      const payload = { title: t, body: b, targetType: 'qna', tags: stacks };
      if (currentDraftIdRef.current) {
        await jwtAxios.put(`drafts/${currentDraftIdRef.current}`, payload);
      } else {
        const res = await jwtAxios.post('drafts', payload);
        currentDraftIdRef.current = res.data.draftId;
      }
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
      setSaveToastVisible(true);
      toastTimerRef.current = setTimeout(() => setSaveToastVisible(false), 2000);
    } catch {
      // 자동저장 실패는 무시
    }
  };

  // 3초 디바운스 자동저장
  useEffect(() => {
    if (postToEdit) return;
    if (draftTimerRef.current) clearTimeout(draftTimerRef.current);
    draftTimerRef.current = setTimeout(() => {
      const { title: t, body: b, selectedTechStacks: s } = latestValuesRef.current;
      autoSaveDraft(t, b, s);
    }, 10000);
    return () => { if (draftTimerRef.current) clearTimeout(draftTimerRef.current); };
  }, [title, body, selectedTechStacks]);

  // Ctrl+S 즉시 저장
  useEffect(() => {
    if (postToEdit) return;
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        if (draftTimerRef.current) clearTimeout(draftTimerRef.current);
        const { title: t, body: b, selectedTechStacks: s } = latestValuesRef.current;
        autoSaveDraft(t, b, s);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [postToEdit]);

  // 임시저장 불러오기
  const handleLoadDraft = (draft) => {
    setTitle(draft.title || '');
    setBody(draft.body || '');
    setSelectedTechStacks(draft.tags || []);
    currentDraftIdRef.current = draft.draftId;
  };

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
      rewardPoints: parseInt(rewardPoints, 10) || 0,
    };

    try {
      if (postToEdit) {
        await jwtAxios.put(`qna/${postToEdit.qnaId}`, questionData);
        window.dispatchEvent(new Event('point-updated'));
        alert('질문이 성공적으로 수정되었습니다.');
      } else {
        await jwtAxios.post('qna', questionData);
        if (currentDraftIdRef.current) {
          jwtAxios.delete(`drafts/${currentDraftIdRef.current}`).catch(() => {});
        }
        window.dispatchEvent(new Event('point-updated'));
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
    <>
    <DraftListModal
      isOpen={isDraftModalOpen}
      onClose={() => setIsDraftModalOpen(false)}
      targetType="qna"
      onLoad={handleLoadDraft}
    />
    <SaveToast visible={saveToastVisible} />
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      {/* 임시저장 툴바 (새 글 작성 모드만) */}
      {!postToEdit && (
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => setIsDraftModalOpen(true)}
            className="cursor-pointer flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24"
              fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
              <polyline points="10 9 9 9 8 9"/>
            </svg>
            임시저장 목록
          </button>
        </div>
      )}
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

      {/* 신규 작성 또는 댓글 0개인 수정 모드에서만 포인트 입력 표시 */}
      {(!postToEdit || (postToEdit.commentCount === 0 || !postToEdit.commentCount)) && (() => {
        const lockedPoints = postToEdit ? (postToEdit.manualRewardPoints ?? 0) : 0;
        const maxPoints = myPoint + lockedPoints; // 이미 차감된 포인트 + 현재 잔액
        return (
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-foreground">채택 포인트 (선택)</label>
              <span className="text-xs text-amber-600 dark:text-amber-400 font-semibold">보유 포인트: {myPoint}P</span>
            </div>
            <div className="inline-flex items-center gap-3 px-4 py-2.5 border border-amber-500/30 bg-amber-500/5 rounded-xl w-fit">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
                fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                <path d="M13.744 17.736a6 6 0 1 1-7.48-7.48"/><path d="M15 6h1v4"/>
                <path d="m6.134 14.768.866-.5 2 3.464"/><circle cx="16" cy="8" r="6"/>
              </svg>
              <input
                type="number"
                min={0}
                max={maxPoints}
                value={rewardPoints}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10);
                  if (isNaN(val) || val < 0) { setRewardPoints(0); return; }
                  setRewardPoints(Math.min(val, maxPoints));
                }}
                placeholder="0"
                className="w-24 bg-transparent text-foreground text-sm font-bold focus:outline-none placeholder:text-muted-foreground"
              />
              <span className="text-sm font-semibold text-amber-600 dark:text-amber-400 shrink-0">P</span>
            </div>
            <span className="text-xs text-muted-foreground">
              {postToEdit ? '포인트 변경 시 AI 난이도 점수가 재책정됩니다.' : '총 채택 포인트 = 직접 설정한 포인트 + AI 난이도 점수(1~10P)'}
            </span>
          </div>
        );
      })()}

      <div className="flex items-center justify-between mt-4">
        {/* 좌측: 나가기 */}
        <button
          type="button"
          onClick={onClose}
          className="cursor-pointer px-4 py-2 border border-border rounded-xl text-sm font-medium text-foreground
            hover:bg-foreground/10 active:bg-foreground/15
            transition-colors"
        >
          나가기
        </button>
        {/* 우측: 임시저장 + 등록 */}
        <div className="flex items-center gap-2">
          {!postToEdit && (
            <button
              type="button"
              onClick={() => {
                if (draftTimerRef.current) clearTimeout(draftTimerRef.current);
                const { title: t, body: b, selectedTechStacks: s } = latestValuesRef.current;
                autoSaveDraft(t, b, s);
              }}
              className="cursor-pointer px-4 py-2 border border-border rounded-xl text-sm font-medium text-foreground
                hover:border-primary hover:text-primary hover:bg-primary/5 active:bg-primary/10
                transition-all duration-150"
            >
              임시저장
            </button>
          )}
          <button
            type="submit"
            disabled={loading}
            className="cursor-pointer px-4 py-2 bg-primary text-primary-foreground
            rounded-xl text-sm font-bold hover:bg-primary/90 disabled:opacity-50
            transition-colors shadow-md hover:shadow-lg"
          >
            {loading ? (postToEdit ? '수정 중...' : '등록 중...') : (postToEdit ? '질문 수정' : '질문 등록')}
          </button>
        </div>
      </div>
    </form>
    </>
  );
};

export default QuestionCard;