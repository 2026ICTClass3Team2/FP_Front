import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const testURI = import.meta.env.DEV ? 'http://localhost:8090/api/' : '/api/';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`${testURI}member/password/forgot`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess(true);
      } else {
        setError(data.error || '요청 처리 중 오류가 발생했습니다.');
      }
    } catch {
      setError('서버와 통신 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

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
          <h2 className="text-2xl font-bold text-foreground mb-2">메일을 확인해주세요</h2>
          <p className="text-muted-foreground text-sm mb-6">
            <span className="font-semibold text-foreground">{email}</span> 으로<br />
            비밀번호 재설정 링크를 발송했습니다.<br />
            링크는 30분 동안 유효합니다.
          </p>
          <Link to="/login" className="text-primary font-semibold hover:underline text-sm">
            로그인 페이지로 돌아가기
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <div className="bg-card p-8 rounded-2xl shadow-sm w-full max-w-md border border-border">
        <h2 className="text-2xl font-bold mb-2 text-foreground text-center">비밀번호 찾기</h2>
        <p className="text-sm text-muted-foreground text-center mb-6">
          가입 시 사용한 이메일을 입력하면<br />비밀번호 재설정 링크를 보내드립니다.
        </p>

        {error && <div className="bg-destructive/10 text-destructive p-3 rounded-lg mb-4 text-sm text-center">{error}</div>}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-foreground">이메일</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="px-4 py-2 border border-border rounded-xl bg-background text-foreground focus:outline-none focus:border-primary"
              placeholder="가입한 이메일 주소"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="mt-2 w-full py-3 bg-primary text-primary-foreground rounded-xl font-bold hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {loading ? '전송 중...' : '재설정 메일 보내기'}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-muted-foreground">
          <Link to="/login" className="text-primary font-semibold hover:underline">로그인 페이지로 돌아가기</Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
