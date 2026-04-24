import React, { useState, useRef, useEffect } from 'react';
import Modal from '../common/Modal';
import TechStackModal from '../auth/TechStackModal';
import jwtAxios from '../../api/jwtAxios';
import { FiImage } from 'react-icons/fi';

const CreateChannelModal = ({ isOpen, onClose, onSuccess }) => {
  const [channelName, setChannelName] = useState('');
  const [description, setDescription] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [selectedTechStacks, setSelectedTechStacks] = useState([]);
  const [isTechStackModalOpen, setIsTechStackModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fileInputRef = useRef();

  useEffect(() => {
    if (isOpen) {
      setChannelName('');
      setDescription('');
      setImageFile(null);
      setImagePreview('');
      setSelectedTechStacks([]);
      setError('');
    }
  }, [isOpen]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!['image/jpeg', 'image/png'].includes(file.type) || file.size > 10 * 1024 * 1024) {
      setError('JPG 또는 PNG 형식의 10MB 이하 이미지만 업로드 가능합니다.');
      return;
    }
    setError('');
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setImagePreview(ev.target.result);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!channelName.trim()) {
      setError('채널 이름을 입력해 주세요.');
      return;
    }
    if (!description.trim()) {
      setError('채널 설명을 입력해 주세요.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('channelName', channelName.trim());
      formData.append('description', description.trim());
      if (imageFile) {
        formData.append('image', imageFile);
      }
      selectedTechStacks.forEach((tech) => formData.append('techStacks', tech));

      await jwtAxios.post('/channels', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      alert('채널이 성공적으로 생성되었습니다.');
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || '채널 생성 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="채널 만들기">
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {error && (
            <div className="text-red-500 text-sm font-semibold bg-red-500/10 p-3 rounded-xl">
              {error}
            </div>
          )}

          {/* 채널 이미지 업로드 */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-foreground">
              채널 이미지 <span className="text-muted-foreground font-normal">(선택)</span>
            </label>
            <div
              className="w-full h-36 flex flex-col items-center justify-center border-2 border-dashed border-border rounded-xl cursor-pointer bg-surface hover:bg-secondary transition overflow-hidden"
              onClick={() => fileInputRef.current?.click()}
            >
              {imagePreview ? (
                <img src={imagePreview} alt="채널 이미지 미리보기" className="w-full h-full object-cover" />
              ) : (
                <>
                  <FiImage size={28} className="text-muted-foreground mb-2" />
                  <span className="text-muted-foreground text-sm">클릭하여 이미지 업로드 (JPG, PNG 최대 10MB)</span>
                </>
              )}
              <input
                type="file"
                accept="image/jpeg,image/png"
                className="hidden"
                ref={fileInputRef}
                onChange={handleImageChange}
              />
            </div>
            {imagePreview && (
              <button
                type="button"
                onClick={() => { setImageFile(null); setImagePreview(''); }}
                className="text-xs text-muted-foreground hover:text-red-500 self-start transition-colors"
              >
                이미지 제거
              </button>
            )}
          </div>

          {/* 채널 이름 */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-foreground">
              채널 이름 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={channelName}
              onChange={(e) => setChannelName(e.target.value)}
              placeholder="채널 이름을 입력해 주세요."
              maxLength={50}
              className="border border-border rounded-xl px-4 py-2.5 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
            />
            <span className="text-xs text-muted-foreground self-end">{channelName.length} / 50</span>
          </div>

          {/* 채널 설명 */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-foreground">
              채널 설명 <span className="text-red-500">*</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="채널에 대해 간략히 설명해 주세요."
              maxLength={300}
              rows={4}
              className="border border-border rounded-xl px-4 py-3 bg-background text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
            />
            <span className="text-xs text-muted-foreground self-end">{description.length} / 300</span>
          </div>

          {/* 기술 스택 선택 */}
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
                    <span key={tag} className="px-2.5 py-1 bg-primary/10 text-primary text-xs font-semibold rounded-lg">{tag}</span>
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
              onConfirm={(tags) => setSelectedTechStacks(tags)}
            />
          </div>

          {/* 제출 버튼 */}
          <button
            type="submit"
            disabled={loading}
            className="mt-2 w-full py-3 bg-primary hover:bg-primary/90 disabled:opacity-50 text-primary-foreground rounded-xl font-bold text-base transition-colors"
          >
            {loading ? '생성 중...' : '채널 만들기'}
          </button>
        </form>
    </Modal>
  );
};

export default CreateChannelModal;
