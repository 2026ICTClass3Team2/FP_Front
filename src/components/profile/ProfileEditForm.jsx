import React, { useState, useRef } from 'react';
import TechStackModal from '../auth/TechStackModal';

const ProfileEditForm = ({ initial, onSubmit, onCancel, onDelete, onPasswordChange }) => {
  const [nickname, setNickname] = useState(initial.nickname);
  const [email, setEmail] = useState(initial.email);
  const [profilePicUrl, setProfilePicUrl] = useState(initial.profilePicUrl || '');
  const [techStacks, setTechStacks] = useState(initial.techStacks || []);
  const [isTechStackModalOpen, setIsTechStackModalOpen] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState(initial.profilePicUrl || '');
  const fileInputRef = useRef();

  // 이미지 업로드 핸들러
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!['image/jpeg', 'image/png'].includes(file.type) || file.size > 10 * 1024 * 1024) {
      setError('JPG, PNG 파일만 10MB 이하로 업로드 가능합니다.');
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
      setProfilePicUrl(reader.result);
    };
    reader.readAsDataURL(file);
  };

  // 폼 제출
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await onSubmit({ nickname, email, profilePicUrl, techStacks });
    } catch (err) {
      setError(err.message || '수정 실패');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-xl mx-auto bg-white rounded-2xl shadow-lg font-sans">
      {/* 헤더 */}
      <div className="px-8 py-6 space-y-6">
        {/* 프로필 이미지 업로드 */}
        <div>
          <label className="block text-sm font-semibold mb-2">프로필 이미지(선택)</label>
          <div
            className="w-full h-32 flex items-center justify-center border-2 border-dashed border-gray-300 rounded-xl cursor-pointer bg-gray-50 hover:bg-gray-100 transition"
            onClick={() => fileInputRef.current?.click()}
          >
            {imagePreview ? (
              <img src={imagePreview} alt="미리보기" className="h-full object-contain" />
            ) : (
              <span className="text-gray-400 text-sm">클릭하여 이미지 업로드 (JPG, PNG 최대 10MB)</span>
            )}
            <input
              type="file"
              accept="image/jpeg,image/png"
              className="hidden"
              ref={fileInputRef}
              onChange={handleImageChange}
            />
          </div>
        </div>
        {/* 닉네임 */}
        <div>
          <label className="block text-sm font-semibold mb-2">닉네임</label>
          <input
            type="text"
            value={nickname}
            onChange={e => setNickname(e.target.value)}
            className="w-full border border-border rounded-xl px-3 py-2 bg-surface text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="닉네임을 입력하세요."
            required
          />
        </div>
        {/* 이메일 */}
        <div>
          <label className="block text-sm font-semibold mb-2">이메일</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="w-full border border-border rounded-xl px-3 py-2 bg-surface text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="이메일을 입력하세요."
            required
          />
        </div>
        {/* 기술 스택 선택 */}
        <div className="flex flex-col gap-1">
          <label className="text-sm font-semibold">기술스택 (최대 5개)</label>
          <button
            type="button"
            onClick={() => setIsTechStackModalOpen(true)}
            className="flex flex-wrap items-center gap-1.5 w-full min-h-[46px] px-3 py-2 border border-border rounded-xl bg-background text-left hover:bg-muted/30 transition-colors"
          >
            {techStacks.length > 0 ? (
              <>
                {techStacks.map(tag => (
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
            selectedTechStack={techStacks}
            onConfirm={(tags) => setTechStacks(tags)}
          />
        </div>
        {/* 비밀번호 변경 필드형 버튼 */}
        {onPasswordChange && (
          <div>
            <label className="block text-sm font-semibold mb-2">비밀번호</label>
            <div className="relative group">
              <button
                type="button"
                onClick={onPasswordChange}
                className="w-full flex items-center border border-border rounded-xl px-3 py-2 bg-surface text-foreground focus:outline-none focus:ring-2 focus:ring-primary hover:bg-blue-50 transition-colors"
              >
                <svg className="w-5 h-5 mr-2 text-blue-500 group-hover:text-blue-700 transition-colors" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm6-10V7a4 4 0 10-8 0v4" /></svg>
                <span className="flex-1 text-left text-gray-700 group-hover:text-blue-700">비밀번호 변경</span>
                <span className="ml-2 text-xs text-gray-400 group-hover:text-blue-500">보안을 위해 주기적으로 변경하세요</span>
              </button>
            </div>
          </div>
        )}
        {error && <div className="text-red-500 text-sm mt-2">{error}</div>}
      </div>
      {/* 푸터 버튼 */}
      <div className="flex justify-end gap-2 px-8 py-4 mt-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-2 rounded-xl bg-gray-100 text-gray-900 font-semibold hover:bg-gray-200 transition-colors shadow-sm text-sm"
        >
          취소
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2 rounded-xl bg-black text-white font-bold hover:bg-gray-900 transition-colors shadow-sm text-sm"
        >
          {loading ? '저장 중...' : '저장'}
        </button>
      </div>
    </form>
  );
};

export default ProfileEditForm;
