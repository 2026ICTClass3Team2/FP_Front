import React, { useState, useRef } from 'react';
import TechStackModal from '../auth/TechStackModal';

const EMAIL_DOMAINS = ['직접 입력', 'naver.com', 'gmail.com', 'kakao.com', 'daum.net', 'hanmail.net', 'nate.com', 'outlook.com', 'icloud.com'];

const splitEmail = (email) => {
  const idx = email.indexOf('@');
  if (idx === -1) return { local: email, domain: '' };
  return { local: email.slice(0, idx), domain: email.slice(idx + 1) };
};

const ProfileEditForm = ({ initial, isLocal = false, onSubmit, onCancel, onDelete, onPasswordChange }) => {
  const [nickname, setNickname] = useState(initial.nickname);

  // 이메일을 로컬파트 + 도메인으로 분리 관리
  const initEmail = splitEmail(initial.email || '');
  const [emailLocal, setEmailLocal] = useState(initEmail.local);
  const [emailDomain, setEmailDomain] = useState(initEmail.domain);
  const [emailDomainSelect, setEmailDomainSelect] = useState(
    EMAIL_DOMAINS.includes(initEmail.domain) ? initEmail.domain : '직접 입력'
  );
  const email = emailLocal && emailDomain ? `${emailLocal}@${emailDomain}` : '';

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
    <form onSubmit={handleSubmit} className="w-full max-w-xl mx-auto bg-surface rounded-2xl shadow-lg font-sans">
      {/* 헤더 */}
      <div className="px-8 py-6 space-y-6">
        {/* 프로필 이미지 업로드 */}
        <div>
          <label className="block text-sm font-semibold mb-2 text-foreground">프로필 이미지(선택)</label>
          <div
            className="w-full h-32 flex items-center justify-center border-2 border-dashed border-border rounded-xl cursor-pointer bg-muted/30 hover:bg-muted/50 transition"
            onClick={() => fileInputRef.current?.click()}
          >
            {imagePreview ? (
              <img src={imagePreview} alt="미리보기" className="h-full object-contain" />
            ) : (
              <span className="text-muted-foreground text-sm">클릭하여 이미지 업로드 (JPG, PNG 최대 10MB)</span>
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
          <label className="block text-sm font-semibold mb-2 text-foreground">닉네임</label>
          <input
            type="text"
            value={nickname}
            onChange={e => setNickname(e.target.value)}
            className="w-full border border-border rounded-xl px-3 py-2 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="닉네임을 입력하세요."
            required
          />
        </div>
        {/* 이메일 — 로컬 계정만 표시 */}
        {isLocal && (
          <div>
            <label className="block text-sm font-semibold mb-2 text-foreground">이메일</label>
            <div className="flex items-center gap-1.5">
              {/* 로컬파트 */}
              <input
                type="text"
                value={emailLocal}
                onChange={e => setEmailLocal(e.target.value.replace(/\s/g, ''))}
                className="flex-1 min-w-0 border border-border rounded-xl px-3 py-2 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="이메일 아이디"
                required
              />
              <span className="text-foreground font-semibold shrink-0">@</span>
              {/* 도메인 직접입력 */}
              <input
                type="text"
                value={emailDomain}
                onChange={e => {
                  setEmailDomain(e.target.value.replace(/\s/g, ''));
                  setEmailDomainSelect('직접 입력');
                }}
                className="flex-1 min-w-0 border border-border rounded-xl px-3 py-2 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="도메인 직접 입력"
                required
              />
              {/* 도메인 드롭다운 */}
              <select
                value={emailDomainSelect}
                onChange={e => {
                  const val = e.target.value;
                  setEmailDomainSelect(val);
                  if (val !== '직접 입력') setEmailDomain(val);
                  else setEmailDomain('');
                }}
                className="shrink-0 border border-border rounded-xl px-2 py-2 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm cursor-pointer"
              >
                {EMAIL_DOMAINS.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
          </div>
        )}
        {/* 기술 스택 선택 */}
        <div className="flex flex-col gap-1">
          <label className="text-sm font-semibold">기술스택 (최대 5개)</label>
          <button
            type="button"
            onClick={() => setIsTechStackModalOpen(true)}
            className="flex flex-wrap items-center gap-1.5 w-full min-h-[46px] px-3 py-2 border border-border rounded-xl bg-background text-left hover:bg-muted/30 transition-colors cursor-pointer"
          >
            {techStacks.length > 0 ? (
              <>
                {techStacks.map(tag => (
                  <span key={tag} className="flex items-center gap-1 px-2.5 py-1 bg-primary/10 text-primary text-xs font-semibold rounded-lg">
                    {tag}
                    <button type="button" onClick={(e) => { e.stopPropagation(); setTechStacks(prev => prev.filter(t => t !== tag)); }} className="flex items-center justify-center w-3.5 h-3.5 rounded-full hover:bg-primary/30 transition-colors shrink-0"><svg xmlns="http://www.w3.org/2000/svg" width="8" height="8" viewBox="0 0 10 10" fill="currentColor"><path d="M1 1l8 8M9 1l-8 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg></button>
                  </span>
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
                className="w-full flex items-center border border-border rounded-xl px-3 py-2 bg-surface text-foreground focus:outline-none focus:ring-2 focus:ring-primary hover:bg-blue-50 transition-colors cursor-pointer"
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
          className="px-6 py-2 rounded-xl bg-muted text-foreground font-semibold hover:bg-muted/60 transition-colors shadow-sm text-sm cursor-pointer"
        >
          취소
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2 rounded-xl bg-primary text-primary-foreground font-bold hover:bg-primary/80 transition-colors shadow-sm text-sm cursor-pointer disabled:cursor-not-allowed"
        >
          {loading ? '저장 중...' : '저장'}
        </button>
      </div>
    </form>
  );
};

export default ProfileEditForm;
