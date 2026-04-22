import React, { useState, useEffect, useCallback, useRef } from 'react';
import Modal from '../../components/common/Modal';
import Pagination from '../../components/common/Pagination';
import { SortFilterBar, EmoteCard } from './PointShopModal';
import jwtAxios from '../../api/jwtAxios';

const ACCEPTED_TYPES = '.jpg,.jpeg,.png,.gif,.webp,.clip,.csp,.psd,.psb';

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

  // ── 업로드 상태
  const [uploadFile, setUploadFile]       = useState(null);
  const [uploadPreview, setUploadPreview] = useState(null);
  const [uploadName, setUploadName]       = useState('');
  const [uploadPrice, setUploadPrice]     = useState('');
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadError, setUploadError]     = useState('');
  const fileInputRef = useRef(null);

  // ── 이모티콘 목록 fetch (관리자는 필터 없이 전체 조회)
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

  // ── 파일 선택
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadFile(file);
    setUploadError('');
    setUploadPreview(file.type.startsWith('image/') ? URL.createObjectURL(file) : null);
    if (!uploadName) setUploadName(file.name.replace(/\.[^.]+$/, ''));
  };

  // ── 이모티콘 등록 (S3 → DB)
  const handleUpload = async () => {
    if (!uploadFile || !uploadName.trim() || uploadPrice === '') {
      setUploadError('파일, 이름, 가격을 모두 입력해주세요.');
      return;
    }
    const price = Number(uploadPrice);
    if (isNaN(price) || price < 0) {
      setUploadError('올바른 가격을 입력해주세요.');
      return;
    }

    setUploadLoading(true);
    setUploadError('');
    try {
      // 1) presigned URL 발급
      const s3Res = await jwtAxios.get(
        `s3/presigned-url?filename=${encodeURIComponent(uploadFile.name)}`
      );
      const { presignedUrl, publicUrl } = s3Res.data;

      // 2) S3 직접 업로드
      await fetch(presignedUrl, {
        method: 'PUT',
        body: uploadFile,
        headers: { 'Content-Type': uploadFile.type || 'application/octet-stream' },
      });

      // 3) DB 등록
      await jwtAxios.post('shop/emotes', {
        name: uploadName.trim(),
        price,
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
      setUploadError(err?.response?.data?.message ?? '업로드 중 오류가 발생했습니다.');
    } finally {
      setUploadLoading(false);
    }
  };

  const handleClose = () => {
    setUploadFile(null);
    setUploadPreview(null);
    setUploadName('');
    setUploadPrice('');
    setUploadError('');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="🛍️ 포인트 샵 관리" maxWidth="max-w-[90vw]" maxHeight="max-h-[90vh]">
      <div className="flex gap-6 h-full">

        {/* ── 왼쪽: 이모티콘 등록 섹션 (50%) ── */}
        <div className="w-1/2 flex-shrink-0">
          <div className="bg-surface rounded-xl p-4 border border-border space-y-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              이모티콘 등록
            </p>

            <div className="flex gap-3 items-start">
              {/* 파일 선택 영역 */}
              <label className="flex-shrink-0 w-20 h-20 border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-primary transition-colors bg-background">
                {uploadPreview ? (
                  <img src={uploadPreview} alt="미리보기"
                    className="w-full h-full object-contain rounded-xl" />
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

              {/* 이름 / 가격 / 등록 */}
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
                  <button
                    onClick={handleUpload}
                    disabled={uploadLoading}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:bg-primary-hover transition-colors disabled:opacity-50 whitespace-nowrap"
                  >
                    {uploadLoading ? '등록 중...' : '등록'}
                  </button>
                </div>
              </div>
            </div>

            {uploadError && (
              <p className="text-red-500 text-xs">{uploadError}</p>
            )}
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
              <div className="grid grid-cols-3 gap-3">
                {emotes.map(emote => (
                  <EmoteCard key={emote.id} emote={emote} showBuy={false} />
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
