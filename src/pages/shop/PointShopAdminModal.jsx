import React, { useState, useEffect, useCallback, useRef } from 'react';
import Modal from '../../components/common/Modal';
import Pagination from '../../components/common/Pagination';
import { SortFilterBar } from './PointShopModal';
import jwtAxios from '../../api/jwtAxios';

const ACCEPTED_TYPES = '.jpg,.jpeg,.png';
const ALLOWED_MIME = ['image/jpeg', 'image/png'];

// ── 관리자용 이모티콘 카드 (hover → 블라인드 + 수정 버튼)
const AdminEmoteCard = ({ emote, onEdit, isEditing }) => (
  <div className={`flex flex-col items-center rounded-xl border overflow-hidden transition-all
    ${isEditing ? 'border-primary ring-2 ring-primary' : 'border-border bg-surface'}`}>
    <div className="relative w-full h-20 bg-background group cursor-pointer">
      <img
        src={emote.imageUrl}
        alt={emote.name}
        className="w-full h-full object-contain p-3"
        onError={e => { e.currentTarget.style.display = 'none'; }}
      />
      {/* hover 블라인드 + 수정 버튼 */}
      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
        <button
          onClick={() => onEdit(emote)}
          className="px-3 py-1.5 bg-white text-gray-900 rounded-lg text-xs font-semibold hover:bg-gray-100 transition-colors"
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
  // ── 이모티콘 목록
  const [emotes, setEmotes]           = useState([]);
  const [totalPages, setTotalPages]   = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [sort, setSort]               = useState('latest');
  const [loading, setLoading]         = useState(false);

  // ── 업로드/수정 공통 폼 상태
  const [uploadFile, setUploadFile]       = useState(null);
  const [uploadPreview, setUploadPreview] = useState(null);
  const [uploadName, setUploadName]       = useState('');
  const [uploadPrice, setUploadPrice]     = useState('');
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadError, setUploadError]     = useState('');
  const fileInputRef = useRef(null);

  // ── 수정 모드: null이면 등록 모드, emote 객체면 수정 모드
  const [editTarget, setEditTarget] = useState(null);

  // ── 이모티콘 목록 fetch
  const fetchEmotes = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ sort, page: currentPage, size: 9 });
      const res = await jwtAxios.get(`shop/emotes?${params}`);
      setEmotes(res.data.content ?? []);
      setTotalPages(res.data.totalPages ?? 0);
    } catch {
      setEmotes([]);
    } finally {
      setLoading(false);
    }
  }, [sort, currentPage]);

  useEffect(() => {
    if (isOpen) fetchEmotes();
  }, [isOpen, fetchEmotes]);

  const handleSortChange = (val) => { setSort(val); setCurrentPage(0); };

  // ── 폼 초기화
  const resetForm = () => {
    setUploadFile(null);
    setUploadPreview(null);
    setUploadName('');
    setUploadPrice('');
    setUploadError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // ── 파일 선택 (등록/수정 공통)
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

  // ── 유효성 검사 공통
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

  // ── S3 업로드 공통 (새 파일이 있을 때만)
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

  // ── 이모티콘 등록
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

  // ── 수정 모드 시작 (이모티콘 카드 수정 버튼 클릭)
  const handleEditStart = (emote) => {
    setEditTarget(emote);
    setUploadFile(null);
    setUploadPreview(emote.imageUrl); // 기존 이미지 미리보기
    setUploadName(emote.name);
    setUploadPrice(String(emote.price));
    setUploadError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // ── 수정 모드 취소
  const cancelEdit = () => {
    setEditTarget(null);
    resetForm();
  };

  // ── 이모티콘 수정 (이름/가격/이미지 중 하나 이상 변경)
  const handleUpdate = async () => {
    const price = validate();
    if (price === null) return;

    setUploadLoading(true);
    setUploadError('');
    try {
      // 새 파일이 있으면 S3 업로드, 없으면 기존 URL 유지
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
      fetchEmotes(); // DB에서 다시 불러와 화면 갱신
    } catch (err) {
      setUploadError(err?.response?.data?.message ?? '수정 중 오류가 발생했습니다.');
    } finally {
      setUploadLoading(false);
    }
  };

  const handleClose = () => {
    setEditTarget(null);
    resetForm();
    onClose();
  };

  const isEditMode = editTarget !== null;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="🛍️ 포인트 샵 관리" maxWidth="max-w-[55vw]" maxHeight="max-h-[70vh]">
      <div className="flex gap-6 h-full">

        {/* ── 왼쪽: 등록 / 수정 섹션 (50%) ── */}
        <div className="w-[40%] flex-shrink-0">
          <div className="bg-surface rounded-xl p-4 border border-border space-y-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              {isEditMode ? '이모티콘 수정' : '이모티콘 등록'}
            </p>

            <div className="flex gap-3 items-start">
              {/* 파일 선택 영역 */}
              <label className="flex-shrink-0 w-20 h-20 border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-primary transition-colors bg-background overflow-hidden">
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

              {/* 이름 / 가격 / 버튼 */}
              <div className="flex-1 space-y-2">
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
                        className="px-3 py-2 border border-border text-foreground rounded-lg text-sm hover:bg-muted/10 transition-colors whitespace-nowrap"
                      >
                        취소
                      </button>
                      <button
                        onClick={handleUpdate}
                        disabled={uploadLoading}
                        className="px-3 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:bg-primary-hover transition-colors disabled:opacity-50 whitespace-nowrap"
                      >
                        {uploadLoading ? '수정 중...' : '수정'}
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={handleUpload}
                      disabled={uploadLoading}
                      className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:bg-primary-hover transition-colors disabled:opacity-50 whitespace-nowrap"
                    >
                      {uploadLoading ? '등록 중...' : '등록'}
                    </button>
                  )}
                </div>
              </div>
            </div>

            {uploadError && <p className="text-red-500 text-xs">{uploadError}</p>}
          </div>
        </div>

        {/* ── 오른쪽: 이모티콘 목록 (50%) ── */}
        <div className="w-1/2 flex flex-col gap-3">
          <SortFilterBar sort={sort} filter={null} onSort={handleSortChange} onFilter={null} />

          {loading ? (
            <p className="text-center py-10 text-muted-foreground">불러오는 중...</p>
          ) : emotes.length === 0 ? (
            <p className="text-center py-10 text-muted-foreground">등록된 이모티콘이 없습니다.</p>
          ) : (
            <>
              <div className="grid grid-cols-3 gap-2">
                {emotes.map(emote => (
                  <AdminEmoteCard
                    key={emote.id}
                    emote={emote}
                    onEdit={handleEditStart}
                    isEditing={editTarget?.id === emote.id}
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

      </div>
    </Modal>
  );
};

export default PointShopAdminModal;
