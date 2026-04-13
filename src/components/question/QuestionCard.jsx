import React, { useState } from 'react';
import jwtAxios from '../../api/jwtAxios';

const QuestionCard = ({ onClose }) => {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [tags, setTags] = useState('');
  const [rewardPoints, setRewardPoints] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
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
    const currentUser = JSON.parse(localStorage.getItem('user')) || {};

    const questionData = {
      title,
      body,
      contentType: 'question',
      tags: tagArray,
      rewardPoints: parseInt(rewardPoints, 10) || 0,
      author: currentUser.username || currentUser.nickname || '익명' // 작성자 데이터 추가
    };

    try {
      // 실제 백엔드 API 주소에 맞게 수정 필요 (/api/posts 또는 /api/questions 등)
      console.log('백엔드로 전송하는 데이터:', questionData);
      await jwtAxios.post('posts', questionData);
      alert('질문이 성공적으로 등록되었습니다.');
      onClose();
      // TODO: 창이 닫힌 뒤 게시판 목록 데이터를 초기화(새로고침) 하는 로직 추가
    } catch (err) {
      setError(err.response?.data?.message || '질문 등록 중 오류가 발생했습니다.');
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
          placeholder="궁금한 내용을 요약해서 적어주세요." 
          className="px-4 py-2 border border-gray-300 
          dark:border-gray-700 rounded-xl 
          bg-white dark:bg-slate-800 text-gray-900 
          dark:text-gray-100 focus:outline-none 
          focus:border-blue-500 focus:ring-1 
          focus:ring-blue-500 transition-colors"
          required />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-semibold text-gray-800 dark:text-gray-200">본문</label>
        <textarea 
          value={body} onChange={(e) => setBody(e.target.value)} 
          placeholder="문제 상황, 시도해본 방법, 에러 메시지 등을 상세히 적어주시면 더 좋은 답변을 받을 수 있습니다." 
          className="px-4 py-2 border border-gray-300 dark:border-gray-700 
          rounded-xl bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 
          focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 
          transition-colors min-h-[150px] resize-none"
          required />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-semibold text-gray-800 dark:text-gray-200">태그</label>
        <input 
          type="text" value={tags} onChange={(e) => setTags(e.target.value)} 
          placeholder="쉼표(,)로 구분해서 입력해주세요. 예: React, Error" 
          className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-xl 
          bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 focus:outline-none 
          focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors" />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-semibold text-gray-800 dark:text-gray-200">채택 포인트 (선택)</label>
        <input 
          type="number" min="0" value={rewardPoints} onChange={(e) => setRewardPoints(e.target.value)} 
          placeholder="답변자에게 걸 포인트를 입력하세요." 
          className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-xl bg-white 
          dark:bg-slate-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:border-blue-500 
          focus:ring-1 focus:ring-blue-500 transition-colors" />
        <span className="text-xs text-gray-500">포인트를 걸면 더 빠르고 양질의 답변을 받을 확률이 높아집니다!</span>
      </div>

      <div className="flex justify-end gap-2 mt-4">
        <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-100 
        hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 
        dark:text-gray-300 rounded-xl text-sm font-medium transition-colors">취소</button>
        <button type="submit" disabled={loading} className="px-4 py-2 bg-blue-500 
        text-white rounded-xl text-sm font-bold hover:bg-blue-600 disabled:opacity-50 
        transition-colors shadow-md hover:shadow-lg">
          {loading ? '등록 중...' : '질문 등록'}
        </button>
      </div>
    </form>
  );
};

export default QuestionCard;