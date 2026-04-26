import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import Modal from '../../components/common/Modal';
import Pagination from '../../components/common/Pagination';
import jwtAxios from '../../api/jwtAxios';

const SORT_OPTIONS = [
  { value: 'latest',    label: '최신순' },
  { value: 'oldest',    label: '오래된 순' },
  { value: 'priceAsc',  label: '가격 낮은 순' },
  { value: 'priceDesc', label: '가격 높은 순' },
];

const FILTER_OPTIONS = [
  { value: 'all',         label: '전체' },
  { value: 'purchased',   label: '구매한 상품' },
  { value: 'unpurchased', label: '미구매 상품' },
];

const HISTORY_OPTIONS = [
  { value: 'point',    label: '포인트 내역' },
  { value: 'purchase', label: '구매 내역' },
];

const getChosung = (str) => {
  const CHO = ['ㄱ','ㄲ','ㄴ','ㄷ','ㄸ','ㄹ','ㅁ','ㅂ','ㅃ','ㅅ','ㅆ','ㅇ','ㅈ','ㅉ','ㅊ','ㅋ','ㅌ','ㅍ','ㅎ'];
  return [...str].map(ch => {
    const code = ch.charCodeAt(0) - 0xAC00;
    return code >= 0 && code <= 11171 ? CHO[Math.floor(code / 588)] : ch;
  }).join('');
};
const isChosung = (str) => /^[ㄱ-ㅎ]+$/.test(str);
const matchesKorean = (name, query) => {
  if (!query) return true;
  if (isChosung(query)) return getChosung(name).includes(query);
  return name.toLowerCase().includes(query.toLowerCase());
};

