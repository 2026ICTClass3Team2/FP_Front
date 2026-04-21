import React, { useState, useEffect } from 'react';
import jwtAxios from '../../api/jwtAxios';
import { FiAlertTriangle, FiX } from 'react-icons/fi';

const REPORT_REASONS = [
  { value: '', label: '신고 사유를 선택해주세요' },
  { value: 'spam', label: '스팸/홍보' }, // ReportReasonType.spam
  { value: 'inappropriate', label: '부적절한 콘텐츠' }, // ReportReasonType.inappropriate
  { value: 'harrassment', label: '괴롭힘/혐오' }, // ReportReasonType.harrassment
  { value: 'copyright', label: '저작권 침해' }, // ReportReasonType.copyright
  { value: 'other', label: '기타' } // ReportReasonType.other
];

const ReportModal = ({ isOpen, onClose, targetType, targetId, onSuccess }) => {
  // targetType: 'post' | 'comment' | 'user'
  const [reasonType, setReasonType] = useState('');
  const [reasonDetail, setReasonDetail] = useState('');
  const [additionalAction, setAdditionalAction] = useState(false); // 글 숨김 또는 유저 차단 체크박스 상태
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // 모달이 열릴 때마다 상태 초기화
  useEffect(() => {
    if (isOpen) {
      setReasonType('');
      setReasonDetail('');
      setAdditionalAction(false);
      setError('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!reasonType) {
      setError('신고 사유를 선택해 주세요.');
      return;
    }
    if (reasonDetail.length < 10 || reasonDetail.length > 500) {
      setError('신고 상세 내용은 10자 이상, 500자 이하로 입력해 주세요.');
      return;
    }

    setLoading(true);
    setError('');

    // 백엔드 Enum에 맞게 targetType을 변환 (e.g. 'comment' -> 'comments', 대문자 변환 제거)
    const getApiTargetType = (type) => {
      if (type === 'comment') return 'comments';
      if (type === 'feed' || type === 'qna') return 'post';
      return type; // 'post', 'user'는 그대로 사용
    };

    const payload = {
      targetType: getApiTargetType(targetType),
      targetId,
      reasonType,
      reasonDetail,
    };

    const isPostType = ['post', 'feed', 'qna'].includes(targetType);

    // 추가 옵션 적용
    if (isPostType) {
      payload.blockPost = true;
      payload.blockUser = additionalAction;
    } else if (targetType === 'comment') {
      payload.blockUser = additionalAction;
    } else if (targetType === 'user') {
      payload.blockUser = additionalAction;
    }

    try {
      // API 호출 시 주소는 백엔드 명세에 맞춰 수정하세요
      await jwtAxios.post('/reports', payload);
      
      alert('신고가 성공적으로 접수되었습니다.');
      if (onSuccess) {
        // 신고 처리 후 숨김/차단 등 화면 갱신을 위해 추가 조치 상태를 부모로 전달
        onSuccess({ targetType, targetId, additionalAction });
      }
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || '신고 접수 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-background rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col">
        
        <div className="flex justify-between items-center px-6 py-4 border-b border-border">
          <h3 className="text-xl font-bold text-foreground flex items-center gap-2">
            <FiAlertTriangle className="text-red-500" />
            신고하기
          </h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <FiX size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-5">
          {error && <div className="text-red-500 text-sm font-semibold bg-red-500/10 p-3 rounded-xl">{error}</div>}

          {/* 1. 신고 사유 선택 */}
          <div className="flex flex-col gap-2">
            <label className="font-semibold text-foreground text-sm">신고 사유</label>
            <select
              value={reasonType}
              onChange={(e) => setReasonType(e.target.value)}
              className="border border-border rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500 bg-background text-foreground"
            >
              {REPORT_REASONS.map(reason => (
                <option key={reason.value} value={reason.value} disabled={reason.value === ''}>
                  {reason.label}
                </option>
              ))}
            </select>
          </div>

          {/* 2. 신고 사유 상세 입력란 */}
          <div className="flex flex-col gap-2">
            <label className="font-semibold text-foreground text-sm flex justify-between">
              상세 내용 <span className="text-muted-foreground font-normal text-xs">{reasonDetail.length} / 500자</span>
            </label>
            <textarea
              value={reasonDetail}
              onChange={(e) => setReasonDetail(e.target.value)}
              placeholder="신고하시는 상세 사유를 입력해 주세요. (10자 이상 500자 이내)"
              className="border border-border rounded-xl px-4 py-3 min-h-[120px] resize-none focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500 bg-transparent text-foreground"
              maxLength={500}
            />
          </div>

          {/* 3. & 4. & 5. 대상에 따른 추가 액션 (체크박스) */}
          {(() => {
            const isPostType = ['post', 'feed', 'qna'].includes(targetType);
            const isCommentType = targetType === 'comment';
            const isUserType = targetType === 'user';
            if (!isPostType && !isCommentType && !isUserType) return null;
            let label = '';
            if (isPostType) label = '이 작성자의 모든 게시글 차단하기';
            else if (isCommentType) label = '이 댓글 작성자 차단하기 (게시글, 댓글 숨김)';
            else label = '이 유저 차단하기 (게시글, 댓글 숨김)';
            return (
              <label className="flex items-center gap-3 p-3 bg-surface border border-border rounded-xl cursor-pointer hover:bg-secondary transition-colors">
                <input type="checkbox" checked={additionalAction} onChange={(e) => setAdditionalAction(e.target.checked)} className="w-5 h-5 rounded border-border text-red-600 focus:ring-red-500" />
                <span className="text-sm font-semibold text-foreground">{label}</span>
              </label>
            );
          })()}

          {/* 4. 하단 경고 문구 및 제출 버튼 */}
          <div className="mt-2 text-xs leading-relaxed bg-red-500/10 text-red-500 p-3 rounded-xl font-medium">
            경고: 허위 신고 시 계정이 제재될 수 있습니다. 신중하게 신고해 주세요.
          </div>

          <button type="submit" disabled={loading} className="mt-2 w-full py-3.5 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white rounded-xl font-bold text-base transition-colors">
            {loading ? '제출 중...' : '신고 제출하기'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ReportModal;