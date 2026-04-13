import React, { useState, useEffect } from 'react';
import jwtAxios from '../../api/jwtAxios';
import TechStackModal from '../auth/TechStackModal';

const FeedCard = ({ postToEdit, onClose, onPostCreated }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isTechStackModalOpen, setIsTechStackModalOpen] = useState(false);

  // 수정 모드일 때 기존 데이터로 폼 채우기
  useEffect(() => {
    if (postToEdit) {
      setTitle(postToEdit.title || '');
      setContent(postToEdit.body || ''); // body가 없으면 빈 문자열로
      setTags(postToEdit.tags?.join(', ') || '');
    } else {
      // 새 글 작성 모드일 때 폼 초기화
      setTitle('');
      setContent('');
      setTags('');
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
    if (!content.trim()) {
      setError('내용을 필수로 입력해주세요.');
      return;
    }
    
    setLoading(true);
    setError('');

    // 현재 로그인된 유저 정보 가져오기
    const currentUser = JSON.parse(localStorage.getItem('user')) || {};

    const tagArray = tags.split(',').map(tag => tag.trim()).filter(tag => tag);

    // 백엔드에 보낼 데이터
    const postData = {
      title: title || (postToEdit ? postToEdit.title : '제목 없음'),
      body: content,
      contentType: 'feed',
      // channelId: 1, // 필요 시 설정
      thumbnailUrl: null, // 백엔드 명세에 맞추기 위해 썸네일 기본값 추가
      tags: tagArray,
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
        <textarea 
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="내용을 입력하세요 (최대 10,000자)" 
          className="px-4 py-2 border border-border rounded-xl bg-background text-foreground focus:outline-none focus:border-primary min-h-[150px] resize-none transition-colors"
          maxLength={10000}
          required
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