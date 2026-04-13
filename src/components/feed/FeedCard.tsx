import React, { useState, useRef, useEffect } from 'react';
import jwtAxios from '../../api/jwtAxios';
import { FiImage, FiX } from 'react-icons/fi';
import { Post } from './PostCard';

interface FeedCardProps {
  onClose: () => void;
  onPostCreated?: () => void; // 작성 완료 후 피드 목록을 리로드할 때 사용할 콜백
  postToEdit?: Post | null;
}

const FeedCard: React.FC<FeedCardProps> = ({ onClose, onPostCreated, postToEdit }) => {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [tags, setTags] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 수정 모드일 경우 초기값 세팅
  useEffect(() => {
    if (postToEdit) {
      setTitle(postToEdit.title || '');
      setBody(postToEdit.body || '');
      setTags(postToEdit.tags?.join(', ') || '');
      setThumbnailUrl(postToEdit.thumbnailUrl || '');
    }
  }, [postToEdit]);

  // 파일 업로드 처리
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    setIsUploading(true);
    try {
      const response = await jwtAxios.post('upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setThumbnailUrl(response.data.url); // API 스펙에 맞춰 객체의 url 필드 참조
    } catch (err) {
      alert('파일 업로드에 실패했습니다.');
    } finally {
      setIsUploading(false);
    }
  };

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
      tags: tagArray,
      thumbnailUrl // 업로드된 썸네일 URL 포함
    };

    try {
      if (postToEdit) {
        await jwtAxios.put(`posts/${postToEdit.postId}`, postData);
        alert('게시글이 성공적으로 수정되었습니다.');
      } else {
        await jwtAxios.post('posts', { ...postData, contentType: 'feed' });
        alert('게시글이 성공적으로 작성되었습니다.');
      }
      onClose();
      if (onPostCreated) onPostCreated(); // 피드 리스트 새로고침
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

      {/* 이미지 업로드 영역 */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-semibold text-gray-800 dark:text-gray-200">썸네일 이미지</label>
        
        {/* 숨겨진 파일 입력 필드 */}
        <input 
          type="file" 
          accept="image/*" 
          ref={fileInputRef}
          onChange={handleFileUpload} 
          className="hidden" 
        />
        
        {/* 업로드 버튼 및 상태 표시 */}
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

        {/* 미리보기 이미지 */}
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
  );
};

export default FeedCard;