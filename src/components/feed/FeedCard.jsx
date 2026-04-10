import React, { useState } from 'react';
import jwtAxios from '../../api/jwtAxios';

const FeedCard = ({ onClose, onPostCreated }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedTechs, setSelectedTechs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const techStacks = ['React', 'TypeScript', 'JavaScript', 'Node.js', 'Python', 'Java', 'C++'];

  const handleTechToggle = (tech) => {
    if (selectedTechs.includes(tech)) {
      setSelectedTechs(selectedTechs.filter(t => t !== tech));
    } else {
      if (selectedTechs.length >= 5) {
        alert('기술 스택은 최대 5개까지만 선택 가능합니다.');
        return;
      }
      setSelectedTechs([...selectedTechs, tech]);
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

    const postData = {
      title: title || '제목 없음', // 제목이 선택사항이므로 비어있을 시 기본값 세팅
      body: content,
      contentType: 'feed',
      channelId: 1, // 백엔드 API 명세에 맞춰 필수값 추가
      thumbnailUrl: null, // 백엔드 명세에 맞추기 위해 썸네일 기본값 추가
      tags: selectedTechs,
      author: currentUser.username || currentUser.nickname || '익명' // 작성자 데이터 추가
    };

    try {
      await jwtAxios.post('/api/posts', postData);
      alert('게시글이 성공적으로 작성되었습니다.');
      onPostCreated(); // 작성 성공 후 부모 컴포넌트에 알림
    } catch (err) {
      console.error('게시글 작성 API 에러 데이터:', err.response?.data);
      
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
        <div className="flex flex-wrap gap-2 mt-1">
          {techStacks.map(tech => (
            <button
              key={tech}
              type="button"
              onClick={() => handleTechToggle(tech)}
              className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${
                selectedTechs.includes(tech)
                  ? 'bg-primary border-primary text-primary-foreground'
                  : 'bg-background border-border text-foreground hover:border-primary'
              }`}
            >
              {tech}
            </button>
          ))}
        </div>
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
          {loading ? '작성 중...' : '작성'}
        </button>
      </div>
    </form>
  );
};

export default FeedCard;