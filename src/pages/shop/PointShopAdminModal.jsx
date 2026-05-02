import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import Modal from '../../components/common/Modal';
import Pagination from '../../components/common/Pagination';
import { SortDropdown } from './PointShopModal';
import jwtAxios from '../../api/jwtAxios';

const ACCEPTED_TYPES = '.jpg,.jpeg,.png';
const ALLOWED_MIME = ['image/jpeg', 'image/png'];

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

// 작업6: 카드 크기를 유저 EmoteCard와 동일하게 (h-[76px], p-1)
const AdminEmoteCard = ({ emote, onEdit, isEditing }) => (
  <div className={`w-[95%] mx-auto flex flex-col items-center rounded-xl border overflow-hidden transition-all
    ${isEditing ? 'border-primary ring-2 ring-primary' : 'border-border bg-surface'}`}>
    <div className="relative w-full h-[90px] bg-background group cursor-pointer">
      <img
        src={emote.imageUrl}
        alt={emote.name}
        className="w-full h-full object-contain p-1"
        onError={e => { e.currentTarget.style.display = 'none'; }}
      />
      <div
        onClick={() => onEdit(emote)}
        className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
      >
        <button
          onClick={e => { e.stopPropagation(); onEdit(emote); }}
          className="px-3 py-1.5 bg-white text-gray-900 rounded-lg text-xs font-semibold hover:bg-gray-100 transition-colors cursor-pointer"
        >
          수정
        </button>
      </div>
    </div>
    <div className="w-full px-2 pb-2 pt-1 text-center space-y-0.5">
      <p className="text-xs text-foreground font-medium truncate">{emote.name}</p>
      <p className="text-xs font-bold text-yellow-500">{emote.price.toLocaleString()}P</p>
    </div>
  </div>
);

