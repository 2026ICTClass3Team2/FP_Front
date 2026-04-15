import React, { useState } from 'react';
import Modal from '../common/Modal';
import PasswordValidation from '../auth/PasswordValidation';


const PasswordEditForm = ({ isOpen = true, onSubmit, onCancel }) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showValidation, setShowValidation] = useState(false);

  // 비밀번호 유효성 검사
  const validations = {
    combo: /(?=.*[a-zA-Z])(?=.*[0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>/?]).{2,}/.test(newPassword),
    length: /^\S{8,32}$/.test(newPassword),
    noConsecutive: !/(.)\1\1/.test(newPassword),
  };
  const isPasswordValid = Object.values(validations).every(Boolean);
  const isPasswordMatch = newPassword && confirmPassword && newPassword === confirmPassword;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);
    if (!isPasswordValid) {
      setError('새 비밀번호가 안전하지 않습니다. 조건을 확인해 주세요.');
      setLoading(false);
      return;
    }
    if (!isPasswordMatch) {
      setError('새 비밀번호가 일치하지 않습니다.');
      setLoading(false);
      return;
    }
    try {
      // onSubmit이 setFormError, setFormSuccess를 받을 수 있도록 지원
      await onSubmit({ currentPassword, newPassword }, setError, setSuccess);
      setSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError(err.message || '비밀번호 변경 실패');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onCancel} title="비밀번호 변경">
      <form onSubmit={handleSubmit} className="space-y-6 px-2 py-1">
        <div className="mb-2">
          <label className="block text-sm font-semibold mb-1 text-gray-700">현재 비밀번호</label>
          <input
            type="password"
            value={currentPassword}
            onChange={e => setCurrentPassword(e.target.value)}
            className="w-full border border-gray-300 rounded-xl px-3 py-2 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary transition"
            placeholder="현재 비밀번호를 입력하세요"
            autoComplete="current-password"
            required
          />
        </div>
        <div className="mb-2 relative">
          <label className="block text-sm font-semibold mb-1 text-gray-700 flex items-center gap-1">
            새 비밀번호
            <span className="text-xs text-gray-400 font-normal">(8자 이상, 영문/숫자/특수문자 조합)</span>
          </label>
          <input
            type="password"
            value={newPassword}
            onChange={e => setNewPassword(e.target.value)}
            onFocus={() => setShowValidation(true)}
            onBlur={() => setTimeout(() => setShowValidation(false), 200)}
            className={`w-full border ${isPasswordValid || !newPassword ? 'border-gray-300' : 'border-red-400'} rounded-xl px-3 py-2 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary transition`}
            placeholder="새 비밀번호를 입력하세요"
            autoComplete="new-password"
            required
          />
          <PasswordValidation isVisible={showValidation} validations={validations} />
        </div>
        <div className="mb-2">
          <label className="block text-sm font-semibold mb-1 text-gray-700">새 비밀번호 확인</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            className={`w-full border ${isPasswordMatch || !confirmPassword ? 'border-gray-300' : 'border-red-400'} rounded-xl px-3 py-2 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary transition`}
            placeholder="새 비밀번호를 한 번 더 입력하세요"
            autoComplete="new-password"
            required
          />
          {!isPasswordMatch && confirmPassword && (
            <div className="text-red-500 text-xs mt-1">비밀번호가 일치하지 않습니다.</div>
          )}
        </div>
        {error && <div className="text-red-500 text-sm mt-1">{error}</div>}
        {success && <div className="text-green-600 text-sm mt-1">비밀번호가 성공적으로 변경되었습니다.</div>}
        <div className="flex gap-2 justify-end mt-4">
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
            className="px-6 py-2 rounded-xl bg-blue-500 text-white font-bold hover:bg-blue-600 transition-colors shadow-sm text-sm"
          >
            {loading ? '변경 중...' : '변경'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default PasswordEditForm;
