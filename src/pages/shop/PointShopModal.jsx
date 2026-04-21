import React, { useState, useEffect, useCallback, useRef } from 'react';
import Modal from '../../components/common/Modal';
import Pagination from '../../components/common/Pagination';
import { useAuth } from '../../components/sidebar/AuthContext';
import jwtAxios from '../../api/jwtAxios';

const SORT_OPTIONS = [
  { value: 'latest',      label: '최신순' },
  { value: 'oldest',      label: '오래된 순' },
  { value: 'priceAsc',    label: '가격 낮은 순' },
  { value: 'priceDesc',   label: '가격 높은 순' },
];

const FILTER_OPTIONS = [
  { value: 'all',          label: '전체' },
  { value: 'purchased',    label: '구매한 상품' },
  { value: 'unpurchased',  label: '미구매 상품' },
];

const ACCEPTED_IMAGE_TYPES = '.jpg,.jpeg,.png,.gif,.webp,.clip,.csp,.psd,.psb';

const PointShopModal = ({ isOpen, onClose }) => {
  const { currentUser } = useAuth();
  const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'ADMIN';

  // 이모티콘 목록 상태
  const [emotes, setEmotes]           = useState([]);
  const [totalPages, setTotalPages]   = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [sort, setSort]               = useState('latest');
  const [filter, setFilter]           = useState('all');
  const [loading, setLoading]         = useState(false);

  // 유저 포인트 상태
  const [userPoints, setUserPoints]   = useState(null);

  // 관리자 업로드 상태
  const [uploadFile, setUploadFile]   = useState(null);
  const [uploadPreview, setUploadPreview] = useState(null);
  const [uploadName, setUploadName]   = useState('');
  const [uploadPrice, setUploadPrice] = useState('');
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const fileInputRef = useRef(null);

  // 구매 확인 팝업 상태
  const [confirmTarget, setConfirmTarget] = useState(null);
  const [purchaseLoading, setPurchaseLoading] = useState(false);
  const [purchaseError, setPurchaseError] = useState('');

  // 내역 패널 상태 (null | 'point' | 'purchase')
  const [historyPanel, setHistoryPanel] = useState(null);
  const [historyData, setHistoryData]   = useState([]);
  const [historyPage, setHistoryPage]   = useState(0);
  const [historyTotalPages, setHistoryTotalPages] = useState(0);
  const [historyLoading, setHistoryLoading] = useState(false);

  const fetchEmotes = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        sort,
        page: currentPage,
        size: 9,
        purchasedOnly: filter === 'purchased',
        unpurchasedOnly: filter === 'unpurchased',
      });
      const res = await jwtAxios.get(`shop/emotes?${params}`);
      setEmotes(res.data.content);
      setTotalPages(res.data.totalPages);
    } catch {
      setEmotes([]);
    } finally {
      setLoading(false);
    }
  }, [sort, filter, currentPage]);

  const fetchUserPoints = useCallback(async () => {
    if (!currentUser || isAdmin) return;
    try {
      const res = await jwtAxios.get('shop/my-points');
      setUserPoints(res.data.points);
    } catch {
      setUserPoints(null);
    }
  }, [currentUser, isAdmin]);

  useEffect(() => {
    if (isOpen) {
      fetchEmotes();
      fetchUserPoints();
    }
  }, [isOpen, fetchEmotes, fetchUserPoints]);

  // 필터/정렬 변경 시 첫 페이지로 리셋
  const handleSortChange = (val) => { setSort(val); setCurrentPage(0); };
  const handleFilterChange = (val) => { setFilter(val); setCurrentPage(0); };

  // ─────────────────── 관리자 업로드 ───────────────────
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadFile(file);
    setUploadError('');
    if (file.type.startsWith('image/')) {
      setUploadPreview(URL.createObjectURL(file));
    } else {
      setUploadPreview(null);
    }
    if (!uploadName) {
      setUploadName(file.name.replace(/\.[^.]+$/, ''));
    }
  };

  const handleUploadSubmit = async () => {
    if (!uploadFile || !uploadName.trim() || !uploadPrice) {
      setUploadError('이름, 파일, 가격을 모두 입력해주세요.');
      return;
    }
    if (isNaN(Number(uploadPrice)) || Number(uploadPrice) < 0) {
      setUploadError('올바른 가격을 입력해주세요.');
      return;
    }

    setUploadLoading(true);
    setUploadError('');
    try {
      // 1) S3 presigned URL 발급
      const s3Res = await jwtAxios.get(`s3/presigned-url?filename=${encodeURIComponent(uploadFile.name)}`);
      const { presignedUrl, publicUrl } = s3Res.data;

      // 2) S3에 직접 업로드
      await fetch(presignedUrl, {
        method: 'PUT',
        body: uploadFile,
        headers: { 'Content-Type': uploadFile.type || 'application/octet-stream' },
      });

      // 3) 백엔드에 이모티콘 등록
      await jwtAxios.post('shop/emotes', {
        name: uploadName.trim(),
        price: Number(uploadPrice),
        imageUrl: publicUrl,
      });

      // 초기화
      setUploadFile(null);
      setUploadPreview(null);
      setUploadName('');
      setUploadPrice('');
      if (fileInputRef.current) fileInputRef.current.value = '';
      setCurrentPage(0);
      fetchEmotes();
    } catch (err) {
      setUploadError(err?.response?.data?.message || '업로드 중 오류가 발생했습니다.');
    } finally {
      setUploadLoading(false);
    }
  };

  // ─────────────────── 구매 처리 ───────────────────
  const openConfirm = (emote) => {
    setConfirmTarget(emote);
    setPurchaseError('');
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
    } catch (err) {
      setPurchaseError(err?.response?.data?.message || '구매 중 오류가 발생했습니다.');
    } finally {
      setPurchaseLoading(false);
    }
  };

  // ─────────────────── 내역 패널 ───────────────────
  const openHistory = async (type) => {
    setHistoryPanel(type);
    setHistoryPage(0);
    setHistoryData([]);
    setHistoryTotalPages(0);
    await fetchHistory(type, 0);
  };

  const fetchHistory = async (type, page) => {
    setHistoryLoading(true);
    try {
      const endpoint = type === 'purchase' ? 'shop/purchase-history' : 'shop/point-history';
      const res = await jwtAxios.get(`${endpoint}?page=${page}&size=10`);
      setHistoryData(res.data.content || []);
      setHistoryTotalPages(res.data.totalPages || 0);
      setHistoryPage(page);
    } catch {
      setHistoryData([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleHistoryPageChange = (page) => fetchHistory(historyPanel, page);

  const handleModalClose = () => {
    setHistoryPanel(null);
    setConfirmTarget(null);
    setUploadFile(null);
    setUploadPreview(null);
    setUploadName('');
    setUploadPrice('');
    setUploadError('');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleModalClose} title="🛍️ 포인트 샵">
      <div className="space-y-5">

        {/* ── 상단 정보 영역 ── */}
        {isAdmin ? <AdminUploadSection
          uploadFile={uploadFile}
          uploadPreview={uploadPreview}
          uploadName={uploadName}
          uploadPrice={uploadPrice}
          uploadLoading={uploadLoading}
          uploadError={uploadError}
          fileInputRef={fileInputRef}
          onFileChange={handleFileChange}
          onNameChange={setUploadName}
          onPriceChange={setUploadPrice}
          onSubmit={handleUploadSubmit}
        /> : <UserInfoSection
          currentUser={currentUser}
          userPoints={userPoints}
          onPointHistory={() => openHistory('point')}
          onPurchaseHistory={() => openHistory('purchase')}
        />}

        {/* ── 내역 패널 ── */}
        {historyPanel && (
          <HistoryPanel
            type={historyPanel}
            data={historyData}
            loading={historyLoading}
            currentPage={historyPage}
            totalPages={historyTotalPages}
            onPageChange={handleHistoryPageChange}
            onClose={() => setHistoryPanel(null)}
          />
        )}

        {/* ── 정렬 / 필터 ── */}
        <div className="space-y-2">
          <div className="flex flex-wrap gap-2">
            {SORT_OPTIONS.map(o => (
              <button key={o.value}
                onClick={() => handleSortChange(o.value)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors
                  ${sort === o.value
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-background border-border text-foreground hover:bg-muted/10'}`}
              >
                {o.label}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            {FILTER_OPTIONS.map(o => (
              <button key={o.value}
                onClick={() => handleFilterChange(o.value)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors
                  ${filter === o.value
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-background border-border text-foreground hover:bg-muted/10'}`}
              >
                {o.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── 이모티콘 그리드 ── */}
        {loading ? (
          <div className="flex justify-center py-10 text-muted-foreground">불러오는 중...</div>
        ) : emotes.length === 0 ? (
          <div className="flex justify-center py-10 text-muted-foreground">이모티콘이 없습니다.</div>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-3">
              {emotes.map(emote => (
                <EmoteCard
                  key={emote.id}
                  emote={emote}
                  isAdmin={isAdmin}
                  onBuy={() => openConfirm(emote)}
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

// ──────────────────────────── 하위 컴포넌트 ────────────────────────────

const AdminUploadSection = ({
  uploadFile, uploadPreview, uploadName, uploadPrice,
  uploadLoading, uploadError, fileInputRef,
  onFileChange, onNameChange, onPriceChange, onSubmit,
}) => (
  <div className="bg-surface rounded-xl p-4 border border-border space-y-3">
    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">관리자 전용 · 이모티콘 등록</p>

    <div className="flex gap-3 items-start">
      <label className="flex-shrink-0 w-20 h-20 border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-primary transition-colors bg-background">
        {uploadPreview ? (
          <img src={uploadPreview} alt="preview" className="w-full h-full object-contain rounded-xl" />
        ) : uploadFile ? (
          <span className="text-xs text-muted-foreground text-center px-1 break-all">{uploadFile.name}</span>
        ) : (
          <>
            <span className="text-2xl text-muted-foreground">+</span>
            <span className="text-xs text-muted-foreground mt-1">이미지</span>
          </>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPTED_IMAGE_TYPES}
          className="hidden"
          onChange={onFileChange}
        />
      </label>

      <div className="flex-1 space-y-2">
        <input
          type="text"
          placeholder="이모티콘 이름"
          value={uploadName}
          onChange={e => onNameChange(e.target.value)}
          className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary"
        />
        <div className="flex gap-2">
          <input
            type="number"
            placeholder="가격 (포인트)"
            value={uploadPrice}
            onChange={e => onPriceChange(e.target.value)}
            min={0}
            className="flex-1 px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <button
            onClick={onSubmit}
            disabled={uploadLoading}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:bg-primary-hover transition-colors disabled:opacity-50"
          >
            {uploadLoading ? '등록 중...' : '등록'}
          </button>
        </div>
      </div>
    </div>

    {uploadError && <p className="text-red-500 text-xs">{uploadError}</p>}
  </div>
);

const UserInfoSection = ({ currentUser, userPoints, onPointHistory, onPurchaseHistory }) => (
  <div className="bg-surface rounded-xl p-4 border border-border">
    <div className="flex items-center justify-between">
      <div>
        <p className="font-semibold text-foreground">{currentUser?.nickname || currentUser?.username}</p>
        <div className="flex items-center gap-1.5 mt-1">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
            fill="none" stroke="#f0b100" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M13.744 17.736a6 6 0 1 1-7.48-7.48"/>
            <path d="M15 6h1v4"/><path d="m6.134 14.768.866-.5 2 3.464"/>
            <circle cx="16" cy="8" r="6"/>
          </svg>
          <span className="font-bold text-foreground">
            {userPoints !== null ? userPoints.toLocaleString() : '...'}
          </span>
          <span className="text-sm text-muted-foreground">포인트</span>
        </div>
      </div>
      <div className="flex gap-2">
        <button
          onClick={onPointHistory}
          className="px-3 py-1.5 text-sm rounded-lg border border-border text-foreground hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all"
        >
          포인트 내역
        </button>
        <button
          onClick={onPurchaseHistory}
          className="px-3 py-1.5 text-sm rounded-lg border border-border text-foreground hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all"
        >
          구매내역
        </button>
      </div>
    </div>
  </div>
);

const HistoryPanel = ({ type, data, loading, currentPage, totalPages, onPageChange, onClose }) => {
  const title = type === 'purchase' ? '구매 내역' : '포인트 내역';

  return (
    <div className="bg-surface rounded-xl border border-border overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <span className="font-semibold text-foreground text-sm">{title}</span>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-lg leading-none">&times;</button>
      </div>

      {loading ? (
        <div className="py-6 text-center text-muted-foreground text-sm">불러오는 중...</div>
      ) : data.length === 0 ? (
        <div className="py-6 text-center text-muted-foreground text-sm">내역이 없습니다.</div>
      ) : (
        <div className="divide-y divide-border max-h-52 overflow-y-auto scrollbar-hide">
          {type === 'purchase' ? data.map(item => (
            <div key={item.inventoryId} className="flex items-center gap-3 px-4 py-2.5">
              <img src={item.emoteImageUrl} alt={item.emoteName}
                className="w-9 h-9 object-contain rounded-lg border border-border bg-background" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{item.emoteName}</p>
                <p className="text-xs text-muted-foreground">{new Date(item.purchasedAt).toLocaleDateString('ko-KR')}</p>
              </div>
              <span className="text-sm font-semibold text-foreground">-{item.pricePaid.toLocaleString()}P</span>
            </div>
          )) : data.map((item, i) => (
            <div key={i} className="flex items-center justify-between px-4 py-2.5">
              <div>
                <p className="text-sm text-foreground">{item.description || '포인트 변동'}</p>
                <p className="text-xs text-muted-foreground">{item.createdAt ? new Date(item.createdAt).toLocaleDateString('ko-KR') : ''}</p>
              </div>
              <span className={`text-sm font-semibold ${item.pointChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {item.pointChange >= 0 ? '+' : ''}{item.pointChange?.toLocaleString()}P
              </span>
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="border-t border-border px-4 py-2">
          <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={onPageChange} />
        </div>
      )}
    </div>
  );
};

const EmoteCard = ({ emote, isAdmin, onBuy }) => (
  <div className={`flex flex-col items-center rounded-xl border overflow-hidden transition-all
    ${emote.purchased ? 'border-border opacity-60 bg-muted/20' : 'border-border bg-surface hover:shadow-md hover:-translate-y-0.5'}`}
  >
    <div className="w-full aspect-square flex items-center justify-center p-3 bg-background">
      <img
        src={emote.imageUrl}
        alt={emote.name}
        className="w-full h-full object-contain"
        onError={e => { e.target.style.display = 'none'; }}
      />
    </div>
    <div className="w-full px-2 pb-2 pt-1 text-center space-y-1">
      <p className="text-xs text-foreground font-medium truncate">{emote.name}</p>
      <p className="text-xs font-bold text-yellow-500">{emote.price.toLocaleString()}P</p>
      {!isAdmin && (
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

const PurchaseConfirmPopup = ({ emote, loading, error, onConfirm, onCancel }) => (
  <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40">
    <div className="bg-background border border-border rounded-2xl p-6 shadow-2xl w-72 space-y-4">
      <div className="text-center space-y-2">
        <img src={emote.imageUrl} alt={emote.name}
          className="w-16 h-16 object-contain mx-auto rounded-xl border border-border" />
        <p className="font-semibold text-foreground">{emote.name}</p>
        <p className="text-sm text-muted-foreground">
          <span className="font-bold text-yellow-500">{emote.price.toLocaleString()}P</span>로 구매하시겠습니까?
        </p>
      </div>
      {error && <p className="text-red-500 text-xs text-center">{error}</p>}
      <div className="flex gap-2">
        <button
          onClick={onCancel}
          className="flex-1 py-2 rounded-xl border border-border text-foreground text-sm hover:bg-muted/10 transition-colors"
        >
          취소
        </button>
        <button
          onClick={onConfirm}
          disabled={loading}
          className="flex-1 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary-hover transition-colors disabled:opacity-50"
        >
          {loading ? '처리 중...' : '확인'}
        </button>
      </div>
    </div>
  </div>
);

export default PointShopModal;
