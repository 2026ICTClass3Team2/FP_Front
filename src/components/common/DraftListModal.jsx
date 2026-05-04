import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import jwtAxios from '../../api/jwtAxios';

const DraftListModal = ({ isOpen, onClose, targetType, onLoad }) => {
  const [drafts, setDrafts] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    jwtAxios.get('drafts', { params: { type: targetType } })
      .then(res => setDrafts(res.data || []))
      .catch(() => setDrafts([]))
      .finally(() => setLoading(false));
  }, [isOpen, targetType]);

  const handleDelete = async (e, draftId) => {
    e.stopPropagation();
    try {
      await jwtAxios.delete(`drafts/${draftId}`);
      setDrafts(prev => prev.filter(d => d.draftId !== draftId));
    } catch {
      alert('삭제에 실패했습니다.');
    }
  };

  const stripHtml = (html) => {
    if (!html) return '';
    return html.replace(/<[^>]*>/g, '').trim();
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <div className="relative z-10 w-full max-w-md mx-4 bg-card border border-border rounded-2xl shadow-2xl overflow-hidden">
        {/* 헤더 */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div>
            <h2 className="text-base font-bold text-foreground">임시저장 목록</h2>
            {drafts.length > 0 && (
              <p className="text-xs text-muted-foreground mt-0.5">{drafts.length}개 저장됨</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="cursor-pointer text-muted-foreground hover:text-foreground transition-colors p-1.5 rounded-lg hover:bg-muted"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
              fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* 본문 */}
        <div className="max-h-[60vh] overflow-y-auto">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : drafts.length === 0 ? (
            <div className="py-14 text-center">
              <svg className="mx-auto mb-3 text-muted-foreground/40" xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24"
                fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
              </svg>
              <p className="text-sm text-muted-foreground">저장된 임시글이 없습니다.</p>
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {drafts.map(draft => (
                <li key={draft.draftId} className="group relative">
                  {/* 불러오기 영역 */}
                  <button
                    type="button"
                    onClick={() => { onLoad(draft); onClose(); }}
                    className="cursor-pointer w-full text-left px-5 py-4 pr-14 hover:bg-primary/5 active:bg-primary/10 transition-colors"
                  >
                    <p className="text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                      {draft.title || <span className="text-muted-foreground font-normal italic">(제목 없음)</span>}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
                      {stripHtml(draft.body) || '(내용 없음)'}
                    </p>
                    {draft.tags && draft.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {draft.tags.map(tag => (
                          <span key={tag} className="px-2 py-0.5 bg-primary/10 text-primary text-[11px] font-semibold rounded-md">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                    <p className="text-[11px] text-muted-foreground/50 mt-2">{draft.createdAt}</p>
                  </button>

                  {/* 삭제 버튼 - 절대 위치 */}
                  <button
                    type="button"
                    onClick={(e) => handleDelete(e, draft.draftId)}
                    className="cursor-pointer absolute right-4 top-1/2 -translate-y-1/2 z-10 p-2 rounded text-muted-foreground/60 hover:text-destructive hover:bg-muted active:scale-95 transition-all duration-150 opacity-0 group-hover:opacity-100"
                    title="삭제"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24"
                      fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/>
                      <path d="M10 11v6"/><path d="M14 11v6"/>
                      <path d="M9 6V4h6v2"/>
                    </svg>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* 푸터 */}
        {drafts.length > 0 && (
          <div className="px-5 py-3 border-t border-border bg-muted/20">
            <p className="text-xs text-muted-foreground/60 text-center">항목을 클릭하면 작성 폼에 불러옵니다</p>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};

export default DraftListModal;
