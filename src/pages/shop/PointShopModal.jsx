import React, { useState, useEffect, useCallback } from 'react';
import Modal from '../../components/common/Modal';
import Pagination from '../../components/common/Pagination';
import jwtAxios from '../../api/jwtAxios';

const SORT_OPTIONS = [
  { value: 'latest',   label: '최신순' },
  { value: 'oldest',   label: '오래된 순' },
  { value: 'priceAsc', label: '가격 낮은 순' },
  { value: 'priceDesc',label: '가격 높은 순' },
];

const FILTER_OPTIONS = [
  { value: 'all',        label: '전체' },
  { value: 'purchased',  label: '구매한 상품' },
  { value: 'unpurchased',label: '미구매 상품' },
];

// ────────────────────────────────────────────────
// 유저 전용 포인트 샵 모달
// ────────────────────────────────────────────────
const PointShopModal = ({ isOpen, onClose, currentUser }) => {
  // ── 이모티콘 목록
  const [emotes, setEmotes]           = useState([]);
  const [totalPages, setTotalPages]   = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [sort, setSort]               = useState('latest');
  const [filter, setFilter]           = useState('all');
  const [loading, setLoading]         = useState(false);

  // ── 유저 포인트
  const [userPoints, setUserPoints] = useState(null);

  // ── 구매 확인 팝업
  const [confirmTarget, setConfirmTarget]   = useState(null);
  const [purchaseLoading, setPurchaseLoading] = useState(false);
  const [purchaseError, setPurchaseError]   = useState('');

  // ── 내역 패널: null | 'point' | 'purchase'  (라우팅 없이 useState로 전환)
  const [panel, setPanel]               = useState(null);
  const [historyData, setHistoryData]   = useState([]);
  const [historyPage, setHistoryPage]   = useState(0);
  const [historyTotal, setHistoryTotal] = useState(0);
  const [historyLoading, setHistoryLoading] = useState(false);

  // ── 이모티콘 목록 fetch
  const fetchEmotes = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        sort,
        page: currentPage,
        size: 9,
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
  }, [sort, filter, currentPage]);

  // ── 유저 포인트 fetch
  const fetchPoints = useCallback(async () => {
    try {
      const res = await jwtAxios.get('shop/my-points');
      setUserPoints(res.data.points);
    } catch {
      setUserPoints(null);
    }
  }, []);

  // ── 모달 열릴 때 초기 데이터 로드
  useEffect(() => {
    if (!isOpen) return;
    fetchEmotes();
    fetchPoints();
  }, [isOpen, fetchEmotes, fetchPoints]);

  // ── 정렬/필터 변경 → 1페이지로 리셋
  const handleSortChange   = (val) => { setSort(val);   setCurrentPage(0); };
  const handleFilterChange = (val) => { setFilter(val); setCurrentPage(0); };

  // ── 내역 패널 열기
  const openPanel = async (type) => {
    setPanel(type);
    setHistoryData([]);
    setHistoryPage(0);
    setHistoryTotal(0);
    await loadHistory(type, 0);
  };

  const loadHistory = async (type, page) => {
    setHistoryLoading(true);
    try {
      const endpoint = type === 'purchase' ? 'shop/purchase-history' : 'shop/point-history';
      const sortParam = type === 'purchase' ? '&sort=purchasedAt,desc' : '';
      const res = await jwtAxios.get(`${endpoint}?page=${page}&size=10${sortParam}`);
      setHistoryData(res.data.content ?? []);
      setHistoryTotal(res.data.totalPages ?? 0);
      setHistoryPage(page);
    } catch {
      setHistoryData([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  // ── 구매
  const handlePurchaseConfirm = async () => {
    if (!confirmTarget) return;
    setPurchaseLoading(true);
    setPurchaseError('');
    try {
      const res = await jwtAxios.post(`shop/emotes/${confirmTarget.id}/purchase`);
      setUserPoints(res.data.remainingPoints);
      setConfirmTarget(null);
      fetchEmotes();
    } catch (err) {
      setPurchaseError(err?.response?.data?.message ?? '구매 중 오류가 발생했습니다.');
    } finally {
      setPurchaseLoading(false);
    }
  };

  // ── 모달 닫기 (상태 초기화)
  const handleClose = () => {
    setPanel(null);
    setConfirmTarget(null);
    setPurchaseError('');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="🛍️ 포인트 샵" maxWidth="max-w-[90vw]" maxHeight="max-h-[90vh]">
      <div className="space-y-4">

        {/* ── 유저 정보 + 내역 버튼 ── */}
        <div className="bg-surface rounded-xl p-4 border border-border">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <p className="font-semibold text-foreground">
                {currentUser?.nickname || currentUser?.username || '사용자'}
              </p>
              <div className="flex items-center gap-1.5 mt-1">
                <CoinIcon />
                <span className="font-bold text-foreground">
                  {userPoints !== null ? userPoints.toLocaleString() : '...'}
                </span>
                <span className="text-sm text-muted-foreground">포인트</span>
              </div>
            </div>
            <div className="flex gap-2">
              <HistoryBtn
                label="포인트 내역"
                active={panel === 'point'}
                onClick={() => panel === 'point' ? setPanel(null) : openPanel('point')}
              />
              <HistoryBtn
                label="구매내역"
                active={panel === 'purchase'}
                onClick={() => panel === 'purchase' ? setPanel(null) : openPanel('purchase')}
              />
            </div>
          </div>
        </div>

        {/* ── 내역 패널 (useState 전환, 라우팅 없음) ── */}
        {panel && (
          <HistoryPanel
            type={panel}
            data={historyData}
            loading={historyLoading}
            currentPage={historyPage}
            totalPages={historyTotal}
            onPageChange={(p) => loadHistory(panel, p)}
            onClose={() => setPanel(null)}
          />
        )}

        {/* ── 정렬 버튼 ── */}
        <SortFilterBar
          sort={sort}
          filter={filter}
          onSort={handleSortChange}
          onFilter={handleFilterChange}
        />

        {/* ── 이모티콘 그리드 ── */}
        {loading ? (
          <p className="text-center py-10 text-muted-foreground">불러오는 중...</p>
        ) : emotes.length === 0 ? (
          <p className="text-center py-10 text-muted-foreground">이모티콘이 없습니다.</p>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-3">
              {emotes.map(emote => (
                <EmoteCard
                  key={emote.id}
                  emote={emote}
                  showBuy
                  onBuy={() => { setConfirmTarget(emote); setPurchaseError(''); }}
                />
              ))}
            </div>
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </>
        )}
      </div>

      {/* ── 구매 확인 팝업 ── */}
      {confirmTarget && (
        <PurchaseConfirmPopup
          emote={confirmTarget}
          loading={purchaseLoading}
          error={purchaseError}
          onConfirm={handlePurchaseConfirm}
          onCancel={() => setConfirmTarget(null)}
        />
      )}
    </Modal>
  );
};

export default PointShopModal;

// ════════════════════════════════════════════════
// 공통 서브 컴포넌트 (유저/관리자 양쪽에서 export해서 사용)
// ════════════════════════════════════════════════

export const CoinIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
    fill="none" stroke="#f0b100" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M13.744 17.736a6 6 0 1 1-7.48-7.48"/>
    <path d="M15 6h1v4"/>
    <path d="m6.134 14.768.866-.5 2 3.464"/>
    <circle cx="16" cy="8" r="6"/>
  </svg>
);

export const SortFilterBar = ({ sort, filter, onSort, onFilter }) => (
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

export const EmoteCard = ({ emote, showBuy = false, onBuy }) => (
  <div className={`flex flex-col items-center rounded-xl border overflow-hidden transition-all
    ${emote.purchased
      ? 'border-border opacity-60 bg-muted/20'
      : 'border-border bg-surface hover:shadow-md hover:-translate-y-0.5'}`}
  >
    <div className="w-full aspect-square flex items-center justify-center p-3 bg-background">
      <img
        src={emote.imageUrl}
        alt={emote.name}
        className="w-full h-full object-contain"
        onError={e => { e.currentTarget.style.display = 'none'; }}
      />
    </div>
    <div className="w-full px-2 pb-2 pt-1 text-center space-y-1">
      <p className="text-xs text-foreground font-medium truncate">{emote.name}</p>
      <p className="text-xs font-bold text-yellow-500">{emote.price.toLocaleString()}P</p>
      {showBuy && (
        emote.purchased ? (
          <span className="block text-xs text-muted-foreground py-1">구매완료</span>
        ) : (
          <button
            onClick={onBuy}
            className="w-full text-xs py-1 rounded-md bg-primary text-primary-foreground font-medium hover:bg-primary-hover transition-colors"
          >
            구매
          </button>
        )
      )}
    </div>
  </div>
);

const HistoryBtn = ({ label, active, onClick }) => (
  <button
    onClick={onClick}
    className={`px-3 py-1.5 text-sm rounded-lg border transition-all
      ${active
        ? 'bg-primary text-primary-foreground border-primary'
        : 'border-border text-foreground hover:bg-primary hover:text-primary-foreground hover:border-primary'}`}
  >
    {label}
  </button>
);

const HistoryPanel = ({ type, data, loading, currentPage, totalPages, onPageChange, onClose }) => (
  <div className="bg-surface rounded-xl border border-border overflow-hidden">
    <div className="flex items-center justify-between px-4 py-3 border-b border-border">
      <span className="font-semibold text-foreground text-sm">
        {type === 'purchase' ? '구매 내역' : '포인트 내역'}
      </span>
      <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-xl leading-none">&times;</button>
    </div>

    {loading ? (
      <p className="py-6 text-center text-muted-foreground text-sm">불러오는 중...</p>
    ) : data.length === 0 ? (
      <p className="py-6 text-center text-muted-foreground text-sm">내역이 없습니다.</p>
    ) : (
      <div className="divide-y divide-border max-h-52 overflow-y-auto scrollbar-hide">
        {type === 'purchase'
          ? data.map(item => (
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
                  -{item.pricePaid.toLocaleString()}P
                </span>
                {item.pointBalance != null && (
                  <span className="text-xs text-blue-400">
                    잔여 포인트 {item.pointBalance.toLocaleString()}P
                  </span>
                )}
              </div>
            </div>
          ))
          : data.map((item, i) => (
            <div key={i} className="flex items-center justify-between px-4 py-2.5">
              <div>
                <p className="text-sm text-foreground">{item.description || '포인트 변동'}</p>
                <p className="text-xs text-muted-foreground">
                  {item.createdAt ? new Date(item.createdAt).toLocaleDateString('ko-KR') : ''}
                </p>
              </div>
              <span className={`text-sm font-semibold ${(item.pointChange ?? 0) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {(item.pointChange ?? 0) >= 0 ? '+' : ''}{(item.pointChange ?? 0).toLocaleString()}P
              </span>
            </div>
          ))
        }
      </div>
    )}

    {totalPages > 1 && (
      <div className="border-t border-border px-4 py-2">
        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={onPageChange} />
      </div>
    )}
  </div>
);

const PurchaseConfirmPopup = ({ emote, loading, error, onConfirm, onCancel }) => (
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
      </div>
      {error && <p className="text-red-500 text-xs text-center">{error}</p>}
      <div className="flex gap-2">
        <button onClick={onCancel}
          className="flex-1 py-2 rounded-xl border border-border text-foreground text-sm hover:bg-muted/10 transition-colors">
          취소
        </button>
        <button onClick={onConfirm} disabled={loading}
          className="flex-1 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary-hover transition-colors disabled:opacity-50">
          {loading ? '처리 중...' : '확인'}
        </button>
      </div>
    </div>
  </div>
);
