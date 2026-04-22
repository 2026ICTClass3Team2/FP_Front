import React, { useState, useEffect } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import PasswordValidation from '../../components/auth/PasswordValidation';

const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();

  const [tokenValid, setTokenValid] = useState(null); // null=검증중, true=유효, false=무효
  const [newPassword, setNewPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
  const [passwordValidations, setPasswordValidations] = useState({
    combo: false,
    length: false,
    noConsecutive: false,
  });
  const [passwordConfirmError, setPasswordConfirmError] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const testURI = import.meta.env.DEV ? 'http://localhost:8090/api/' : '/api/';

  // 페이지 진입 시 토큰 유효성 검사
  useEffect(() => {
    if (!token) {
      setTokenValid(false);
      return;
    }
    fetch(`${testURI}member/password/verify-token?token=${token}`)
      .then((res) => res.json())
      .then((data) => setTokenValid(data.valid === true))
      .catch(() => setTokenValid(false));
  }, [token, testURI]);

  const handlePasswordChange = (e) => {
    const value = e.target.value;
    setNewPassword(value);
    const hasLetter = /[a-zA-Z]/.test(value);
    const hasNumber = /[0-9]/.test(value);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(value);
    const comboCount = [hasLetter, hasNumber, hasSpecial].filter(Boolean).length;
    setPasswordValidations({
      combo: comboCount >= 2,
      length: value.length >= 8 && value.length <= 32 && !/\s/.test(value),
      noConsecutive: value.length > 0 && !/(.)\1\1/.test(value),
    });
    if (passwordConfirm.length > 0 && value !== passwordConfirm) {
      setPasswordConfirmError('❌ 비밀번호가 일치하지 않습니다.');
    } else {
      setPasswordConfirmError('');
    }
  };

  const handleConfirmChange = (e) => {
    const value = e.target.value;
    setPasswordConfirm(value);
    if (value.length > 0 && newPassword !== value) {
      setPasswordConfirmError('❌ 비밀번호가 일치하지 않습니다.');
    } else {
      setPasswordConfirmError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!Object.values(passwordValidations).every(Boolean)) {
      return setError('비밀번호가 유효성 조건을 만족하지 않습니다.');
    }
    if (newPassword !== passwordConfirm) {
      return setError('비밀번호가 일치하지 않습니다.');
    }
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`${testURI}member/password/reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword }),
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess(true);
      } else {
        setError(data.error || '비밀번호 변경에 실패했습니다.');
        if (data.error?.includes('만료') || data.error?.includes('유효하지')) {
          setTokenValid(false);
        }
      }
    } catch {
      setError('서버와 통신 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 토큰 검증 중
  if (tokenValid === null) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">링크를 확인하는 중...</p>
      </div>
    );
  }

  // 토큰 무효 또는 없음
  if (!tokenValid) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background p-4">
        <div className="bg-card p-8 rounded-2xl shadow-sm w-full max-w-md border border-border text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-destructive" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-2">링크가 유효하지 않습니다</h2>
          <p className="text-muted-foreground text-sm mb-6">
            비밀번호 재설정 링크가 만료되었거나 이미 사용된 링크입니다.<br />
            다시 요청해 주세요.
          </p>
          <Link
            to="/forgot-password"
            className="inline-block px-6 py-2.5 bg-primary text-primary-foreground rounded-xl font-bold hover:opacity-90 transition-opacity"
          >
            다시 요청하기
          </Link>
        </div>
      </div>
    );
  }

  // 변경 완료
  if (success) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background p-4">
        <div className="bg-card p-8 rounded-2xl shadow-sm w-full max-w-md border border-border text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-2">비밀번호 변경 완료</h2>
          <p className="text-muted-foreground text-sm mb-6">
            비밀번호가 성공적으로 변경되었습니다.<br />새 비밀번호로 로그인해 주세요.
          </p>
          <Link
            to="/login"
            className="inline-block px-6 py-2.5 bg-primary text-primary-foreground rounded-xl font-bold hover:opacity-90 transition-opacity"
          >
            로그인하기
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <div className="bg-card p-8 rounded-2xl shadow-sm w-full max-w-md border border-border">
        <h2 className="text-2xl font-bold mb-2 text-foreground text-center">비밀번호 재설정</h2>
        <p className="text-sm text-muted-foreground text-center mb-6">새로 사용할 비밀번호를 입력해 주세요.</p>

        {error && <div className="bg-destructive/10 text-destructive p-3 rounded-lg mb-4 text-sm text-center">{error}</div>}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5 relative">
            <label className="text-sm font-semibold text-foreground">새 비밀번호</label>
            <input
              type="password"
              value={newPassword}
              onChange={handlePasswordChange}
              onFocus={() => setIsPasswordFocused(true)}
              onBlur={() => setIsPasswordFocused(false)}
              required
              className="px-4 py-2 border border-border rounded-xl bg-background text-foreground focus:outline-none focus:border-primary"
              placeholder="새 비밀번호 입력"
            />
            <PasswordValidation isVisible={isPasswordFocused} validations={passwordValidations} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-foreground">비밀번호 확인</label>
            <input
              type="password"
              value={passwordConfirm}
              onChange={handleConfirmChange}
              required
              className={`px-4 py-2 border rounded-xl bg-background text-foreground focus:outline-none transition-colors ${passwordConfirmError ? 'border-red-500' : 'border-border focus:border-primary'}`}
              placeholder="비밀번호 다시 입력"
            />
            {passwordConfirmError && <p className="text-red-500 text-xs mt-1 font-medium">{passwordConfirmError}</p>}
          </div>
          <button
            type="submit"
            disabled={loading}
            className="mt-2 w-full py-3 bg-primary text-primary-foreground rounded-xl font-bold hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {loading ? '변경 중...' : '비밀번호 변경'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
