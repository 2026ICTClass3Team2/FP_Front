import React, { useState } from 'react';
import jwtAxios from '../../api/jwtAxios';

interface FeedCardProps {
  onClose: () => void;
  // onPostCreated?: () => void; // 작성 완료 후 피드 목록을 리로드할 때 사용할 콜백
}

const FeedCard: React.FC<FeedCardProps> = ({ onClose }) => {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [tags, setTags] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) {
      setError('제목과 본문을 입력해주세요.');
      return;
    }
    
    setLoading(true);
    setError('');

    // 쉼표(,)로 구분된 태그들을 배열로 변환 (공백 제거 및 빈 값 제외)
    const tagArray = tags.split(',').map(tag => tag.trim()).filter(tag => tag);

    // 현재 로그인된 유저 정보 가져오기
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

    const postData = {
      title,
      body,
      contentType: 'feed', // 요구사항에 맞춰 feed로 설정
      // channelId: 1, // 필요 시 설정
      tags: tagArray,
      author: currentUser.username || currentUser.nickname || '익명' // 작성자 데이터 추가
    };

    try {
      await jwtAxios.post('/api/posts', postData);
      alert('게시글이 성공적으로 작성되었습니다.');
      onClose();
      // TODO: 창이 닫힌 뒤 FeedList의 데이터를 초기화(새로고침) 하는 로직이 필요할 수 있습니다.
    } catch (err: any) {
      setError(err.response?.data?.message || '게시글 작성 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {error && <div className="text-red-500 text-sm font-medium">{error}</div>}
      
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-semibold text-gray-800 dark:text-gray-200">제목</label>
        <input 
          type="text" value={title} onChange={(e) => setTitle(e.target.value)} 
          placeholder="게시글 제목을 입력하세요." 
          className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-xl bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
          required />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-semibold text-gray-800 dark:text-gray-200">본문</label>
        <textarea 
          value={body} onChange={(e) => setBody(e.target.value)} 
          placeholder="내용을 입력하세요. (HTML 등 포함 가능)" 
          className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-xl bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors min-h-[150px] resize-none"
          required />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-semibold text-gray-800 dark:text-gray-200">태그</label>
        <input 
          type="text" value={tags} onChange={(e) => setTags(e.target.value)} 
          placeholder="쉼표(,)로 구분해서 입력해주세요. 예: Spring, React" 
          className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-xl bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors" />
      </div>

      <div className="flex justify-end gap-2 mt-4">
        <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl text-sm font-medium transition-colors">취소</button>
        <button type="submit" disabled={loading} className="px-4 py-2 bg-blue-500 text-white rounded-xl text-sm font-bold hover:bg-blue-600 disabled:opacity-50 transition-colors shadow-md hover:shadow-lg">
          {loading ? '작성 중...' : '작성 완료'}
        </button>
      </div>
    </form>
  );
};

export default FeedCard;