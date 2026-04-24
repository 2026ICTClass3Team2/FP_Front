import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const API_BASE = import.meta.env.DEV ? 'http://localhost:8090/api/' : '/api/';
const MAX_COUNT = 5;

const TechStackModal = ({ isOpen, onClose, selectedTechStack = [], onConfirm }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [allTags, setAllTags] = useState([]);
  const [draft, setDraft] = useState([]);
  const backdropClickRef = useRef(false);

  // 모달 열릴 때 draft 초기화 + 전체 태그 목록 로드 + 검색어 초기화
  useEffect(() => {
    if (!isOpen) return;
    setDraft([...selectedTechStack]);
    setSearchQuery('');
    axios.get(`${API_BASE}tags/search`, { params: { keyword: '', size: 100 } })
      .then(res => setAllTags(res.data || []))
      .catch(() => setAllTags([]));
  }, [isOpen]);

  if (!isOpen) return null;

  // 검색어로 필터링 (대소문자 구분 없음)
  const filtered = searchQuery.trim()
    ? allTags.filter(tag => tag.toLowerCase().includes(searchQuery.trim().toLowerCase()))
    : allTags;

  const isMaxReached = draft.length >= MAX_COUNT;

  const handleToggle = (tag) => {
    setDraft(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
  };

  const handleConfirm = () => {
    onConfirm(draft);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm p-4 transition-opacity duration-300 animate-in fade-in"
      onMouseDown={(e) => { if (e.target === e.currentTarget) backdropClickRef.current = true; }}
      onMouseUp={(e) => { if (e.target === e.currentTarget && backdropClickRef.current) onClose(); backdropClickRef.current = false; }}
    >
      <div
        className="bg-surface w-full max-w-lg rounded-3xl p-7 shadow-2xl border border-border transition-all duration-300 animate-in zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-2xl font-extrabold text-foreground">관심 기술 스택 선택</h2>
            <p className="text-sm text-muted-foreground mt-1.5">
              자신 있는 기술이나 관심 있는 기술을 선택해주세요.
              <span className={`ml-1 font-semibold ${isMaxReached ? 'text-red-500' : 'text-primary'}`}>
                ({draft.length}/{MAX_COUNT})
              </span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground text-3xl leading-none p-1 transition-colors"
          >
            &times;
          </button>
        </div>

        {/* 검색창 */}
        <div className="relative mb-5">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"
            fill="none" stroke="currentColor" viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
              d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="기술 스택 검색..."
            className="w-full pl-9 pr-4 py-2.5 border border-border rounded-xl bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors text-sm"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* 최대 개수 초과 안내 */}
        {isMaxReached && (
          <p className="text-xs text-red-500 font-medium mb-3">
            기술 스택은 최대 {MAX_COUNT}개까지 선택 가능합니다.
          </p>
        )}

        {/* 태그 목록 */}
        <div className="min-h-[120px] max-h-64 overflow-y-auto flex flex-wrap gap-2.5 content-start pt-1">
          {filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground w-full text-center py-8">
              {searchQuery ? `'${searchQuery}'에 해당하는 기술 스택이 없습니다.` : '불러오는 중...'}
            </p>
          ) : (
            filtered.map(tag => {
              const isSelected = draft.includes(tag);
              const isDisabled = !isSelected && isMaxReached;
              return (
                <button
                  key={tag}
                  type="button"
                  disabled={isDisabled}
                  onClick={() => handleToggle(tag)}
                  className={`px-4 py-2 text-sm font-bold rounded-2xl border-2 transition-all duration-200
                    ${isSelected
                      ? 'bg-primary border-primary text-primary-foreground shadow-md -translate-y-0.5'
                      : isDisabled
                        ? 'bg-muted border-muted text-muted-foreground cursor-not-allowed opacity-50'
                        : 'bg-background border-border text-foreground hover:border-primary hover:text-primary hover:-translate-y-0.5'
                    }`}
                >
                  {tag}
                </button>
              );
            })
          )}
        </div>

        {/* 선택 완료 버튼 */}
        <div className="mt-5 flex justify-end">
          <button
            type="button"
            onClick={handleConfirm}
            className="px-7 py-3 bg-foreground text-background rounded-2xl text-sm font-bold hover:opacity-80 transition-opacity shadow-lg"
          >
            선택 완료
          </button>
        </div>
      </div>
    </div>
  );
};

export default TechStackModal;
