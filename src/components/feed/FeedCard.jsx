import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import jwtAxios from '../../api/jwtAxios';
import TechStackModal from '../auth/TechStackModal';
import RichTextEditor from '../editor/RichTextEditor';
import { FiImage, FiX } from 'react-icons/fi';
import DraftListModal from '../common/DraftListModal';
import SaveToast from '../common/SaveToast';

const FeedCard = ({ postToEdit, onClose, onPostCreated, initialChannel }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedTechStacks, setSelectedTechStacks] = useState([]);
  const [isTechStackModalOpen, setIsTechStackModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const [channelError, setChannelError] = useState('');
  const [contentError, setContentError] = useState('');
  const [submitError, setSubmitError] = useState('');

  const [attachedUrl, setAttachedUrl] = useState('');
  const [isUrlFocused, setIsUrlFocused] = useState(false);
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);
  const channelSectionRef = useRef(null);
  const contentSectionRef = useRef(null);

  // 임시저장
  const currentDraftIdRef = useRef(null);
  const [isDraftModalOpen, setIsDraftModalOpen] = useState(false);
  const [saveToastVisible, setSaveToastVisible] = useState(false);
  const toastTimerRef = useRef(null);
  const draftTimerRef = useRef(null);
  const latestDraftValuesRef = useRef({ title, content, selectedTechStacks, selectedChannel: null });

  // 채널 선택 상태
  const [selectedChannel, setSelectedChannel] = useState(null); // { channelId, name, imageUrl }
  const [showChannelSearch, setShowChannelSearch] = useState(false);
  const [channelQuery, setChannelQuery] = useState('');
  const [channelResults, setChannelResults] = useState([]);
  const [channelSearchLoading, setChannelSearchLoading] = useState(false);
  const channelDebounceRef = useRef(null);
  const channelSearchInputRef = useRef(null);

  // 수정 모드일 때 기존 데이터로 폼 채우기
  useEffect(() => {
    if (postToEdit) {
      setTitle(postToEdit.title || '');
      setContent(postToEdit.body || '');
      setSelectedTechStacks(postToEdit.tags || []);
      setAttachedUrl(Array.isArray(postToEdit.attachedUrls) && postToEdit.attachedUrls.length > 0 ? postToEdit.attachedUrls[0] : '');
      setThumbnailUrl(postToEdit.thumbnailUrl || '');
      // 수정 시 기존 채널 정보가 있으면 복원
      if (postToEdit.channelId) {
        setSelectedChannel({ channelId: postToEdit.channelId, name: postToEdit.channelName, imageUrl: postToEdit.channelImageUrl });
      } else {
        setSelectedChannel(null);
      }
    } else {
      setTitle('');
      setContent('');
      setSelectedTechStacks([]);
      setAttachedUrl('');
      setThumbnailUrl('');
      setSelectedChannel(initialChannel || null);
    }
  }, [postToEdit, initialChannel]);

  // 채널 검색 debounce (300ms)
  useEffect(() => {
    if (!showChannelSearch) return;
    clearTimeout(channelDebounceRef.current);
    channelDebounceRef.current = setTimeout(async () => {
      setChannelSearchLoading(true);
      try {
        const res = await jwtAxios.get('channels/search', { params: { keyword: channelQuery, size: 10 } });
        setChannelResults(res.data || []);
      } catch {
        setChannelResults([]);
      } finally {
        setChannelSearchLoading(false);
      }
    }, 300);
    return () => clearTimeout(channelDebounceRef.current);
  }, [channelQuery, showChannelSearch]);

  // 검색란 열릴 때 자동 포커스
  useEffect(() => {
    if (showChannelSearch) {
      channelSearchInputRef.current?.focus();
    }
  }, [showChannelSearch]);

  // latestDraftValuesRef를 매 렌더마다 갱신 (stale closure 방지)
  useEffect(() => {
    latestDraftValuesRef.current = { title, content, selectedTechStacks, selectedChannel };
  });

  // 자동 임시저장
  const autoSaveDraft = async (t, b, stacks, ch) => {
    if (postToEdit) return;
    const isBlank = !t.trim() && b.replace(/<(.|\n)*?>/g, '').trim().length === 0;
    if (isBlank) return;
    try {
      const payload = { title: t, body: b, targetType: 'feed', channelId: ch?.channelId ?? null, tags: stacks };
      if (currentDraftIdRef.current) {
        await jwtAxios.put(`drafts/${currentDraftIdRef.current}`, payload);
      } else {
        const res = await jwtAxios.post('drafts', payload);
        currentDraftIdRef.current = res.data.draftId;
      }
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
      setSaveToastVisible(true);
      toastTimerRef.current = setTimeout(() => setSaveToastVisible(false), 2000);
    } catch {
      // 자동저장 실패 무시
    }
  };

  // 3초 디바운스 자동저장
  useEffect(() => {
    if (postToEdit) return;
    if (draftTimerRef.current) clearTimeout(draftTimerRef.current);
    draftTimerRef.current = setTimeout(() => {
      const { title: t, content: b, selectedTechStacks: s, selectedChannel: ch } = latestDraftValuesRef.current;
      autoSaveDraft(t, b, s, ch);
    }, 10000);
    return () => { if (draftTimerRef.current) clearTimeout(draftTimerRef.current); };
  }, [title, content, selectedTechStacks, selectedChannel]);

  // Ctrl+S 즉시 저장
  useEffect(() => {
    if (postToEdit) return;
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        if (draftTimerRef.current) clearTimeout(draftTimerRef.current);
        const { title: t, content: b, selectedTechStacks: s, selectedChannel: ch } = latestDraftValuesRef.current;
        autoSaveDraft(t, b, s, ch);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [postToEdit]);

  // 임시저장 불러오기
  const handleLoadDraft = (draft) => {
    setTitle(draft.title || '');
    setContent(draft.body || '');
    setSelectedTechStacks(draft.tags || []);
    currentDraftIdRef.current = draft.draftId;
    if (draft.channelId) {
      setSelectedChannel({ channelId: draft.channelId, name: '로딩 중...', imageUrl: null });
      jwtAxios.get(`channels/${draft.channelId}`).then(res => {
        setSelectedChannel({ channelId: draft.channelId, name: res.data.channelName || res.data.name || '', imageUrl: res.data.imageUrl });
      }).catch(() => setSelectedChannel(null));
    }
  };

  const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];

  const uploadToS3 = async (file) => {
    const presignedRes = await jwtAxios.get('s3/presigned-url', {
      params: { filename: file.name, contentType: file.type },
    });
    const { presignedUrl, publicUrl } = presignedRes.data;
    await axios.put(presignedUrl, file, { headers: { 'Content-Type': file.type } });
    return publicUrl;
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // MIME 타입 검증 (확장자를 모든 파일로 바꿔서 올리는 시도 차단)
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      alert('이미지 파일만 업로드 가능합니다. (JPG, PNG, GIF, WEBP, SVG)');
      e.target.value = '';
      return;
    }

    setIsUploading(true);
    try {
      setThumbnailUrl(await uploadToS3(file));
    } catch (err) {
      console.error('[Upload] 업로드 실패:', err?.response?.status, err?.response?.data || err?.message || err);
      alert('파일 업로드에 실패했습니다.');
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setChannelError('');
    setContentError('');
    setSubmitError('');

    const isContentEmpty = content.replace(/<(.|\n)*?>/g, '').trim().length === 0 && !content.includes('<img');
    let hasError = false;

    if (!selectedChannel) {
      setChannelError('채널을 선택하지 않았습니다.');
      channelSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setTimeout(() => setShowChannelSearch(true), 300);
      hasError = true;
    }
    if (isContentEmpty) {
      setContentError('내용을 입력해주세요.');
      if (!hasError) {
        contentSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      hasError = true;
    }
    if (hasError) return;

    setLoading(true);
    

    // 현재 로그인된 유저 정보 가져오기
    const currentUser = JSON.parse(localStorage.getItem('user')) || {};

    const tagArray = selectedTechStacks;
    const attachedUrlValue = attachedUrl.trim(); // 백엔드가 단일 문자열을 기대하므로, 배열이 아닌 문자열 자체를 보냅니다.

    const postData = {
      title: title || (postToEdit ? postToEdit.title : '제목 없음'),
      body: content,
      contentType: 'feed',
      channelId: selectedChannel.channelId,
      thumbnailUrl: thumbnailUrl || null,
      tags: tagArray,
      attachedUrls: attachedUrlValue,
      author: currentUser.username || currentUser.nickname || '익명'
    };
    console.log('[FeedCard] 전송 postData:', postData);

    try {
      if (postToEdit) {
        await jwtAxios.put(`/posts/${postToEdit.postId}`, postData);
        alert('게시글이 성공적으로 수정되었습니다.');
      } else {
        await jwtAxios.post('/posts', postData);
        if (currentDraftIdRef.current) {
          jwtAxios.delete(`drafts/${currentDraftIdRef.current}`).catch(() => {});
        }
        alert('게시글이 성공적으로 작성되었습니다.');
      }
      onPostCreated(); // 작성/수정 성공 후 부모 컴포넌트에 알림 (피드 새로고침)
    } catch (err) {
      console.error('게시글 작성/수정 API 에러 데이터:', err.response?.data);

      const errData = err.response?.data;
      if (errData) {
        // 백엔드에서 온 에러 데이터를 화면에 그대로 표시 (원인 파악용)
        if (typeof errData === 'string') setError(errData);
        else if (errData.message) setError(errData.message);
        else setSubmitError(`오류 원인: ${JSON.stringify(errData)}`);
      } else {
        setSubmitError('서버와 통신할 수 없거나 작성 중 오류가 발생했습니다.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSelectChannel = (ch) => {
    setSelectedChannel(ch);
    setShowChannelSearch(false);
    setChannelQuery('');
    setChannelResults([]);
  };

  return (
    <>
    <DraftListModal
      isOpen={isDraftModalOpen}
      onClose={() => setIsDraftModalOpen(false)}
      targetType="feed"
      onLoad={handleLoadDraft}
    />
    <SaveToast visible={saveToastVisible} />
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
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
        </div>
      )}
      {submitError && <div className="text-red-500 text-sm font-medium">{submitError}</div>}

      {/* 채널 선택 (필수) */}
      <div ref={channelSectionRef} className="flex flex-col gap-1.5">
        <label className="text-sm font-semibold text-foreground">
          채널 <span className="text-red-500">*</span>
        </label>

        {showChannelSearch ? (
          <div className="relative">
            <input
              ref={channelSearchInputRef}
              type="text"
              value={channelQuery}
              onChange={(e) => setChannelQuery(e.target.value)}
              onBlur={() => setTimeout(() => { setShowChannelSearch(false); setChannelQuery(''); setChannelResults([]); }, 150)}
              placeholder="채널명으로 검색..."
              className="w-full px-4 py-2 border border-primary rounded-xl bg-background text-foreground focus:outline-none transition-colors"
            />
            {(channelSearchLoading || channelResults.length > 0) && (
              <div className="absolute z-50 w-full mt-1 bg-surface border border-border rounded-xl shadow-xl overflow-hidden">
                {channelSearchLoading ? (
                  <div className="flex justify-center py-4">
                    <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : (
                  channelResults.map((ch) => (
                    <button
                      key={ch.channelId}
                      type="button"
                      onMouseDown={() => handleSelectChannel(ch)}
                      className="flex items-center gap-3 w-full px-4 py-2.5 hover:bg-muted/30 transition-colors text-left"
                    >
                      {ch.imageUrl ? (
                        <img src={ch.imageUrl} alt={ch.name} className="w-8 h-8 rounded-lg object-cover flex-shrink-0" />
                      ) : (
                        <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                          <span className="text-sm font-bold text-primary">{ch.name?.[0]?.toUpperCase()}</span>
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-semibold text-foreground">{ch.name}</p>
                        <p className="text-xs text-muted-foreground">{ch.followerCount?.toLocaleString()}명 구독</p>
                      </div>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setShowChannelSearch(true)}
            className="flex items-center gap-3 w-full min-h-[46px] px-4 py-2.5 border border-border rounded-xl bg-background hover:bg-muted/30 hover:border-foreground/50 transition-all text-left cursor-pointer"
          >
            {selectedChannel ? (
              <>
                {selectedChannel.imageUrl ? (
                  <img src={selectedChannel.imageUrl} alt={selectedChannel.name} className="w-7 h-7 rounded-lg object-cover flex-shrink-0" />
                ) : (
                  <div className="w-7 h-7 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-primary">{selectedChannel.name?.[0]?.toUpperCase()}</span>
                  </div>
                )}
                <span className="text-sm font-semibold text-foreground">{selectedChannel.name}</span>
              </>
            ) : (
              <span className="text-sm text-muted-foreground">채널 선택 (필수)</span>
            )}
          </button>
        )}
        {channelError && <div className="text-red-500 text-sm font-medium mt-1">{channelError}</div>}      
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-semibold text-foreground">제목(선택 사항)</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="제목을 입력하세요 (최대 250자)"
          maxLength={250}
          className="px-4 py-2 border border-border rounded-xl bg-background text-foreground focus:outline-none hover:bg-muted/30 hover:border-foreground/50 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
        />
        <div className={`text-right text-xs mt-0.5 ${title.length >= 250 ? 'text-red-500 font-medium' : title.length >= 225 ? 'text-orange-400' : 'text-muted-foreground'}`}>
          {title.length} / 250
        </div>
      </div>

      <div ref={contentSectionRef} className="flex flex-col gap-2">
        <label className="text-sm font-semibold text-foreground">내용</label>
        <RichTextEditor
          value={content}
          onChange={setContent}
          placeholder="내용을 입력하세요 (최대 10,000자)"
          readOnly={loading}
          onImageUpload={uploadToS3}
          maxChars={10000}
          className="rounded-xl transition-all mt-1 hover:border-foreground/40"
        />
        {contentError && <div className="text-red-500 text-sm font-medium">{contentError}</div>}
      </div>

      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <label className="text-sm font-semibold text-foreground">기술스택 (선택, 최대 5개)</label>
          <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">AI가 글을 분석하여 태그를 달아줍니다</span>
        </div>
        <button
          type="button"
          onClick={() => setIsTechStackModalOpen(true)}
          className="flex flex-wrap items-center gap-1.5 w-full min-h-[46px] px-3 py-2 border border-border rounded-xl bg-background text-left hover:bg-muted/30 hover:border-foreground/50 transition-all"
        >
          {selectedTechStacks.length > 0 ? (
            <>
              {selectedTechStacks.map(tag => (
                <span key={tag} className="flex items-center gap-1 px-2.5 py-1 bg-primary/10 text-primary text-xs font-semibold rounded-lg">
                  {tag}
                  <button type="button" onClick={(e) => { e.stopPropagation(); setSelectedTechStacks(prev => prev.filter(t => t !== tag)); }} className="flex items-center justify-center w-3.5 h-3.5 rounded-full hover:bg-primary/30 transition-colors shrink-0"><svg xmlns="http://www.w3.org/2000/svg" width="8" height="8" viewBox="0 0 10 10" fill="currentColor"><path d="M1 1l8 8M9 1l-8 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg></button>
                </span>
              ))}
              <span className="text-xs text-muted-foreground ml-1">클릭하여 수정</span>
            </>
          ) : (
            <span className="text-sm text-muted-foreground">태그를 직접 입력해 보세요</span>
          )}
        </button>
        <TechStackModal
          isOpen={isTechStackModalOpen}
          onClose={() => setIsTechStackModalOpen(false)}
          selectedTechStack={selectedTechStacks}
          onConfirm={(tags) => setSelectedTechStacks(tags)}
        />
      </div>
      
      {/* 링크 입력 영역 */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-semibold text-foreground">첨부 링크 (선택)</label>
        {!isUrlFocused && attachedUrl ? (
          <div
            className="w-full flex items-center px-3 py-2 border border-border rounded-xl bg-background cursor-pointer hover:bg-muted/30 transition-colors overflow-hidden"
            onClick={() => setIsUrlFocused(true)}
          >
            <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 text-primary rounded-lg max-w-full inline-flex">
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
              <a
                href={attachedUrl.startsWith('http') ? attachedUrl : `https://${attachedUrl}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="text-sm font-semibold truncate hover:underline"
              >
                첨부 링크
              </a>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setAttachedUrl(''); setIsUrlFocused(true); }}
                className="ml-1 p-0.5 rounded-full hover:bg-primary/20 shrink-0 transition-colors"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>
          </div>
        ) : (
          <div className="relative flex items-center">
            <svg className="absolute left-4 w-5 h-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
            <input
              autoFocus={isUrlFocused}
              type="url"
              value={attachedUrl}
              onChange={(e) => setAttachedUrl(e.target.value)}
              onFocus={() => setIsUrlFocused(true)}
              onBlur={() => setIsUrlFocused(false)}
              placeholder="https://example.com"
              className="w-full pl-11 pr-4 py-2 border border-border rounded-xl bg-background text-foreground focus:outline-none hover:bg-muted/30 hover:border-foreground/50 focus:border-primary transition-all"
            />
          </div>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-semibold text-foreground">썸네일 이미지 (선택)</label>

        <input
          type="file"
          accept="image/*"
          ref={fileInputRef}
          onChange={handleFileUpload}
          className="hidden"
        />

        {!thumbnailUrl ? (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="w-full flex items-center justify-center gap-2 py-8 border-2 border-dashed border-border rounded-xl bg-background hover:bg-muted/30 transition-colors disabled:opacity-50"
          >
            <FiImage size={22} className="text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              {isUploading ? '업로드 중...' : '클릭하여 이미지 업로드 (JPG, PNG 최대 10MB)'}
            </span>
          </button>
        ) : (
          <div className="relative w-full rounded-xl overflow-hidden border border-border">
            <img src={thumbnailUrl} alt="썸네일 미리보기" className="w-full max-h-64 object-cover" />
            <button
              type="button"
              onClick={() => setThumbnailUrl('')}
              className="absolute top-2 right-2 p-1.5 bg-black/50 hover:bg-black/70 text-white rounded-full transition-colors"
            >
              <FiX size={16} />
            </button>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between mt-4">
        {/* 좌측: 나가기 */}
        <button
          type="button"
          onClick={onClose}
          className="cursor-pointer px-4 py-2 border border-border rounded-xl text-sm font-medium text-foreground
            hover:bg-foreground/10 active:bg-foreground/15
            transition-colors"
        >
          나가기
        </button>
        {/* 우측: 임시저장 + 작성 */}
        <div className="flex items-center gap-2">
          {!postToEdit && (
            <button
              type="button"
              onClick={() => {
                if (draftTimerRef.current) clearTimeout(draftTimerRef.current);
                const { title: t, content: b, selectedTechStacks: s, selectedChannel: ch } = latestDraftValuesRef.current;
                autoSaveDraft(t, b, s, ch);
              }}
              className="cursor-pointer px-4 py-2 border border-border rounded-xl text-sm font-medium text-foreground
                hover:border-primary hover:text-primary hover:bg-primary/5 active:bg-primary/10
                transition-all duration-150"
            >
              임시저장
            </button>
          )}
          <button
            type="submit"
            disabled={loading || isUploading}
            className="cursor-pointer px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-bold hover:bg-primary/90 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100 transition-all shadow-md hover:shadow-lg"
          >
            {isUploading ? '이미지 업로드 중...' : loading ? (postToEdit ? '수정 중...' : '작성 중...') : (postToEdit ? '수정' : '작성')}
          </button>
        </div>
      </div>
    </form>
    </>
  );
};

export default FeedCard;