import React, { useState, useEffect } from 'react';
import jwtAxios from '../../api/jwtAxios';
import TechStackModal from '../auth/TechStackModal';
import RichTextEditor from '../editor/RichTextEditor';

const FeedCard = ({ postToEdit, onClose, onPostCreated }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isTechStackModalOpen, setIsTechStackModalOpen] = useState(false);
  const [attachedUrl, setAttachedUrl] = useState('');
  const [isUrlFocused, setIsUrlFocused] = useState(false);

  // 수정 모드일 때 기존 데이터로 폼 채우기
  useEffect(() => {
    if (postToEdit) {
      setTitle(postToEdit.title || '');
      setContent(postToEdit.body || ''); // body가 없으면 빈 문자열로
      setTags(postToEdit.tags?.join(', ') || '');
      // attachedUrls가 배열로 올 수 있으므로, 첫 번째 요소만 문자열로 설정합니다.
      setAttachedUrl(Array.isArray(postToEdit.attachedUrls) && postToEdit.attachedUrls.length > 0 ? postToEdit.attachedUrls[0] : '');
    } else {
      // 새 글 작성 모드일 때 폼 초기화
      setTitle('');
      setContent('');
      setTags('');
      setAttachedUrl('');
    }
  }, [postToEdit]);

  const handleTechStackToggle = (tech) => {
    const currentTags = tags.split(',').map(t => t.trim()).filter(t => t);
    if (currentTags.includes(tech)) {
      setTags(currentTags.filter(t => t !== tech).join(', '));
    } else {
      if (currentTags.length >= 5) {
        alert('기술 스택은 최대 5개까지만 선택 가능합니다.');
        return;
      }
      setTags([...currentTags, tech].join(', '));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // 에디터 특성상 내용이 비어있어도 <p><br></p>가 들어갈 수 있으므로 태그를 제외하고 검사합니다.
    const isContentEmpty = content.replace(/<(.|\n)*?>/g, '').trim().length === 0;
    if (isContentEmpty) {
      setError('내용을 필수로 입력해주세요.');
      return;
    }
    
    setLoading(true);
    setError('');

    // 현재 로그인된 유저 정보 가져오기
    const currentUser = JSON.parse(localStorage.getItem('user')) || {};

    const tagArray = tags.split(',').map(tag => tag.trim()).filter(tag => tag);
    const attachedUrlValue = attachedUrl.trim(); // 백엔드가 단일 문자열을 기대하므로, 배열이 아닌 문자열 자체를 보냅니다.

    // 백엔드에 보낼 데이터
    const postData = {
      title: title || (postToEdit ? postToEdit.title : '제목 없음'),
      body: content,
      contentType: 'feed',
      // channelId: 1, // 필요 시 설정
      thumbnailUrl: null, // 백엔드 명세에 맞추기 위해 썸네일 기본값 추가
      tags: tagArray, // 태그는 여전히 배열로 보냅니다.
      attachedUrls: attachedUrlValue, // 단일 문자열로 보냅니다.
      author: currentUser.username || currentUser.nickname || '익명'
    };

    try {
      if (postToEdit) {
        // 수정 모드: PUT 요청
        await jwtAxios.put(`/posts/${postToEdit.postId}`, postData);
        alert('게시글이 성공적으로 수정되었습니다.');
      } else {
        // 작성 모드: POST 요청
        await jwtAxios.post('/posts', postData);
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
        else setError(`오류 원인: ${JSON.stringify(errData)}`);
      } else {
        setError('서버와 통신할 수 없거나 작성 중 오류가 발생했습니다.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      {error && <div className="text-red-500 text-sm font-medium">{error}</div>}

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-semibold text-foreground">제목(선택 사항)</label>
        <input 
          type="text" 
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="제목을 입력하세요 (최대 250자)" 
          className="px-4 py-2 border border-border rounded-xl bg-background text-foreground focus:outline-none focus:border-primary transition-colors"
          maxLength={250}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-semibold text-foreground">내용</label>
        <RichTextEditor
          value={content}
          onChange={setContent}
          placeholder="내용을 입력하세요 (최대 10,000자)"
          readOnly={loading}
          className="rounded-xl transition-shadow"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-semibold text-foreground">기술스택(최대5개)</label>
        <button
          type="button"
          onClick={() => setIsTechStackModalOpen(true)}
          className="flex items-center justify-between w-full min-h-[46px] p-3 border border-border rounded-xl bg-background text-left focus:outline-none focus:border-primary transition-colors hover:bg-muted/30"
        >
          <div className="flex flex-wrap gap-1.5">
            {tags.split(',').map(t => t.trim()).filter(t => t).length > 0 ? (
              tags.split(',').map(t => t.trim()).filter(t => t).map(tag => (
                <span key={tag} className="px-2.5 py-1 bg-primary/10 text-primary text-xs font-semibold rounded-lg shadow-sm">
                  {tag}
                </span>
              ))
            ) : (
              <span className="text-muted-foreground text-sm">관련된 기술 스택을 선택해 주세요.</span>
            )}
          </div>
          <svg className="w-5 h-5 text-muted-foreground flex-shrink-0 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
          </svg>
        </button>
      </div>  

      <TechStackModal
        isOpen={isTechStackModalOpen}
        onClose={() => setIsTechStackModalOpen(false)}
        selectedTechStack={tags.split(',').map(t => t.trim()).filter(t => t)}
        onToggle={handleTechStackToggle}
      />
      
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
              className="w-full pl-11 pr-4 py-2 border border-border rounded-xl bg-background text-foreground focus:outline-none focus:border-primary transition-all"
            />
          </div>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-semibold text-foreground">썸네일 이미지 (선택)</label>
        <div className="border-2 border-dashed border-border rounded-xl p-4 text-center cursor-pointer hover:bg-muted/30 transition-colors">
          <span className="text-sm text-muted-foreground">클릭하여 이미지 업로드 (JPG, PNG 최대 10MB)</span>
        </div>
      </div>

      <div className="flex justify-end gap-2 mt-4">
        <button type="button" onClick={onClose} className="px-4 py-2 bg-muted hover:bg-muted/80 text-foreground rounded-xl text-sm font-medium transition-colors">취소</button>
        <button type="submit" disabled={loading} className="px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-bold hover:bg-primary/90 disabled:opacity-50 transition-colors shadow-md hover:shadow-lg">
          {loading ? (postToEdit ? '수정 중...' : '작성 중...') : (postToEdit ? '수정' : '작성')}
        </button>
      </div>
    </form>
  );
};

export default FeedCard;