// ────────────────────────────────────────────────
// 관리자 전용 포인트 샵 모달
// ────────────────────────────────────────────────
const PointShopAdminModal = ({ isOpen, onClose }) => {
  const [emotes, setEmotes]           = useState([]);
  const [totalPages, setTotalPages]   = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [sort, setSort]               = useState('latest');
  const [search, setSearch]           = useState('');
  const [inputValue, setInputValue]   = useState('');
  const [loading, setLoading]         = useState(false);
  const searchTimerRef = useRef(null);

  const [uploadFile, setUploadFile]       = useState(null);
  const [uploadPreview, setUploadPreview] = useState(null);
  const [uploadName, setUploadName]       = useState('');
  const [uploadPrice, setUploadPrice]     = useState('');
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadError, setUploadError]     = useState('');
  const fileInputRef = useRef(null);

  const [editTarget, setEditTarget] = useState(null);

  const fetchEmotes = useCallback(async () => {
    setLoading(true);
    try {
      const isSearching = search.trim().length > 0;
      const params = new URLSearchParams({
        sort,
        page: isSearching ? 0 : currentPage,
        size: isSearching ? 100 : 9,
      });
      const res = await jwtAxios.get(`shop/emotes?${params}`);
      setEmotes(res.data.content ?? []);
      setTotalPages(res.data.totalPages ?? 0);
    } catch {
      setEmotes([]);
    } finally {
      setLoading(false);
    }
  }, [sort, currentPage, search]);

  const filteredEmotes = useMemo(() => {
    const q = search.trim();
    if (!q) return emotes;
    return emotes.filter(e => matchesKorean(e.name, q));
  }, [emotes, search]);

  useEffect(() => {
    if (isOpen) fetchEmotes();
  }, [isOpen, fetchEmotes]);

  const handleSortChange = (val) => { setSort(val); setCurrentPage(0); };
  const handleSearchChange = (val) => {
    setInputValue(val);
    clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      setSearch(val);
      setCurrentPage(0);
    }, 300);
  };

  const resetForm = () => {
    setUploadFile(null);
    setUploadPreview(null);
    setUploadName('');
    setUploadPrice('');
    setUploadError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!ALLOWED_MIME.includes(file.type)) {
      setUploadError('이미지 파일 외의 파일은 올릴 수 없습니다.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }
    setUploadFile(file);
    setUploadError('');
    setUploadPreview(URL.createObjectURL(file));
    if (!uploadName) setUploadName(file.name.replace(/\.[^.]+$/, ''));
  };

  const validate = () => {
    if (!uploadName.trim() || uploadPrice === '') {
      setUploadError('이름과 가격을 입력해주세요.');
      return null;
    }
    const price = Number(uploadPrice);
    if (isNaN(price) || price < 0) {
      setUploadError('올바른 가격을 입력해주세요.');
      return null;
    }
    return price;
  };

  const uploadToS3 = async (file) => {
    const s3Res = await jwtAxios.get(`s3/presigned-url?filename=${encodeURIComponent(file.name)}`);
    const { presignedUrl, publicUrl } = s3Res.data;
    await fetch(presignedUrl, {
      method: 'PUT',
      body: file,
      headers: { 'Content-Type': file.type || 'application/octet-stream' },
    });
    return publicUrl;
  };

  const handleUpload = async () => {
    if (!uploadFile) {
      setUploadError('파일, 이름, 가격을 모두 입력해주세요.');
      return;
    }
    const price = validate();
    if (price === null) return;

    setUploadLoading(true);
    setUploadError('');
    try {
      const publicUrl = await uploadToS3(uploadFile);
      await jwtAxios.post('shop/emotes', { name: uploadName.trim(), price, imageUrl: publicUrl });
      resetForm();
      setCurrentPage(0);
      fetchEmotes();
    } catch (err) {
      setUploadError(err?.response?.data?.message ?? '업로드 중 오류가 발생했습니다.');
    } finally {
      setUploadLoading(false);
    }
  };

  const handleEditStart = (emote) => {
    setEditTarget(emote);
    setUploadFile(null);
    setUploadPreview(emote.imageUrl);
    setUploadName(emote.name);
    setUploadPrice(String(emote.price));
    setUploadError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const cancelEdit = () => {
    setEditTarget(null);
    resetForm();
  };

  const handleUpdate = async () => {
    const price = validate();
    if (price === null) return;

    setUploadLoading(true);
    setUploadError('');
    try {
      const imageUrl = uploadFile
        ? await uploadToS3(uploadFile)
        : editTarget.imageUrl;

      await jwtAxios.put(`shop/emotes/${editTarget.id}`, {
        name: uploadName.trim(),
        price,
        imageUrl,
      });

      setEditTarget(null);
      resetForm();
      fetchEmotes();
    } catch (err) {
      setUploadError(err?.response?.data?.message ?? '수정 중 오류가 발생했습니다.');
    } finally {
      setUploadLoading(false);
    }
  };

  const handleClose = () => {
    setEditTarget(null);
    setSearch('');
    setInputValue('');
    clearTimeout(searchTimerRef.current);
    resetForm();
    onClose();
  };

  const isEditMode = editTarget !== null;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="🛍️ 포인트 샵 관리" maxWidth="max-w-[1200px]" maxHeight="max-h-[650px]">
      <div className="flex gap-6 h-[540px]">

        {/* ── 왼쪽: 등록 / 수정 섹션 ── */}
        <div className="w-[40%] flex-shrink-0 h-full flex flex-col gap-3">
          {/* 드롭바 행 높이만큼 스페이서 → 등록창이 이모티콘 그리드와 수직 정렬 */}
          <div className="h-[34px] flex-shrink-0" />
          <div className="bg-surface rounded-xl p-4 border border-border space-y-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              {isEditMode ? '이모티콘 수정' : '이모티콘 등록'}
            </p>

            {/* 작업7: 파일 선택을 이름 입력 위로, 크기 30% 확대 */}
            <div className="space-y-3">
              <label className="w-[125px] h-[125px] border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-primary transition-colors bg-background overflow-hidden">
                {uploadPreview ? (
                  <img src={uploadPreview} alt="미리보기" className="w-full h-full object-contain" />
                ) : uploadFile ? (
                  <span className="text-xs text-muted-foreground text-center px-1 break-all leading-tight">
                    {uploadFile.name}
                  </span>
                ) : (
                  <>
                    <span className="text-2xl text-muted-foreground">+</span>
                    <span className="text-xs text-muted-foreground mt-0.5">파일 선택</span>
                  </>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={ACCEPTED_TYPES}
                  className="hidden"
                  onChange={handleFileChange}
                />
              </label>

              <input
                type="text"
                placeholder="이모티콘 이름"
                value={uploadName}
                onChange={e => setUploadName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder="가격 (포인트)"
                  value={uploadPrice}
                  onChange={e => setUploadPrice(e.target.value)}
                  min={0}
                  className="flex-1 px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                />
                {isEditMode ? (
                  <div className="flex gap-1">
                    <button
                      onClick={cancelEdit}
                      className="px-3 py-2 border border-border text-foreground rounded-lg text-sm hover:bg-muted/10 transition-colors whitespace-nowrap cursor-pointer"
                    >
                      취소
                    </button>
                    <button
                      onClick={handleUpdate}
                      disabled={uploadLoading}
                      className="px-3 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:bg-primary-hover transition-colors disabled:opacity-50 whitespace-nowrap cursor-pointer disabled:cursor-not-allowed"
                    >
                      {uploadLoading ? '수정 중...' : '수정'}
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={handleUpload}
                    disabled={uploadLoading}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:bg-primary-hover transition-colors disabled:opacity-50 whitespace-nowrap cursor-pointer disabled:cursor-not-allowed"
                  >
                    {uploadLoading ? '등록 중...' : '등록'}
                  </button>
                )}
              </div>
            </div>

            {uploadError && <p className="text-red-500 text-xs">{uploadError}</p>}
          </div>
        </div>

        {/* ── 오른쪽: 이모티콘 목록 ── */}
        <div className="flex-1 flex flex-col gap-3 h-full">
          {/* 작업6: 정렬 드롭다운 */}
          <div className="flex gap-2 items-center flex-shrink-0">
            <SortDropdown sort={sort} onSort={handleSortChange} />
            <input
              type="text"
              value={inputValue}
              onChange={e => handleSearchChange(e.target.value)}
              placeholder="이모티콘 검색..."
              className="w-[500px] px-3 py-1.5 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div className="flex-1 min-h-0 overflow-hidden pt-1">
            {loading ? (
              <p className="text-center py-10 text-muted-foreground">불러오는 중...</p>
            ) : filteredEmotes.length === 0 ? (
              <p className="text-center py-10 text-muted-foreground">등록된 이모티콘이 없습니다.</p>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {filteredEmotes.map(emote => (
                  <AdminEmoteCard
                    key={emote.id}
                    emote={emote}
                    onEdit={handleEditStart}
                    isEditing={editTarget?.id === emote.id}
                  />
                ))}
              </div>
            )}
          </div>

          {!search.trim() && (
            <div className="flex-shrink-0 [&_nav]:mt-3">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            </div>
          )}
        </div>

      </div>
    </Modal>
  );
};

export default PointShopAdminModal;
