import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import jwtAxios from '../../api/jwtAxios';
import { FiImage, FiX } from 'react-icons/fi';
import { Post } from './PostCard';
import RichTextEditor from '../editor/RichTextEditor';
import TechStackModal from '../auth/TechStackModal';

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
  const [isTechStackModalOpen, setIsTechStackModalOpen] = useState(false);

  // 수정 모드일 경우 초기값 세팅
  useEffect(() => {
    if (postToEdit) {
      setTitle(postToEdit.title || '');
      setBody(postToEdit.body || '');
      setTags(postToEdit.tags?.join(', ') || '');
      // In a real app, you'd likely set the selected techs here too
      setThumbnailUrl(postToEdit.thumbnailUrl || '');
    }
  }, [postToEdit]);

  // 파일 업로드 처리 (S3 presigned URL 방식)
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      // 1. 백엔드에서 presigned URL과 public URL 발급
      const presignedRes = await jwtAxios.get('s3/presigned-url', {
        params: { filename: file.name },
      });
      const { presignedUrl, publicUrl } = presignedRes.data;

      // 2. 파일을 S3에 직접 PUT 업로드
      await axios.put(presignedUrl, file, {
        headers: { 'Content-Type': file.type },
      });

      // 3. 공개 URL을 썸네일로 설정
      setThumbnailUrl(publicUrl);
    } catch (err) {
      alert('파일 업로드에 실패했습니다.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleTechStackToggle = (tech: string) => {
    const currentTags = tags.split(',').map(t => t.trim()).filter(t => t);
    if (currentTags.includes(tech)) {
      setTags(currentTags.filter(t => t !== tech).join(', '));
    } else {
      setTags([...currentTags, tech].join(', '));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 에디터의 빈 태그(<p><br></p>) 상태 검증
    const isBodyEmpty = body.replace(/<(.|\n)*?>/g, '').trim().length === 0;
    if (!title.trim() || isBodyEmpty) {
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
        <RichTextEditor
          value={body}
          onChange={setBody}
          placeholder="내용을 입력하세요..."
          readOnly={loading}
          className="rounded-xl transition-shadow shadow-sm"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-semibold text-gray-800 dark:text-gray-200">태그</label>
        <button
          type="button"
          onClick={() => setIsTechStackModalOpen(true)}
          className="flex items-center justify-between w-full min-h-[46px] p-3 border border-gray-300 dark:border-gray-700 rounded-xl bg-white dark:bg-slate-800 text-left focus:outline-none focus:border-blue-500 transition-colors hover:bg-gray-50 dark:hover:bg-slate-700"
        >
          <div className="flex flex-wrap gap-1.5">
            {tags.split(',').map(t => t.trim()).filter(t => t).length > 0 ? (
              tags.split(',').map(t => t.trim()).filter(t => t).map(tag => (
                <span key={tag} className="px-2.5 py-1 bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-300 text-xs font-semibold rounded-lg shadow-sm">
                  {tag}
                </span>
              ))
            ) : (
              <span className="text-gray-400 dark:text-gray-500 text-sm">관심 있는 기술을 선택해주세요...</span>
            )}
          </div>
          <svg className="w-5 h-5 text-gray-400 flex-shrink-0 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
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