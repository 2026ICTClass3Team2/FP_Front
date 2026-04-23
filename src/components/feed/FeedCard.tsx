import React, { useState, useRef, useEffect, useCallback } from 'react';
import axios from 'axios';
import jwtAxios from '../../api/jwtAxios';
import { FiImage, FiX, FiSearch, FiChevronDown } from 'react-icons/fi';
import { Post } from './PostCard';
import RichTextEditor from '../editor/RichTextEditor';
import TechStackModal from '../auth/TechStackModal';

interface ChannelOption {
  channelId: number;
  name: string;
  imageUrl?: string | null;
}

interface FeedCardProps {
  onClose: () => void;
  onPostCreated?: () => void;
  postToEdit?: Post | null;
  initialChannel?: ChannelOption | null; // 채널 페이지에서 진입 시 자동 선택
}

const FeedCard: React.FC<FeedCardProps> = ({ onClose, onPostCreated, postToEdit, initialChannel }) => {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [tags, setTags] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isTechStackModalOpen, setIsTechStackModalOpen] = useState(false);

  // 채널 선택
  const [selectedChannel, setSelectedChannel] = useState<ChannelOption | null>(null);
  const [channelSearch, setChannelSearch] = useState('');
  const [channelResults, setChannelResults] = useState<ChannelOption[]>([]);
  const [showChannelDropdown, setShowChannelDropdown] = useState(false);
  const [channelSearchLoading, setChannelSearchLoading] = useState(false);
  const channelDropdownRef = useRef<HTMLDivElement>(null);
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 초기값 세팅
  useEffect(() => {
    if (postToEdit) {
      setTitle(postToEdit.title || '');
      setBody(postToEdit.body || '');
      setTags(postToEdit.tags?.join(', ') || '');
      setThumbnailUrl(postToEdit.thumbnailUrl || '');
      // 수정 시 기존 채널 세팅
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
    searchChannels(''); // 초기 목록 로드
  };

  const handleSelectChannel = (ch: ChannelOption) => {
    setSelectedChannel(ch);
    setShowChannelDropdown(false);
    setChannelSearch('');
  };

  // S3 업로드 공통 함수 (썸네일 & 에디터 인라인 이미지 공용)
  const uploadToS3 = async (file: File): Promise<string> => {
    const presignedRes = await jwtAxios.get('s3/presigned-url', { params: { filename: file.name } });
    const { presignedUrl, publicUrl } = presignedRes.data;
    await axios.put(presignedUrl, file, { headers: { 'Content-Type': file.type } });
    return publicUrl;
  };

  // 썸네일 업로드
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

    const tagArray = tags.split(',').map(tag => tag.trim()).filter(tag => tag);
    const postData = { title, body, tags: tagArray, thumbnailUrl, channelId: selectedChannel.channelId };

    try {
      if (postToEdit) {
        await jwtAxios.put(`posts/${postToEdit.postId}`, postData);
        alert('게시글이 성공적으로 수정되었습니다.');
      } else {
        await jwtAxios.post('posts', { ...postData, contentType: 'feed' });
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
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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

          {/* 드롭다운 */}
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
          className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-xl bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
          required />
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-semibold text-gray-800 dark:text-gray-200">본문</label>
        <RichTextEditor
          value={body}
          onChange={setBody}
          placeholder="내용을 입력하세요..."
          readOnly={loading}
          onImageUpload={uploadToS3}
          className="rounded-xl transition-shadow shadow-sm mt-1"
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
          <svg className="w-5 h-5 text-gray-400 flex-shrink-0 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

      {/* 이미지 업로드 */}
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
  );
};

export default FeedCard;
