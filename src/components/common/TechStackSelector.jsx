import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const API_BASE = import.meta.env.DEV ? 'http://localhost:8090/api/' : '/api/';

const TechStackSelector = ({ selectedTags = [], onChange, maxCount = 5 }) => {
  const [isSearching, setIsSearching] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [limitError, setLimitError] = useState(false);
  const [fetchTrigger, setFetchTrigger] = useState(0);
  const inputRef = useRef(null);
  const debounceRef = useRef(null);
  const errorTimerRef = useRef(null);

  // 검색어 변경 또는 태그 선택 후 재검색
  useEffect(() => {
    if (!isSearching) return;
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setIsLoading(true);
      try {
        const res = await axios.get(`${API_BASE}tags/search`, { params: { keyword: query, size: 10 } });
        setResults(res.data || []);
      } catch (err) {
        console.error('[TechStackSelector] 태그 검색 실패:', err?.response?.status, err?.message);
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    }, 300);
    return () => clearTimeout(debounceRef.current);
  }, [query, isSearching, fetchTrigger]);

  // 검색 input 열릴 때 자동 포커스 (스크롤 이동 없이)
  useEffect(() => {
    if (isSearching) inputRef.current?.focus({ preventScroll: true });
  }, [isSearching]);

  // 언마운트 시 타이머 정리
  useEffect(() => () => {
    clearTimeout(debounceRef.current);
    clearTimeout(errorTimerRef.current);
  }, []);

  const showLimitError = () => {
    setLimitError(true);
    clearTimeout(errorTimerRef.current);
    errorTimerRef.current = setTimeout(() => setLimitError(false), 2000);
  };

  const handleOpenSearch = () => {
    setIsSearching(true);
  };

  const handleAdd = (tag) => {
    if (selectedTags.includes(tag)) return;
    if (selectedTags.length >= maxCount) {
      showLimitError();
      return;
    }
    onChange([...selectedTags, tag]);
    setQuery('');
    setFetchTrigger(t => t + 1);
    // 드롭다운 버튼이 DOM에서 제거되면 포커스가 모달 상단으로 이동하여 스크롤이 튀는 현상 방지
    requestAnimationFrame(() => {
      inputRef.current?.focus({ preventScroll: true });
    });
  };

  const handleRemove = (tag) => {
    setLimitError(false);
    onChange(selectedTags.filter(t => t !== tag));
  };

  const handleKeyDown = (e) => {
    // 입력값이 비어있을 때 Backspace → 마지막 태그 제거 (포커스 유지)
    if (e.key === 'Backspace' && query === '' && selectedTags.length > 0) {
      e.preventDefault();
      handleRemove(selectedTags[selectedTags.length - 1]);
    }
  };

  const handleBlur = () => {
    setTimeout(() => {
      setIsSearching(false);
      setQuery('');
      setResults([]);
      setLimitError(false);
    }, 150);
  };

  // 렌더링 시 이미 선택된 태그 제외
  const filteredResults = results.filter(tag => !selectedTags.includes(tag));

  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-semibold text-foreground">
        기술스택 (최대 {maxCount}개)
      </label>

      {isSearching ? (
        /* 검색 모드 */
        <div className="relative">
          <div className={`flex flex-wrap gap-1.5 items-center min-h-[46px] px-3 py-2 border rounded-xl bg-background transition-colors ${limitError ? 'border-red-500' : 'border-primary'}`}>
            {/* 선택된 태그 chips */}
            {selectedTags.map(tag => (
              <span
                key={tag}
                className="flex items-center gap-1 px-2.5 py-1 bg-primary/10 text-primary text-xs font-semibold rounded-lg flex-shrink-0"
              >
                {tag}
                <button
                  type="button"
                  onMouseDown={(e) => { e.preventDefault(); handleRemove(tag); }}
                  className="hover:text-red-500 transition-colors leading-none"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </span>
            ))}
            {/* 검색 input — 항상 표시 */}
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={handleBlur}
              placeholder={selectedTags.length === 0 ? "기술 스택 검색..." : "+ 추가 검색..."}
              className="flex-1 min-w-[100px] bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
            />
          </div>

          {/* 최대 개수 초과 경고 */}
          {limitError && (
            <p className="text-xs text-red-500 font-medium mt-1">
              기술 스택은 최대 {maxCount}개까지 선택 가능합니다.
            </p>
          )}

          {/* 검색 결과 드롭다운 */}
          {(isLoading || filteredResults.length > 0) && (
            <div className="absolute z-50 w-full mt-1 bg-surface border border-border rounded-xl shadow-xl overflow-hidden">
              {isLoading ? (
                <div className="flex justify-center py-4">
                  <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              ) : (
                filteredResults.map(tag => (
                  <button
                    key={tag}
                    type="button"
                    onMouseDown={(e) => { e.preventDefault(); handleAdd(tag); }}
                    className="flex items-center w-full px-4 py-2.5 hover:bg-muted/30 transition-colors text-left text-sm text-foreground"
                  >
                    {tag}
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      ) : (
        /* 기본 모드: 선택된 태그 + 클릭 시 검색 전환 */
        <div
          role="button"
          tabIndex={0}
          onClick={handleOpenSearch}
          onKeyDown={(e) => e.key === 'Enter' && handleOpenSearch()}
          className="flex flex-wrap items-center gap-1.5 w-full min-h-[46px] px-3 py-2 border border-border rounded-xl bg-background cursor-pointer hover:bg-muted/30 transition-colors"
        >
          {selectedTags.length > 0 ? (
            <>
              {selectedTags.map(tag => (
                <span
                  key={tag}
                  className="flex items-center gap-1 px-2.5 py-1 bg-primary/10 text-primary text-xs font-semibold rounded-lg flex-shrink-0"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); handleRemove(tag); }}
                    className="hover:text-red-500 transition-colors leading-none"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </span>
              ))}
              {selectedTags.length < maxCount && (
                <span className="text-xs text-muted-foreground ml-1">+ 추가</span>
              )}
            </>
          ) : (
            <span className="text-sm text-muted-foreground">관련된 기술 스택을 선택해 주세요.</span>
          )}
        </div>
      )}
    </div>
  );
};

export default TechStackSelector;
