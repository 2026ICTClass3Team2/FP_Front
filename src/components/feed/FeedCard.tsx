import React, { useState, useRef, useEffect, useCallback } from 'react';
import axios from 'axios';
import jwtAxios from '../../api/jwtAxios';
import { FiImage, FiX, FiSearch, FiChevronDown } from 'react-icons/fi';
import { Post } from './PostCard';
import RichTextEditor from '../editor/RichTextEditor';
import TechStackModal from '../auth/TechStackModal';
import DraftListModal from '../common/DraftListModal';

interface ChannelOption {
  channelId: number;
  name: string;
  imageUrl?: string | null;
}

interface FeedCardProps {
  onClose: () => void;
  onPostCreated?: () => void;
  postToEdit?: Post | null;
  initialChannel?: ChannelOption | null;
}

const FeedCard: React.FC<FeedCardProps> = ({ onClose, onPostCreated, postToEdit, initialChannel }) => {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [selectedTechStacks, setSelectedTechStacks] = useState<string[]>([]);
  const [isTechStackModalOpen, setIsTechStackModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 채널 선택
  const [selectedChannel, setSelectedChannel] = useState<ChannelOption | null>(null);
  const [channelSearch, setChannelSearch] = useState('');
  const [channelResults, setChannelResults] = useState<ChannelOption[]>([]);
  const [showChannelDropdown, setShowChannelDropdown] = useState(false);
  const [channelSearchLoading, setChannelSearchLoading] = useState(false);
  const channelDropdownRef = useRef<HTMLDivElement>(null);
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 임시저장 — ref로 관리해서 stale closure 방지
  const currentDraftIdRef = useRef<number | null>(null);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [isDraftModalOpen, setIsDraftModalOpen] = useState(false);
  const draftTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 초기값 세팅
  useEffect(() => {
    if (postToEdit) {
      setTitle(postToEdit.title || '');
      setBody(postToEdit.body || '');
      setSelectedTechStacks(postToEdit.tags || []);
      setThumbnailUrl(postToEdit.thumbnailUrl || '');
      if (postToEdit.channelId && postToEdit.channelName) {
        setSelectedChannel({
          channelId: postToEdit.channelId as number,
          name: postToEdit.channelName,
          imageUrl: (postToEdit as any).channelImageUrl ?? null,
        });
      }
    } else if (initialChannel) {
      setSelectedChannel(initialChannel);
    }
  }, []);

  // 드롭다운 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (channelDropdownRef.current && !channelDropdownRef.current.contains(e.target as Node)) {
        setShowChannelDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 채널 검색 (debounce 300ms)
  const searchChannels = useCallback(async (keyword: string) => {
    setChannelSearchLoading(true);
    try {
      const res = await jwtAxios.get('channels/search', { params: { keyword, size: 8 } });
      setChannelResults(res.data || []);
    } catch {
      setChannelResults([]);
    } finally {
      setChannelSearchLoading(false);
    }
  }, []);

  const handleChannelSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setChannelSearch(val);
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(() => searchChannels(val), 300);
  };

  const handleChannelDropdownOpen = () => {
    setShowChannelDropdown(true);
    setChannelSearch('');
    searchChannels('');
  };

  const handleSelectChannel = (ch: ChannelOption) => {
    setSelectedChannel(ch);
    setShowChannelDropdown(false);
    setChannelSearch('');
  };

  // 자동 임시저장 — currentDraftIdRef로 항상 최신값 참조
  const autoSaveDraft = async (t: string, b: string, stacks: string[], ch: ChannelOption | null) => {
    if (postToEdit) return;
    const isBlank = !t.trim() && b.replace(/<(.|\n)*?>/g, '').trim().length === 0;
    if (isBlank) return;

    try {
      const payload = {
        title: t,
        body: b,
        targetType: 'feed',
        channelId: ch?.channelId ?? null,
        tags: stacks,
      };
      if (currentDraftIdRef.current) {
        await jwtAxios.put(`drafts/${currentDraftIdRef.current}`, payload);
      } else {
        const res = await jwtAxios.post('drafts', payload);
        currentDraftIdRef.current = res.data.draftId;
      }
      const now = new Date();
      setLastSavedAt(`${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`);
    } catch {
      // 자동저장 실패는 무시
    }
  };

  // 최신 상태를 ref로 유지해서 타이머 콜백에서 안전하게 참조
  const latestValuesRef = useRef({ title, body, selectedTechStacks, selectedChannel });
  useEffect(() => {
    latestValuesRef.current = { title, body, selectedTechStacks, selectedChannel };
  });

  // 3초 디바운스 자동 저장
  useEffect(() => {
    if (postToEdit) return;
    if (draftTimerRef.current) clearTimeout(draftTimerRef.current);
    draftTimerRef.current = setTimeout(() => {
      const { title: t, body: b, selectedTechStacks: s, selectedChannel: ch } = latestValuesRef.current;
      autoSaveDraft(t, b, s, ch);
    }, 3000);
    return () => { if (draftTimerRef.current) clearTimeout(draftTimerRef.current); };
  }, [title, body, selectedTechStacks, selectedChannel]);

  // 임시저장 불러오기
  const handleLoadDraft = (draft: any) => {
    setTitle(draft.title || '');
    setBody(draft.body || '');
    setSelectedTechStacks(draft.tags || []);
    currentDraftIdRef.current = draft.draftId;
    setLastSavedAt(draft.createdAt ? draft.createdAt.slice(11, 16) : null);
    if (draft.channelId) {
      setSelectedChannel({ channelId: draft.channelId, name: '채널 로딩 중...' });
      jwtAxios.get(`channels/${draft.channelId}`).then(res => {
        setSelectedChannel({
          channelId: draft.channelId,
          name: res.data.channelName || res.data.name || '',
          imageUrl: res.data.imageUrl,
        });
      }).catch(() => {
        setSelectedChannel(null);
      });
    }
  };

  // S3 업로드
  const uploadToS3 = async (file: File): Promise<string> => {
    const presignedRes = await jwtAxios.get('s3/presigned-url', { params: { filename: file.name } });
    const { presignedUrl, publicUrl } = presignedRes.data;
    await axios.put(presignedUrl, file, { headers: { 'Content-Type': file.type } });
    return publicUrl;
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      setThumbnailUrl(await uploadToS3(file));
    } catch {
      alert('파일 업로드에 실패했습니다.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const isBodyEmpty = body.replace(/<(.|\n)*?>/g, '').trim().length === 0 && !body.includes('<img');
    if (!title.trim() || isBodyEmpty) {
      setError('제목과 본문을 입력해주세요.');
      return;
    }
    if (!selectedChannel) {
      setError('채널을 선택해주세요.');
      return;
    }

    setLoading(true);
    setError('');

    const postData = { title, body, tags: selectedTechStacks, thumbnailUrl, channelId: selectedChannel.channelId };

    try {
      if (postToEdit) {
        await jwtAxios.put(`posts/${postToEdit.postId}`, postData);
        alert('게시글이 성공적으로 수정되었습니다.');
      } else {
        await jwtAxios.post('posts', { ...postData, contentType: 'feed' });
        if (currentDraftIdRef.current) {
          jwtAxios.delete(`drafts/${currentDraftIdRef.current}`).catch(() => {});
        }
        alert('게시글이 성공적으로 작성되었습니다.');
      }
      onClose();
      if (onPostCreated) onPostCreated();
    } catch (err: any) {
      setError(err.response?.data?.message || '게시글 작성 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <DraftListModal
        isOpen={isDraftModalOpen}
        onClose={() => setIsDraftModalOpen(false)}
        targetType="feed"
        onLoad={handleLoadDraft}
      />
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">

        {/* 임시저장 툴바 — 새 글 작성 모드만 */}
        {!postToEdit && (
          <div className="flex items-center justify-between py-1">
            <button
              type="button"
              onClick={() => setIsDraftModalOpen(true)}
              className="cursor-pointer flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24"
                fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
                <polyline points="10 9 9 9 8 9"/>
              </svg>
              임시저장 목록
            </button>
            {lastSavedAt && (
              <span className="text-[11px] text-muted-foreground/70">
                자동 저장됨 {lastSavedAt}
              </span>
            )}
          </div>
        )}

        {error && <div className="text-red-500 text-sm font-medium">{error}</div>}

        {/* 채널 선택 */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-gray-800 dark:text-gray-200">채널 <span className="text-red-500">*</span></label>
          <div className="relative" ref={channelDropdownRef}>
            {selectedChannel ? (
              <div className="flex items-center justify-between px-3 py-2.5 border border-gray-300 dark:border-gray-700 rounded-xl bg-white dark:bg-slate-800">
                <div className="flex items-center gap-2">
                  {selectedChannel.imageUrl ? (
                    <img src={selectedChannel.imageUrl} alt={selectedChannel.name} className="w-6 h-6 rounded object-cover flex-shrink-0" />
                  ) : (
                    <div className="w-6 h-6 rounded bg-primary/20 flex items-center justify-center flex-shrink-0 text-[10px] font-bold text-primary">
                      {selectedChannel.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{selectedChannel.name}</span>
                </div>
                <button
                  type="button"
                  onClick={() => { setSelectedChannel(null); handleChannelDropdownOpen(); }}
                  className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-full transition-colors"
                >
                  <FiX size={14} />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleChannelDropdownOpen}
                className="w-full flex items-center justify-between px-3 py-2.5 border border-gray-300 dark:border-gray-700 rounded-xl bg-white dark:bg-slate-800 text-left hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
              >
                <span className="text-sm text-gray-400 dark:text-gray-500">채널을 선택하세요...</span>
                <FiChevronDown size={16} className="text-gray-400" />
              </button>
            )}

            {showChannelDropdown && (
              <div className="absolute left-0 right-0 top-full mt-1 z-50 bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg overflow-hidden">
                <div className="p-2 border-b border-gray-100 dark:border-gray-700">
                  <div className="flex items-center gap-2 px-2 py-1.5 bg-gray-50 dark:bg-slate-700 rounded-lg">
                    <FiSearch size={14} className="text-gray-400 flex-shrink-0" />
                    <input
                      type="text"
                      value={channelSearch}
                      onChange={handleChannelSearchChange}
                      placeholder="채널 검색..."
                      autoFocus
                      className="flex-1 text-sm bg-transparent outline-none text-gray-800 dark:text-gray-100 placeholder-gray-400"
                    />
                  </div>
                </div>
                <div className="max-h-48 overflow-y-auto">
                  {channelSearchLoading ? (
                    <div className="flex justify-center py-4">
                      <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    </div>
                  ) : channelResults.length === 0 ? (
                    <p className="text-center text-sm text-gray-400 py-4">채널이 없습니다.</p>
                  ) : (
                    channelResults.map(ch => (
                      <button
                        key={ch.channelId}
                        type="button"
                        onClick={() => handleSelectChannel(ch)}
                        className="w-full flex items-center gap-2.5 px-3 py-2.5 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors text-left"
                      >
                        {ch.imageUrl ? (
                          <img src={ch.imageUrl} alt={ch.name} className="w-7 h-7 rounded object-cover flex-shrink-0" />
                        ) : (
                          <div className="w-7 h-7 rounded bg-primary/20 flex items-center justify-center flex-shrink-0 text-xs font-bold text-primary">
                            {ch.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <span className="text-sm font-medium text-gray-800 dark:text-gray-100">{ch.name}</span>
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-gray-800 dark:text-gray-200">제목</label>
          <input
            type="text" value={title} onChange={(e) => setTitle(e.target.value)}
            placeholder="게시글 제목을 입력하세요."
            maxLength={250}
            className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-xl bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
            required />
          <div className={`text-right text-xs mt-0.5 ${title.length >= 250 ? 'text-red-500 font-medium' : title.length >= 225 ? 'text-orange-400' : 'text-muted-foreground'}`}>
            {title.length} / 250
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-gray-800 dark:text-gray-200">본문</label>
          <RichTextEditor
            value={body}
            onChange={setBody}
            placeholder="내용을 입력하세요..."
            readOnly={loading}
            onImageUpload={uploadToS3}
            maxChars={50000}
            className="rounded-xl transition-shadow shadow-sm mt-1"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-semibold text-foreground">기술스택 (최대 5개)</label>
          <button
            type="button"
            onClick={() => setIsTechStackModalOpen(true)}
            className="flex flex-wrap items-center gap-1.5 w-full min-h-[46px] px-3 py-2 border border-border rounded-xl bg-background text-left hover:bg-muted/30 transition-colors"
          >
            {selectedTechStacks.length > 0 ? (
              <>
                {selectedTechStacks.map(tag => (
                  <span key={tag} className="flex items-center gap-1 px-2.5 py-1 bg-primary/10 text-primary text-xs font-semibold rounded-lg">
                    {tag}
                    <button type="button" onClick={(e) => { e.stopPropagation(); setSelectedTechStacks(prev => prev.filter((t: string) => t !== tag)); }} className="flex items-center justify-center w-3.5 h-3.5 rounded-full hover:bg-primary/30 transition-colors shrink-0"><svg xmlns="http://www.w3.org/2000/svg" width="8" height="8" viewBox="0 0 10 10" fill="currentColor"><path d="M1 1l8 8M9 1l-8 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg></button>
                  </span>
                ))}
                <span className="text-xs text-muted-foreground ml-1">클릭하여 수정</span>
              </>
            ) : (
              <span className="text-sm text-muted-foreground">관련된 기술 스택을 선택해 주세요.</span>
            )}
          </button>
          <TechStackModal
            isOpen={isTechStackModalOpen}
            onClose={() => setIsTechStackModalOpen(false)}
            selectedTechStack={selectedTechStacks}
            onConfirm={(tags: string[]) => setSelectedTechStacks(tags)}
          />
        </div>

        {/* 썸네일 이미지 */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-gray-800 dark:text-gray-200">썸네일 이미지</label>
          <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
          {!thumbnailUrl && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="w-full flex items-center justify-center gap-2 px-4 py-8 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-slate-800/50 text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
            >
              <FiImage size={24} />
              <span className="text-sm font-medium">{isUploading ? '업로드 중...' : '클릭하여 이미지 업로드'}</span>
            </button>
          )}
          {thumbnailUrl && (
            <div className="relative w-full rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 mt-2">
              <img src={thumbnailUrl} alt="Thumbnail Preview" className="w-full h-auto object-cover max-h-64" />
              <button
                type="button"
                onClick={() => setThumbnailUrl('')}
                className="absolute top-2 right-2 p-1.5 bg-black/50 hover:bg-black/70 text-white rounded-full transition-colors backdrop-blur-sm"
              >
                <FiX size={16} />
              </button>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 mt-4">
          <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl text-sm font-medium transition-colors">취소</button>
          <button type="submit" disabled={loading} className="px-4 py-2 bg-blue-500 text-white rounded-xl text-sm font-bold hover:bg-blue-600 disabled:opacity-50 transition-colors shadow-md hover:shadow-lg">
            {loading ? '처리 중...' : postToEdit ? '수정 완료' : '작성 완료'}
          </button>
        </div>
      </form>
    </>
  );
};

export default FeedCard;