// ────────────────────────────────────────────────
// 유저 전용 포인트 샵 모달
// ────────────────────────────────────────────────
const PointShopModal = ({ isOpen, onClose, currentUser }) => {
  const [emotes, setEmotes]           = useState([]);
  const [totalPages, setTotalPages]   = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [sort, setSort]               = useState('latest');
  const [filter, setFilter]           = useState('all');
  const [loading, setLoading]         = useState(false);

  const [userPoints, setUserPoints] = useState(null);

  const [confirmTarget, setConfirmTarget]     = useState(null);
  const [purchaseLoading, setPurchaseLoading] = useState(false);
  const [purchaseError, setPurchaseError]     = useState('');

  // 내역 패널: 항상 표시, 드롭다운으로 전환
  const [search, setSearch]           = useState('');
  const [inputValue, setInputValue]   = useState('');
  const [openDropdown, setOpenDropdown] = useState(null);
  const searchTimerRef = useRef(null);

  const [panel, setPanel]               = useState('point');
  const [historyData, setHistoryData]   = useState([]);
  const [historyPage, setHistoryPage]   = useState(0);
  const [historyTotal, setHistoryTotal] = useState(0);
  const [historyLoading, setHistoryLoading] = useState(false);

  const loadHistory = useCallback(async (type, page) => {
    setHistoryLoading(true);
    try {
      const endpoint = type === 'purchase' ? 'shop/purchase-history' : 'shop/point-history';
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      const startDate = sixMonthsAgo.toISOString().split('T')[0];
      const sortParam = type === 'purchase' ? '&sort=purchasedAt,desc' : '';
      const res = await jwtAxios.get(`${endpoint}?page=${page}&size=10&startDate=${startDate}${sortParam}`);
      setHistoryData(res.data.content ?? []);
      setHistoryTotal(res.data.totalPages ?? 0);
      setHistoryPage(page);
    } catch {
      setHistoryData([]);
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  const fetchEmotes = useCallback(async () => {
    setLoading(true);
    try {
      const isSearching = search.trim().length > 0;
      const params = new URLSearchParams({
        sort,
        page: isSearching ? 0 : currentPage,
        size: isSearching ? 100 : 9,
        purchasedOnly:   filter === 'purchased',
        unpurchasedOnly: filter === 'unpurchased',
      });
      const res = await jwtAxios.get(`shop/emotes?${params}`);
      setEmotes(res.data.content ?? []);
      setTotalPages(res.data.totalPages ?? 0);
    } catch {
      setEmotes([]);
    } finally {
      setLoading(false);
    }
  }, [sort, filter, currentPage, search]);

  const fetchPoints = useCallback(async () => {
    try {
      const res = await jwtAxios.get('shop/my-points');
      setUserPoints(res.data.points);
    } catch {
      setUserPoints(null);
    }
  }, []);

  const filteredEmotes = useMemo(() => {
    const q = search.trim();
    if (!q) return emotes;
    return emotes.filter(e => matchesKorean(e.name, q));
  }, [emotes, search]);

  // 모달 오픈 시 1회 실행 — 패널/내역 초기화
  useEffect(() => {
    if (!isOpen) return;
    setPanel('point');
    setHistoryData([]);
    fetchPoints();
    loadHistory('point', 0);
  }, [isOpen, fetchPoints, loadHistory]);

  // sort/filter/search 변경 시 이모티콘 목록만 갱신
  useEffect(() => {
    if (!isOpen) return;
    fetchEmotes();
  }, [isOpen, fetchEmotes]);

  const handleSortChange   = (val) => { setSort(val);   setCurrentPage(0); };
  const handleFilterChange = (val) => { setFilter(val); setCurrentPage(0); };
  const handleSearchChange = (val) => {
    setInputValue(val);
    clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      setSearch(val);
      setCurrentPage(0);
    }, 300);
  };

  const switchPanel = async (type) => {
    setPanel(type);
    setHistoryData([]);
    setHistoryPage(0);
    setHistoryTotal(0);
    await loadHistory(type, 0);
  };

  const handlePurchaseConfirm = async () => {
    if (!confirmTarget) return;
    setPurchaseLoading(true);
    setPurchaseError('');
    try {
      const res = await jwtAxios.post(`shop/emotes/${confirmTarget.id}/purchase`);
      setUserPoints(res.data.remainingPoints);
      setConfirmTarget(null);
      fetchEmotes();
      await loadHistory(panel, 0);
    } catch (err) {
      setPurchaseError(err?.response?.data?.message ?? '구매 중 오류가 발생했습니다.');
    } finally {
      setPurchaseLoading(false);
    }
  };

  const handleClose = () => {
    setConfirmTarget(null);
    setPurchaseError('');
    setSearch('');
    setInputValue('');
    setOpenDropdown(null);
    clearTimeout(searchTimerRef.current);
    onClose();
  };

  // ... 상단 로직 동일

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={handleClose} 
      // 작업: pt-8 -> pt-2로 줄여 제목 위치를 위로 올림
      title={<span className="block pt-2">🛍️ 포인트 샵</span>} 
      maxWidth="max-w-[1200px]"
      maxHeight="max-h-[700px]"
    >
      {/* 작업: h-[508px] -> h-[540px]로 늘려 하단 여백 최적화 및 gap 조정 */}
      <div className="flex gap-8 h-[560px] mt-2">

        {/* ── 왼쪽: 프로필 + 내역 전용 패널 ── */}
        <div className="w-[32%] flex-shrink-0 flex flex-col gap-3 h-full">
          {/* 작업: h-[34px] -> h-[2px]로 줄여 프로필 박스를 위로 배치 (오른쪽 필터바와 시각적 정렬) */}
          <div className="h-[2px] flex-shrink-0" />
          
          {/* 프로필 박스 */}
          <div className="bg-surface rounded-xl px-4 border border-border space-y-3 flex-shrink-0 h-[100px] flex flex-col justify-center">
            <p className="font-semibold text-foreground">
              {currentUser?.nickname || currentUser?.username || '사용자'}
            </p>
            <div className="flex items-center gap-1.5">
              <CoinIcon />
              <span className="font-bold text-foreground">
                {userPoints !== null ? userPoints.toLocaleString() : '...'}
              </span>
              <span className="text-sm text-muted-foreground">포인트</span>
            </div>
          </div>

          {/* 내역 전용 패널 */}
          <div className="flex-1 min-h-0 flex flex-col bg-surface rounded-xl border border-border overflow-hidden">
            <div className="flex items-center px-4 py-3 border-b border-border flex-shrink-0">
              <HistoryTypeDropdown type={panel} onChange={switchPanel} />
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto scrollbar-hide divide-y divide-border">
              {historyLoading ? (
                <p className="py-6 text-center text-muted-foreground text-sm">불러오는 중...</p>
              ) : historyData.length === 0 ? (
                <p className="py-6 text-center text-muted-foreground text-sm">내역이 없습니다.</p>
              ) : panel === 'purchase'
                ? historyData.map(item => (
                  <div key={item.inventoryId} className="flex items-center gap-3 px-4 py-2.5">
                    <img src={item.emoteImageUrl} alt={item.emoteName}
                      className="w-9 h-9 object-contain rounded-lg border border-border bg-background flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{item.emoteName}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(item.purchasedAt).toLocaleDateString('ko-KR')}
                      </p>
                    </div>
                    <div className="flex flex-col items-end flex-shrink-0">
                      <span className="text-sm font-semibold text-red-500">
                        -{(item.pricePaid ?? 0).toLocaleString()}P
                      </span>
                      {item.pointBalance != null && (
                        <span className="text-xs text-blue-400">잔여 {item.pointBalance.toLocaleString()}P</span>
                      )}
                    </div>
                  </div>
                ))
                : historyData.map((item, i) => (
                  <div key={i} className="flex items-center justify-between px-4 py-2.5">
                    <div>
                      <p className="text-sm text-foreground">{item.description || '포인트 변동'}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.createdAt ? new Date(item.createdAt).toLocaleDateString('ko-KR') : ''}
                      </p>
                    </div>
                    <div className="flex flex-col items-end flex-shrink-0">
                      <span className={`text-sm font-semibold ${(item.pointChange ?? 0) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {(item.pointChange ?? 0) >= 0 ? '+' : ''}{(item.pointChange ?? 0).toLocaleString()}P
                      </span>
                      {item.pointBalance != null && (
                        <span className="text-xs text-blue-400">잔여 {item.pointBalance.toLocaleString()}P</span>
                      )}
                    </div>
                  </div>
                ))
              }
            </div>

            {historyTotal > 1 && (
              <div className="border-t border-border flex-shrink-0">
                <HistoryPaginationBar
                  currentPage={historyPage}
                  totalPages={historyTotal}
                  onPageChange={(p) => loadHistory(panel, p)}
                />
              </div>
            )}
          </div>
        </div>

        {/* ── 오른쪽: 정렬·필터 + 이모티콘 그리드 ── */}
        <div className="flex-1 flex flex-col gap-3 h-full">
          {/* 필터/정렬 드롭다운 행 */}
          <div className="flex gap-2 items-center flex-shrink-0">
            <FilterDropdown
              filter={filter}
              onFilter={handleFilterChange}
              dropdownId="filter"
              activeDropdown={openDropdown}
              setActiveDropdown={setOpenDropdown}
            />
            <SortDropdown
              sort={sort}
              onSort={handleSortChange}
              dropdownId="sort"
              activeDropdown={openDropdown}
              setActiveDropdown={setOpenDropdown}
            />
            <input
              type="text"
              value={inputValue}
              onChange={e => handleSearchChange(e.target.value)}
              placeholder="이모티콘 검색..."
              className="w-[500px] px-3 py-1.5 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div className="flex-1 min-h-0 overflow-hidden pt-1 pb-2">
            {loading ? (
              <p className="text-center py-10 text-muted-foreground">불러오는 중...</p>
            ) : filteredEmotes.length === 0 ? (
              <p className="text-center py-10 text-muted-foreground">이모티콘이 없습니다.</p>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {filteredEmotes.map(emote => (
                  <EmoteCard
                    key={emote.id}
                    emote={emote}
                    onClick={() => { setConfirmTarget(emote); setPurchaseError(''); }}
                  />
                ))}
              </div>
            )}
          </div>

          {/* 페이지네이션 하단 여백 최적화 (검색 중에는 숨김) */}
          {!search.trim() && (
            <div className="flex-shrink-0 [&_nav]:mt-0 mb-1">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            </div>
          )}
        </div>

      </div>
      
      {/* 구매 확인 팝업 (코드 동일) */}
      {confirmTarget && (
        <PurchaseConfirmPopup
          emote={confirmTarget}
          userPoints={userPoints}
          loading={purchaseLoading}
          error={purchaseError}
          onConfirm={handlePurchaseConfirm}
          onCancel={() => setConfirmTarget(null)}
        />
      )}
    </Modal>
  );
};

// ... 이하 서브 컴포넌트 동일

export default PointShopModal;

// ════════════════════════════════════════════════
// 서브 컴포넌트
// ════════════════════════════════════════════════

// 작업3: 필터 드롭다운 (화살표 5% 키움, 호버 진한 회색)
const FilterDropdown = ({ filter, onFilter, dropdownId, activeDropdown, setActiveDropdown }) => {
  const [localOpen, setLocalOpen] = useState(false);
  const isControlled = dropdownId !== undefined;
  const open = isControlled ? activeDropdown === dropdownId : localOpen;
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        isControlled ? setActiveDropdown(null) : setLocalOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open, isControlled, setActiveDropdown]);

  const current = FILTER_OPTIONS.find(o => o.value === filter) ?? FILTER_OPTIONS[0];

  return (
    <div ref={ref} className="relative shrink-0">
      <button
        onClick={() => isControlled
          ? setActiveDropdown(p => p === dropdownId ? null : dropdownId)
          : setLocalOpen(p => !p)}
        className={`w-[110px] flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors
          ${filter !== 'all'
            ? 'bg-primary text-primary-foreground border-primary'
            : 'bg-background border-border text-foreground hover:bg-muted/10'}`}
      >
        <span className="flex-1 min-w-0 truncate">{current.label}</span>
        <span className="text-[10.5px] leading-none shrink-0">{open ? '▴' : '▾'}</span>
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-1 bg-background border border-border rounded-xl shadow-lg z-20 overflow-hidden min-w-[130px]">
          {FILTER_OPTIONS.map(o => (
            <button
              key={o.value}
              onClick={() => { onFilter(o.value); isControlled ? setActiveDropdown(null) : setLocalOpen(false); }}
              className={`w-full text-left px-3 py-2 text-sm transition-colors hover:bg-gray-500/25
                ${filter === o.value ? 'text-primary font-semibold bg-primary/5' : 'text-foreground'}`}
            >
              {o.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// 작업3: 정렬 드롭다운
export const SortDropdown = ({ sort, onSort, dropdownId, activeDropdown, setActiveDropdown }) => {
  const [localOpen, setLocalOpen] = useState(false);
  const isControlled = dropdownId !== undefined;
  const open = isControlled ? activeDropdown === dropdownId : localOpen;
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        isControlled ? setActiveDropdown(null) : setLocalOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open, isControlled, setActiveDropdown]);

  const current = SORT_OPTIONS.find(o => o.value === sort) ?? SORT_OPTIONS[0];

  return (
    <div ref={ref} className="relative shrink-0">
      <button
        onClick={() => isControlled
          ? setActiveDropdown(p => p === dropdownId ? null : dropdownId)
          : setLocalOpen(p => !p)}
        className="w-[110px] flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors bg-background border-border text-foreground hover:bg-muted/10"
      >
        <span className="flex-1 min-w-0 truncate">{current.label}</span>
        <span className="text-[10.5px] leading-none shrink-0">{open ? '▴' : '▾'}</span>
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-1 bg-background border border-border rounded-xl shadow-lg z-20 overflow-hidden min-w-[140px]">
          {SORT_OPTIONS.map(o => (
            <button
              key={o.value}
              onClick={() => { onSort(o.value); isControlled ? setActiveDropdown(null) : setLocalOpen(false); }}
              className={`w-full text-left px-3 py-2 text-sm transition-colors hover:bg-gray-500/25
                ${sort === o.value ? 'text-primary font-semibold bg-primary/5' : 'text-foreground'}`}
            >
              {o.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// 작업4: 내역 유형 전환 드롭다운
const HistoryTypeDropdown = ({ type, onChange }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const current = HISTORY_OPTIONS.find(o => o.value === type) ?? HISTORY_OPTIONS[0];

  return (
    <div ref={ref} className="relative inline-block">
      <button
        onClick={() => setOpen(p => !p)}
        className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-sm font-semibold border border-border bg-background text-foreground hover:bg-muted/10 transition-colors"
      >
        {current.label}
        <span className="text-[10.5px] leading-none">{open ? '▴' : '▾'}</span>
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-1 bg-background border border-border rounded-xl shadow-lg z-30 overflow-hidden min-w-[120px]">
          {HISTORY_OPTIONS.map(o => (
            <button
              key={o.value}
              onClick={() => { onChange(o.value); setOpen(false); }}
              className={`w-full text-left px-3 py-2 text-sm transition-colors hover:bg-gray-500/25
                ${type === o.value ? 'text-primary font-semibold bg-primary/5' : 'text-foreground'}`}
            >
              {o.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// 작업5: Pagination 컴포넌트와 동일한 CSS 디자인
const HistoryPaginationBar = ({ currentPage, totalPages, onPageChange }) => {
  if (totalPages <= 1) return null;

  const maxPagesToShow = 5;
  let startPage, endPage;
  if (totalPages <= maxPagesToShow) {
    startPage = 0;
    endPage = totalPages - 1;
  } else {
    const before = Math.floor(maxPagesToShow / 2);
    const after  = Math.ceil(maxPagesToShow / 2) - 1;
    if (currentPage <= before) {
      startPage = 0; endPage = maxPagesToShow - 1;
    } else if (currentPage + after >= totalPages) {
      startPage = totalPages - maxPagesToShow; endPage = totalPages - 1;
    } else {
      startPage = currentPage - before; endPage = currentPage + after;
    }
  }

  const pageNumbers = [];
  for (let i = startPage; i <= endPage; i++) pageNumbers.push(i);

  return (
    <nav className="flex justify-center items-center gap-2 py-2">
      <button onClick={() => onPageChange(0)} disabled={currentPage === 0}
        className="px-3 py-1 rounded-md border border-border bg-card hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed">
        &laquo;
      </button>
      <button onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 0}
        className="px-3 py-1 rounded-md border border-border bg-card hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed">
        &lsaquo;
      </button>
      {pageNumbers.map(n => (
        <button key={n} onClick={() => onPageChange(n)}
          className={`px-3 py-1 rounded-md border ${currentPage === n ? 'bg-primary text-primary-foreground border-primary' : 'border-border bg-card hover:bg-accent'}`}>
          {n + 1}
        </button>
      ))}
      <button onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages - 1}
        className="px-3 py-1 rounded-md border border-border bg-card hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed">
        &rsaquo;
      </button>
      <button onClick={() => onPageChange(totalPages - 1)} disabled={currentPage === totalPages - 1}
        className="px-3 py-1 rounded-md border border-border bg-card hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed">
        &raquo;
      </button>
    </nav>
  );
};

export const CoinIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
    fill="none" stroke="#f0b100" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M13.744 17.736a6 6 0 1 1-7.48-7.48"/>
    <path d="M15 6h1v4"/>
    <path d="m6.134 14.768.866-.5 2 3.464"/>
    <circle cx="16" cy="8" r="6"/>
  </svg>
);

export const SortFilterBar = ({ sort, filter, onSort, onFilter, singleLine = false }) => {
  if (singleLine) {
    return (
      <div className="flex flex-wrap gap-1.5">
        {SORT_OPTIONS.map(o => (
          <button key={o.value} onClick={() => onSort(o.value)}
            className={`px-2 py-1 rounded-lg text-xs font-medium border transition-colors
              ${sort === o.value
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-background border-border text-foreground hover:bg-muted/10'}`}>
            {o.label}
          </button>
        ))}
        {onFilter && FILTER_OPTIONS.map(o => (
          <button key={o.value} onClick={() => onFilter(o.value)}
            className={`px-2 py-1 rounded-lg text-xs font-medium border transition-colors
              ${filter === o.value
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-background border-border text-foreground hover:bg-muted/10'}`}>
            {o.label}
          </button>
        ))}
      </div>
    );
  }
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {SORT_OPTIONS.map(o => (
          <button key={o.value} onClick={() => onSort(o.value)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors
              ${sort === o.value
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-background border-border text-foreground hover:bg-muted/10'}`}>
            {o.label}
          </button>
        ))}
      </div>
      {onFilter && (
        <div className="flex flex-wrap gap-2">
          {FILTER_OPTIONS.map(o => (
            <button key={o.value} onClick={() => onFilter(o.value)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors
                ${filter === o.value
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-background border-border text-foreground hover:bg-muted/10'}`}>
              {o.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// 작업2: 카드 5% 소형화, 이미지 10% 확대, 클릭으로 구매 (버튼 제거)
export const EmoteCard = ({ emote, onClick }) => (
  <div
    onClick={emote.purchased ? undefined : onClick}
    className={`w-[95%] mx-auto flex flex-col items-center rounded-xl border overflow-hidden transition-all
      ${emote.purchased
        ? 'border-border opacity-60 bg-muted/20 cursor-default'
        : 'border-border bg-surface hover:shadow-md hover:-translate-y-0.5 cursor-pointer'}`}
  >
    <div className="w-full h-[90px] flex items-center justify-center p-1 bg-background">
      <img
        src={emote.imageUrl}
        alt={emote.name}
        className="w-full h-full object-contain"
        onError={e => { e.currentTarget.style.display = 'none'; }}
      />
    </div>
    <div className="w-full px-2 pb-1.5 pt-1 text-center space-y-0.5">
      <p className="text-xs text-foreground font-medium truncate">{emote.name}</p>
      <p className="text-xs font-bold text-yellow-500">{emote.price.toLocaleString()}P</p>
      {emote.purchased && (
        <span className="block text-xs text-muted-foreground py-0.5">구매완료</span>
      )}
    </div>
  </div>
);

const PurchaseConfirmPopup = ({ emote, userPoints, loading, error, onConfirm, onCancel }) => {
  const canAfford = userPoints === null || userPoints >= emote.price;
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50">
      <div className="bg-background border border-border rounded-2xl p-6 shadow-2xl w-72 space-y-4">
        <div className="text-center space-y-2">
          <img src={emote.imageUrl} alt={emote.name}
            className="w-16 h-16 object-contain mx-auto rounded-xl border border-border"
            onError={e => { e.currentTarget.style.display = 'none'; }} />
          <p className="font-semibold text-foreground">{emote.name}</p>
          <p className="text-sm text-muted-foreground">
            <span className="font-bold text-yellow-500">{emote.price.toLocaleString()}P</span>로 구매하시겠습니까?
          </p>
          {userPoints !== null && (
            <p className="text-xs text-muted-foreground">
              보유 포인트:{' '}
              <span className={`font-semibold ${canAfford ? 'text-foreground' : 'text-red-500'}`}>
                {userPoints.toLocaleString()}P
              </span>
            </p>
          )}
        </div>
        {!canAfford && <p className="text-red-500 text-xs text-center">포인트가 부족합니다.</p>}
        {error && <p className="text-red-500 text-xs text-center">{error}</p>}
        <div className="flex gap-2">
          <button onClick={onCancel}
            className="flex-1 py-2 rounded-xl border border-border text-foreground text-sm hover:bg-muted/10 transition-colors">
            취소
          </button>
          <button onClick={onConfirm} disabled={loading || !canAfford}
            className="flex-1 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary-hover transition-colors disabled:opacity-50">
            {loading ? '처리 중...' : '확인'}
          </button>
        </div>
      </div>
    </div>
  );
};
